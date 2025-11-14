"""
Admin Profile Management Routes
Allows admins to view and edit their own profile
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, field_validator

from app.database import get_db
from app.models.user import User
from app.utils.security import get_current_active_user, hash_password, verify_password

router = APIRouter()


# Schemas
class ProfileResponse(BaseModel):
    """Schema for profile response"""
    id: int
    email: str
    full_name: str
    is_active: bool

    model_config = {
        "from_attributes": True
    }


class ProfileUpdate(BaseModel):
    """Schema for updating profile"""
    email: EmailStr | None = None
    full_name: str | None = None

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('Full name cannot be empty')
        return v.strip() if v else v


class PasswordChange(BaseModel):
    """Schema for changing password"""
    current_password: str
    new_password: str
    confirm_password: str

    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('New password must be at least 8 characters long')
        return v

    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v, info):
        if 'new_password' in info.data and v != info.data['new_password']:
            raise ValueError('Passwords do not match')
        return v


@router.get("/", response_model=ProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's profile"""
    return current_user


@router.put("/", response_model=ProfileResponse)
async def update_profile(
    profile_data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update current user's profile"""
    # Check email uniqueness if email is being updated
    if profile_data.email and profile_data.email.lower() != current_user.email:
        existing = db.query(User).filter(User.email == profile_data.email.lower()).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        current_user.email = profile_data.email.lower()

    # Update full name
    if profile_data.full_name is not None:
        current_user.full_name = profile_data.full_name

    db.commit()
    db.refresh(current_user)

    return current_user


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Change current user's password"""
    # Verify current password
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # Update password
    current_user.password_hash = hash_password(password_data.new_password)
    db.commit()

    return {"message": "Password changed successfully"}
