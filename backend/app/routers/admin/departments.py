"""
Department Management Routes
Admin endpoints for managing departments
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.user import User
from app.models.department import Department
from app.models.department_chair import DepartmentChair
from app.schemas.department import (
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentResponse
)
from app.utils.dependencies import get_current_active_user

router = APIRouter()


@router.get("", response_model=List[DepartmentResponse])
async def get_departments(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all departments

    - **include_inactive**: If True, includes inactive departments (default: False)
    """
    query = db.query(Department).options(joinedload(Department.chair))

    if not include_inactive:
        query = query.filter(Department.is_active == True)

    departments = query.order_by(Department.name).all()
    return departments


@router.get("/{department_id}", response_model=DepartmentResponse)
async def get_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a single department by ID"""
    department = db.query(Department).options(
        joinedload(Department.chair)
    ).filter(Department.id == department_id).first()

    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    return department


@router.post("", response_model=DepartmentResponse, status_code=201)
async def create_department(
    department_data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new department

    Validates that the department name is unique and that the chair exists (if specified)
    """
    # Check if department name already exists
    existing_dept = db.query(Department).filter(
        Department.name.ilike(department_data.name)
    ).first()

    if existing_dept:
        raise HTTPException(
            status_code=400,
            detail=f"Department with name '{department_data.name}' already exists"
        )

    # If chair_id is provided, verify the chair exists and is active
    if department_data.chair_id:
        chair = db.query(DepartmentChair).filter(
            DepartmentChair.id == department_data.chair_id,
            DepartmentChair.is_active == True
        ).first()

        if not chair:
            raise HTTPException(
                status_code=400,
                detail=f"Department chair with ID {department_data.chair_id} not found or inactive"
            )

    # Create new department
    department = Department(
        name=department_data.name,
        chair_id=department_data.chair_id
    )

    db.add(department)
    db.commit()
    db.refresh(department)

    # Load the chair relationship
    db.refresh(department, ['chair'])

    return department


@router.put("/{department_id}", response_model=DepartmentResponse)
async def update_department(
    department_id: int,
    department_data: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a department

    Validates that the new name is unique (if changed) and that the chair exists (if specified)
    """
    # Get existing department
    department = db.query(Department).filter(Department.id == department_id).first()

    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    # Check if name is being changed and if new name already exists
    if department_data.name.lower() != department.name.lower():
        existing_dept = db.query(Department).filter(
            Department.name.ilike(department_data.name),
            Department.id != department_id
        ).first()

        if existing_dept:
            raise HTTPException(
                status_code=400,
                detail=f"Department with name '{department_data.name}' already exists"
            )

    # If chair_id is provided, verify the chair exists and is active
    if department_data.chair_id:
        chair = db.query(DepartmentChair).filter(
            DepartmentChair.id == department_data.chair_id,
            DepartmentChair.is_active == True
        ).first()

        if not chair:
            raise HTTPException(
                status_code=400,
                detail=f"Department chair with ID {department_data.chair_id} not found or inactive"
            )

    # Update department
    department.name = department_data.name
    department.chair_id = department_data.chair_id

    db.commit()
    db.refresh(department)

    # Load the chair relationship
    db.refresh(department, ['chair'])

    return department


@router.delete("/{department_id}", status_code=204)
async def delete_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a department (soft delete)

    Marks the department as inactive rather than removing from database
    """
    department = db.query(Department).filter(Department.id == department_id).first()

    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    # Soft delete - mark as inactive
    department.is_active = False
    db.commit()

    return None
