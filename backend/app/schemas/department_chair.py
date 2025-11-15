"""
Pydantic schemas for Department Chair
"""
from datetime import datetime
from typing import List
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


class DepartmentInfo(BaseModel):
    """Nested schema for department info"""
    id: int
    name: str

    model_config = {
        "from_attributes": True
    }


class DepartmentChairResponse(DepartmentChairBase):
    """Schema for department chair response"""
    id: int
    is_active: bool
    departments: List[DepartmentInfo] = []
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }
