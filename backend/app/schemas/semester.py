"""
Pydantic schemas for Semester and SemesterRequest
"""
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, field_validator


class SemesterBase(BaseModel):
    """Base schema for semester"""
    semester_type: str
    year: int
    deadline: Optional[date] = None
    custom_message: Optional[str] = None

    @field_validator('semester_type')
    @classmethod
    def validate_semester_type(cls, v):
        """Validate semester type"""
        valid_types = ['Fall', 'Spring', 'Summer']
        if v not in valid_types:
            raise ValueError(f'Semester type must be one of: {", ".join(valid_types)}')
        return v

    @field_validator('year')
    @classmethod
    def validate_year(cls, v):
        """Validate year is reasonable"""
        if v < 2020 or v > 2100:
            raise ValueError('Year must be between 2020 and 2100')
        return v


class SemesterCreate(SemesterBase):
    """Schema for creating a semester"""
    department_ids: List[int]  # List of department IDs to create requests for


class SemesterUpdate(BaseModel):
    """Schema for updating a semester"""
    deadline: Optional[date] = None
    custom_message: Optional[str] = None
    is_active: Optional[bool] = None


class ChairInfo(BaseModel):
    """Nested schema for department chair info"""
    id: int
    full_name: str
    email: str

    model_config = {
        "from_attributes": True
    }


class DepartmentInfo(BaseModel):
    """Nested schema for department info"""
    id: int
    name: str
    chair_id: Optional[int]
    chair: Optional[ChairInfo] = None

    model_config = {
        "from_attributes": True
    }


class SemesterRequestInfo(BaseModel):
    """Schema for semester request info"""
    id: int
    department_id: int
    department: DepartmentInfo
    access_token: str
    is_submitted: bool
    submitted_at: Optional[datetime]
    last_reminded_at: Optional[datetime]
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


class SemesterResponse(BaseModel):
    """Schema for semester response"""
    id: int
    semester_type: str
    year: int
    deadline: Optional[date]
    custom_message: Optional[str]
    is_active: bool
    created_by_user_id: int
    created_at: datetime
    updated_at: datetime
    display_name: str

    # Optional - only included when requested
    requests: Optional[List[SemesterRequestInfo]] = None

    model_config = {
        "from_attributes": True
    }


class SemesterRequestResponse(BaseModel):
    """Schema for semester request response"""
    id: int
    semester_id: int
    department_id: int
    access_token: str
    is_submitted: bool
    submitted_at: Optional[datetime]
    last_reminded_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class SendReminderRequest(BaseModel):
    """Schema for sending reminder emails"""
    request_ids: List[int]  # List of semester request IDs to send reminders to
