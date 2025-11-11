"""Campus schemas"""

from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class CampusBase(BaseModel):
    """Base campus schema"""
    name: str

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Campus name is required')
        if len(v.strip()) < 2:
            raise ValueError('Campus name must be at least 2 characters')
        if len(v.strip()) > 100:
            raise ValueError('Campus name must be less than 100 characters')
        return v.strip()


class CampusCreate(CampusBase):
    """Schema for creating a campus"""
    pass


class CampusUpdate(CampusBase):
    """Schema for updating a campus"""
    pass


class CampusResponse(CampusBase):
    """Schema for campus response"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
