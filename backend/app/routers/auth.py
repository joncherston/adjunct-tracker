"""Authentication routes"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
import secrets

from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    UserResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    MessageResponse,
    TokenResponse
)
from app.utils.security import (
    verify_password,
    hash_password,
    create_access_token,
    create_refresh_token,
    validate_password_strength
)
from app.utils.dependencies import get_current_active_user

router = APIRouter()

# In-memory password reset tokens (in production, use Redis or database)
password_reset_tokens = {}


@router.post("/login", response_model=LoginResponse)
async def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return JWT token.

    Args:
        credentials: Email and password
        db: Database session

    Returns:
        Access token and user information

    Raises:
        HTTPException: If credentials are invalid
    """
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email.lower()).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # Create access token
    access_token = create_access_token(data={"sub": user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    current_user: User = Depends(get_current_active_user)
):
    """
    Refresh access token for authenticated user.

    Args:
        current_user: Current authenticated user

    Returns:
        New access token
    """
    access_token = create_access_token(data={"sub": current_user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/logout", response_model=MessageResponse)
async def logout(
    current_user: User = Depends(get_current_active_user)
):
    """
    Logout user (client should discard token).

    Args:
        current_user: Current authenticated user

    Returns:
        Success message
    """
    # In a stateless JWT setup, logout is handled client-side by discarding the token
    # If using refresh tokens with a database, you would revoke them here

    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current authenticated user information.

    Args:
        current_user: Current authenticated user

    Returns:
        User information
    """
    return UserResponse.model_validate(current_user)


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Request password reset email.

    Args:
        request: Email address
        db: Database session

    Returns:
        Success message (always, for security)
    """
    # Find user by email
    user = db.query(User).filter(User.email == request.email.lower()).first()

    if user and user.is_active:
        # Generate reset token
        reset_token = secrets.token_urlsafe(32)

        # Store token (expires in 1 hour)
        password_reset_tokens[reset_token] = {
            "email": user.email,
            "expires_at": timedelta(hours=1)
        }

        # TODO: Send email with reset link
        # For now, just log it (in production, send via Brevo)
        print(f"Password reset token for {user.email}: {reset_token}")
        print(f"Reset link: {settings.BASE_URL}/reset-password?token={reset_token}")

    # Always return success to prevent email enumeration
    return {"message": "If an account exists with that email, a password reset link has been sent"}


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Reset password using token from email.

    Args:
        request: Reset token and new password
        db: Database session

    Returns:
        Success message

    Raises:
        HTTPException: If token is invalid or expired
    """
    # Validate token
    if request.token not in password_reset_tokens:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    # Get email from token
    token_data = password_reset_tokens[request.token]
    email = token_data["email"]

    # Validate new password
    is_valid, error = validate_password_strength(request.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )

    # Get user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Update password
    user.password_hash = hash_password(request.new_password)
    db.commit()

    # Remove used token
    del password_reset_tokens[request.token]

    return {"message": "Password reset successful"}


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Change password for authenticated user.

    Args:
        request: Current password and new password
        current_user: Current authenticated user
        db: Database session

    Returns:
        Success message

    Raises:
        HTTPException: If current password is incorrect or new password is invalid
    """
    # Verify current password
    if not verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # Validate new password
    is_valid, error = validate_password_strength(request.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )

    # Check if new password is same as current
    if verify_password(request.new_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )

    # Update password
    current_user.password_hash = hash_password(request.new_password)
    db.commit()

    return {"message": "Password changed successfully"}


# Import settings at the bottom to avoid circular imports
from app.config import settings
