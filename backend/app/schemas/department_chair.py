"""
Pydantic schemas for Department Chair
"""
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator


class DepartmentChairBase(BaseModel):
    """Base schema for department chair"""
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


class DepartmentChairCreate(DepartmentChairBase):
    """Schema for creating a department chair"""
    pass


class DepartmentChairUpdate(DepartmentChairBase):
    """Schema for updating a department chair"""
    pass


class DepartmentChairResponse(DepartmentChairBase):
    """Schema for department chair response"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }
