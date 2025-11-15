"""
Admin User Management Routes
CRUD operations for managing admin users
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.utils.security import hash_password
from app.utils.dependencies import get_current_active_user
from pydantic import BaseModel, EmailStr, field_validator

router = APIRouter()


# Schemas
class UserCreate(BaseModel):
    """Schema for creating a new user"""
    email: EmailStr
    full_name: str
    password: str

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Full name is required')
        return v.strip()


class UserUpdate(BaseModel):
    """Schema for updating a user"""
    email: EmailStr | None = None
    full_name: str | None = None
    is_active: bool | None = None

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('Full name cannot be empty')
        return v.strip() if v else v


class UserPasswordReset(BaseModel):
    """Schema for resetting a user's password"""
    new_password: str

    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class UserResponse(BaseModel):
    """Schema for user response"""
    id: int
    email: str
    full_name: str
    is_active: bool

    model_config = {
        "from_attributes": True
    }


@router.get("/", response_model=List[UserResponse])
async def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all users (admin only)"""
    users = db.query(User).all()
    return users


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new admin user"""
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    new_user = User(
        email=user_data.email.lower(),
        full_name=user_data.full_name,
        password_hash=hash_password(user_data.password),
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Prevent users from deactivating themselves
    if user_data.is_active is False and user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account"
        )

    # Check email uniqueness if email is being updated
    if user_data.email and user_data.email.lower() != user.email:
        existing = db.query(User).filter(User.email == user_data.email.lower()).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        user.email = user_data.email.lower()

    # Update fields
    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    if user_data.is_active is not None:
        user.is_active = user_data.is_active

    db.commit()
    db.refresh(user)

    return user


@router.post("/{user_id}/reset-password", status_code=status.HTTP_200_OK)
async def reset_user_password(
    user_id: int,
    password_data: UserPasswordReset,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Reset a user's password (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.password_hash = hash_password(password_data.new_password)
    db.commit()

    return {"message": "Password reset successfully"}


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Prevent users from deleting themselves
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account"
        )

    db.delete(user)
    db.commit()

    return None
