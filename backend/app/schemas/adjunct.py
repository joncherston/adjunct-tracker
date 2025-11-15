"""
Pydantic schemas for Adjunct Instructor
"""
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator


class AdjunctInstructorBase(BaseModel):
    """Base schema for adjunct instructor"""
    full_name: str
    email: EmailStr

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v):
        """Validate full name"""
        if not v or not v.strip():
            raise ValueError('Full name is required')
        if len(v.strip()) < 2:
            raise ValueError('Full name must be at least 2 characters')
        if len(v.strip()) > 100:
            raise ValueError('Full name must not exceed 100 characters')
        return v.strip()


class AdjunctInstructorCreate(AdjunctInstructorBase):
    """Schema for creating an adjunct instructor"""
    pass


class AdjunctInstructorUpdate(AdjunctInstructorBase):
    """Schema for updating an adjunct instructor"""
    pass


class AdjunctInstructorResponse(AdjunctInstructorBase):
    """Schema for adjunct instructor response"""
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }
