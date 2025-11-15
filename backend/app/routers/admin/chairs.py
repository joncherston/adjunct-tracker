"""
Department Chair Management Routes
Admin endpoints for managing department chairs
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.user import User
from app.models.department_chair import DepartmentChair
from app.schemas.department_chair import (
    DepartmentChairCreate,
    DepartmentChairUpdate,
    DepartmentChairResponse
)
from app.utils.dependencies import get_current_active_user

router = APIRouter()


@router.get("", response_model=List[DepartmentChairResponse])
async def get_department_chairs(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all department chairs

    - **include_inactive**: If True, includes inactive chairs (default: False)
    """
    query = db.query(DepartmentChair).options(joinedload(DepartmentChair.departments))

    if not include_inactive:
        query = query.filter(DepartmentChair.is_active == True)

    chairs = query.order_by(DepartmentChair.full_name).all()
    return chairs


@router.get("/{chair_id}", response_model=DepartmentChairResponse)
async def get_department_chair(
    chair_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a single department chair by ID"""
    chair = db.query(DepartmentChair).options(
        joinedload(DepartmentChair.departments)
    ).filter(DepartmentChair.id == chair_id).first()

    if not chair:
        raise HTTPException(status_code=404, detail="Department chair not found")

    return chair


@router.post("", response_model=DepartmentChairResponse, status_code=201)
async def create_department_chair(
    chair_data: DepartmentChairCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new department chair

    Validates that the email is unique
    """
    # Check if email already exists
    existing_chair = db.query(DepartmentChair).filter(
        DepartmentChair.email.ilike(chair_data.email)
    ).first()

    if existing_chair:
        raise HTTPException(
            status_code=400,
            detail=f"Department chair with email '{chair_data.email}' already exists"
        )

    # Create new department chair
    chair = DepartmentChair(
        full_name=chair_data.full_name,
        email=chair_data.email.lower()
    )

    db.add(chair)
    db.commit()
    db.refresh(chair)

    # Reload with departments
    chair = db.query(DepartmentChair).options(
        joinedload(DepartmentChair.departments)
    ).filter(DepartmentChair.id == chair.id).first()

    return chair


@router.put("/{chair_id}", response_model=DepartmentChairResponse)
async def update_department_chair(
    chair_id: int,
    chair_data: DepartmentChairUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a department chair

    Validates that the new email is unique (if changed)
    """
    # Get existing chair
    chair = db.query(DepartmentChair).filter(DepartmentChair.id == chair_id).first()

    if not chair:
        raise HTTPException(status_code=404, detail="Department chair not found")

    # Check if email is being changed and if new email already exists
    if chair_data.email.lower() != chair.email.lower():
        existing_chair = db.query(DepartmentChair).filter(
            DepartmentChair.email.ilike(chair_data.email),
            DepartmentChair.id != chair_id
        ).first()

        if existing_chair:
            raise HTTPException(
                status_code=400,
                detail=f"Department chair with email '{chair_data.email}' already exists"
            )

    # Update chair
    chair.full_name = chair_data.full_name
    chair.email = chair_data.email.lower()

    db.commit()
    db.refresh(chair)

    # Reload with departments
    chair = db.query(DepartmentChair).options(
        joinedload(DepartmentChair.departments)
    ).filter(DepartmentChair.id == chair.id).first()

    return chair


@router.delete("/{chair_id}", status_code=204)
async def delete_department_chair(
    chair_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a department chair (soft delete)

    Marks the chair as inactive rather than removing from database
    """
    chair = db.query(DepartmentChair).filter(DepartmentChair.id == chair_id).first()

    if not chair:
        raise HTTPException(status_code=404, detail="Department chair not found")

    # Soft delete - mark as inactive
    chair.is_active = False
    db.commit()

    return None
