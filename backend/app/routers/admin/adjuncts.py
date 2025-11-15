"""
Adjunct Instructor Management Routes
Admin endpoints for managing adjunct instructors
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.adjunct import AdjunctInstructor
from app.schemas.adjunct import (
    AdjunctInstructorCreate,
    AdjunctInstructorUpdate,
    AdjunctInstructorResponse
)
from app.utils.dependencies import get_current_active_user

router = APIRouter()


@router.get("", response_model=List[AdjunctInstructorResponse])
async def get_adjunct_instructors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all adjunct instructors
    """
    instructors = db.query(AdjunctInstructor).order_by(AdjunctInstructor.full_name).all()
    return instructors


@router.get("/{instructor_id}", response_model=AdjunctInstructorResponse)
async def get_adjunct_instructor(
    instructor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a single adjunct instructor by ID"""
    instructor = db.query(AdjunctInstructor).filter(AdjunctInstructor.id == instructor_id).first()

    if not instructor:
        raise HTTPException(status_code=404, detail="Adjunct instructor not found")

    return instructor


@router.post("", response_model=AdjunctInstructorResponse, status_code=201)
async def create_adjunct_instructor(
    instructor_data: AdjunctInstructorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new adjunct instructor

    Validates that the email is unique
    """
    # Check if email already exists
    existing_instructor = db.query(AdjunctInstructor).filter(
        AdjunctInstructor.email.ilike(instructor_data.email)
    ).first()

    if existing_instructor:
        raise HTTPException(
            status_code=400,
            detail=f"Adjunct instructor with email '{instructor_data.email}' already exists"
        )

    # Create new adjunct instructor
    instructor = AdjunctInstructor(
        full_name=instructor_data.full_name,
        email=instructor_data.email.lower()
    )

    db.add(instructor)
    db.commit()
    db.refresh(instructor)

    return instructor


@router.put("/{instructor_id}", response_model=AdjunctInstructorResponse)
async def update_adjunct_instructor(
    instructor_id: int,
    instructor_data: AdjunctInstructorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update an adjunct instructor

    Validates that the new email is unique (if changed)
    """
    # Get existing instructor
    instructor = db.query(AdjunctInstructor).filter(AdjunctInstructor.id == instructor_id).first()

    if not instructor:
        raise HTTPException(status_code=404, detail="Adjunct instructor not found")

    # Check if email is being changed and if new email already exists
    if instructor_data.email.lower() != instructor.email.lower():
        existing_instructor = db.query(AdjunctInstructor).filter(
            AdjunctInstructor.email.ilike(instructor_data.email),
            AdjunctInstructor.id != instructor_id
        ).first()

        if existing_instructor:
            raise HTTPException(
                status_code=400,
                detail=f"Adjunct instructor with email '{instructor_data.email}' already exists"
            )

    # Update instructor
    instructor.full_name = instructor_data.full_name
    instructor.email = instructor_data.email.lower()

    db.commit()
    db.refresh(instructor)

    return instructor


@router.delete("/{instructor_id}", status_code=204)
async def delete_adjunct_instructor(
    instructor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete an adjunct instructor

    Note: This permanently deletes the instructor. Instructors with
    existing assignments should not be deleted.
    """
    instructor = db.query(AdjunctInstructor).filter(AdjunctInstructor.id == instructor_id).first()

    if not instructor:
        raise HTTPException(status_code=404, detail="Adjunct instructor not found")

    # Check if instructor has any assignments
    if instructor.assignments:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete instructor with existing semester assignments"
        )

    db.delete(instructor)
    db.commit()

    return None
