"""
Semester Management Routes
Admin endpoints for managing semesters and requests
"""
from typing import List
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.user import User
from app.models.semester import Semester, SemesterRequest
from app.models.department import Department
from app.models.department_chair import DepartmentChair
from app.schemas.semester import (
    SemesterCreate,
    SemesterUpdate,
    SemesterResponse,
    SemesterRequestResponse,
    SendReminderRequest
)
from app.utils.dependencies import get_current_active_user
from app.utils.email import send_semester_request_email, send_reminder_email
from app.config import settings

router = APIRouter()


@router.get("", response_model=List[SemesterResponse])
async def get_semesters(
    include_inactive: bool = False,
    include_requests: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all semesters

    - **include_inactive**: If True, includes inactive semesters (default: False)
    - **include_requests**: If True, includes all semester requests (default: False)
    """
    query = db.query(Semester)

    if include_requests:
        query = query.options(
            joinedload(Semester.requests).joinedload(SemesterRequest.department)
        )

    if not include_inactive:
        query = query.filter(Semester.is_active == True)

    semesters = query.order_by(Semester.year.desc(), Semester.semester_type).all()
    return semesters


@router.get("/{semester_id}", response_model=SemesterResponse)
async def get_semester(
    semester_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a single semester by ID with all its requests"""
    semester = db.query(Semester).options(
        joinedload(Semester.requests).joinedload(SemesterRequest.department)
    ).filter(Semester.id == semester_id).first()

    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")

    return semester


@router.post("", response_model=SemesterResponse, status_code=201)
async def create_semester(
    semester_data: SemesterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new semester and send requests to departments

    This will:
    1. Create the semester
    2. Create semester requests for each department
    3. Send email notifications to department chairs
    """
    # Check if semester already exists
    existing_semester = db.query(Semester).filter(
        Semester.semester_type == semester_data.semester_type,
        Semester.year == semester_data.year
    ).first()

    if existing_semester:
        raise HTTPException(
            status_code=400,
            detail=f"{semester_data.semester_type} {semester_data.year} semester already exists"
        )

    # Validate that all departments exist
    if not semester_data.department_ids:
        raise HTTPException(
            status_code=400,
            detail="At least one department must be selected"
        )

    departments = db.query(Department).filter(
        Department.id.in_(semester_data.department_ids),
        Department.is_active == True
    ).all()

    if len(departments) != len(semester_data.department_ids):
        raise HTTPException(
            status_code=400,
            detail="One or more selected departments not found or inactive"
        )

    # Create semester
    semester = Semester(
        semester_type=semester_data.semester_type,
        year=semester_data.year,
        deadline=semester_data.deadline,
        custom_message=semester_data.custom_message,
        created_by_user_id=current_user.id
    )

    db.add(semester)
    db.flush()  # Get the semester ID

    # Create semester requests for each department
    email_errors = []
    successful_requests = []

    for department in departments:
        # Generate unique access token
        access_token = str(uuid.uuid4())

        # Create semester request
        semester_request = SemesterRequest(
            semester_id=semester.id,
            department_id=department.id,
            access_token=access_token
        )
        db.add(semester_request)
        db.flush()

        # Send email to department chair (if assigned)
        if department.chair:
            try:
                # Generate access URL
                access_url = f"{settings.FRONTEND_URL}/submit/{access_token}"

                deadline_str = semester_data.deadline.strftime('%B %d, %Y') if semester_data.deadline else None

                send_semester_request_email(
                    to_email=department.chair.email,
                    to_name=department.chair.full_name,
                    department_name=department.name,
                    semester_name=semester.display_name,
                    access_url=access_url,
                    deadline=deadline_str,
                    custom_message=semester_data.custom_message
                )
                successful_requests.append(department.name)
            except Exception as e:
                print(f"Error sending email to {department.chair.email}: {e}")
                email_errors.append(f"{department.name} ({department.chair.email})")
        else:
            # No chair assigned
            email_errors.append(f"{department.name} (no chair assigned)")

    db.commit()
    db.refresh(semester)

    # Load requests for response
    db.refresh(semester, ['requests'])

    # If there were email errors, include them in a warning
    if email_errors:
        print(f"WARNING: Failed to send emails to: {', '.join(email_errors)}")

    return semester


@router.put("/{semester_id}", response_model=SemesterResponse)
async def update_semester(
    semester_id: int,
    semester_data: SemesterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update semester details (deadline, custom message, or active status)"""
    semester = db.query(Semester).filter(Semester.id == semester_id).first()

    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")

    # Update fields if provided
    if semester_data.deadline is not None:
        semester.deadline = semester_data.deadline

    if semester_data.custom_message is not None:
        semester.custom_message = semester_data.custom_message

    if semester_data.is_active is not None:
        semester.is_active = semester_data.is_active

    db.commit()
    db.refresh(semester)

    return semester


@router.post("/{semester_id}/send-reminders", status_code=200)
async def send_reminders(
    semester_id: int,
    reminder_data: SendReminderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Send reminder emails to specific department chairs"""
    semester = db.query(Semester).filter(Semester.id == semester_id).first()

    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")

    # Get the semester requests
    requests = db.query(SemesterRequest).options(
        joinedload(SemesterRequest.department).joinedload(Department.chair)
    ).filter(
        SemesterRequest.id.in_(reminder_data.request_ids),
        SemesterRequest.semester_id == semester_id
    ).all()

    if len(requests) != len(reminder_data.request_ids):
        raise HTTPException(
            status_code=400,
            detail="One or more request IDs not found or don't belong to this semester"
        )

    email_errors = []
    successful_reminders = []

    for request in requests:
        department = request.department

        if not department.chair:
            email_errors.append(f"{department.name} (no chair assigned)")
            continue

        try:
            access_url = f"{settings.FRONTEND_URL}/submit/{request.access_token}"
            deadline_str = semester.deadline.strftime('%B %d, %Y') if semester.deadline else None

            send_reminder_email(
                to_email=department.chair.email,
                to_name=department.chair.full_name,
                department_name=department.name,
                semester_name=semester.display_name,
                access_url=access_url,
                deadline=deadline_str
            )

            # Update last_reminded_at timestamp
            request.last_reminded_at = datetime.utcnow()
            successful_reminders.append(department.name)

        except Exception as e:
            print(f"Error sending reminder to {department.chair.email}: {e}")
            email_errors.append(f"{department.name} ({department.chair.email})")

    db.commit()

    return {
        "message": f"Reminders sent successfully to {len(successful_reminders)} department(s)",
        "successful": successful_reminders,
        "failed": email_errors
    }


@router.delete("/{semester_id}", status_code=204)
async def delete_semester(
    semester_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a semester (soft delete)

    Marks the semester as inactive rather than removing from database
    """
    semester = db.query(Semester).filter(Semester.id == semester_id).first()

    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")

    # Soft delete - mark as inactive
    semester.is_active = False
    db.commit()

    return None
