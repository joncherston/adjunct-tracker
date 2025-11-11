"""
Pydantic schemas for Department
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator


class DepartmentBase(BaseModel):
    """Base schema for department"""
    name: str
    chair_id: Optional[int] = None

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        """Validate department name"""
        if not v or not v.strip():
            raise ValueError('Department name is required')
        if len(v.strip()) < 2:
            raise ValueError('Department name must be at least 2 characters')
        if len(v.strip()) > 100:
            raise ValueError('Department name must not exceed 100 characters')
        return v.strip()


class DepartmentCreate(DepartmentBase):
    """Schema for creating a department"""
    pass


class DepartmentUpdate(DepartmentBase):
    """Schema for updating a department"""
    pass


class DepartmentChairInfo(BaseModel):
    """Nested schema for department chair info"""
    id: int
    full_name: str
    email: str

    model_config = {
        "from_attributes": True
    }


class DepartmentResponse(BaseModel):
    """Schema for department response"""
    id: int
    name: str
    chair_id: Optional[int]
    chair: Optional[DepartmentChairInfo] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }
