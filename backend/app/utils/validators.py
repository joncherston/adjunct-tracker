"""Common validation utilities"""

import re
from typing import Optional


def validate_email(email: str) -> tuple[bool, Optional[str]]:
    """
    Validate email format

    Args:
        email: Email address to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

    if not email:
        return False, "Email is required"

    if not re.match(email_regex, email):
        return False, "Invalid email format"

    return True, None


def validate_semester_type(semester_type: str) -> tuple[bool, Optional[str]]:
    """
    Validate semester type

    Args:
        semester_type: Semester type to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    valid_types = ["Fall", "Spring", "Summer"]

    if semester_type not in valid_types:
        return False, f"Semester type must be one of: {', '.join(valid_types)}"

    return True, None


def validate_year(year: int) -> tuple[bool, Optional[str]]:
    """
    Validate academic year

    Args:
        year: Year to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if year < 2020 or year > 2099:
        return False, "Year must be between 2020 and 2099"

    return True, None


def validate_name(name: str, field_name: str = "Name") -> tuple[bool, Optional[str]]:
    """
    Validate name field (department, person, etc.)

    Args:
        name: Name to validate
        field_name: Name of the field for error messages

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not name or not name.strip():
        return False, f"{field_name} is required"

    if len(name.strip()) < 2:
        return False, f"{field_name} must be at least 2 characters"

    if len(name.strip()) > 100:
        return False, f"{field_name} must be less than 100 characters"

    # Allow letters, spaces, hyphens, apostrophes
    name_regex = r"^[a-zA-Z\s\-']+$"
    if not re.match(name_regex, name.strip()):
        return False, f"{field_name} can only contain letters, spaces, hyphens, and apostrophes"

    return True, None


def validate_course_name(course_name: str) -> tuple[bool, Optional[str]]:
    """
    Validate course name

    Args:
        course_name: Course name to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not course_name or not course_name.strip():
        return False, "Course name is required"

    if len(course_name.strip()) < 2:
        return False, "Course name must be at least 2 characters"

    if len(course_name.strip()) > 100:
        return False, "Course name must be less than 100 characters"

    # Allow letters, numbers, spaces
    course_regex = r"^[a-zA-Z0-9\s]+$"
    if not re.match(course_regex, course_name.strip()):
        return False, "Course name can only contain letters, numbers, and spaces"

    return True, None
