"""Campus management routes"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.campus import Campus
from app.models.user import User
from app.schemas.campus import CampusCreate, CampusUpdate, CampusResponse
from app.utils.dependencies import get_current_active_user

router = APIRouter()


@router.get("", response_model=List[CampusResponse])
async def get_campuses(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all campuses.

    Args:
        include_inactive: Include inactive campuses (default: False)
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of campuses
    """
    query = db.query(Campus)

    if not include_inactive:
        query = query.filter(Campus.is_active == True)

    campuses = query.order_by(Campus.name).all()
    return campuses


@router.get("/{campus_id}", response_model=CampusResponse)
async def get_campus(
    campus_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific campus by ID.

    Args:
        campus_id: Campus ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Campus details

    Raises:
        HTTPException: If campus not found
    """
    campus = db.query(Campus).filter(Campus.id == campus_id).first()

    if not campus:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campus with ID {campus_id} not found"
        )

    return campus


@router.post("", response_model=CampusResponse, status_code=status.HTTP_201_CREATED)
async def create_campus(
    campus_data: CampusCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new campus.

    Args:
        campus_data: Campus data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Created campus

    Raises:
        HTTPException: If campus with same name already exists
    """
    # Check if campus with same name already exists
    existing = db.query(Campus).filter(
        Campus.name.ilike(campus_data.name)
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Campus with name '{campus_data.name}' already exists"
        )

    # Create new campus
    campus = Campus(name=campus_data.name)
    db.add(campus)
    db.commit()
    db.refresh(campus)

    return campus


@router.put("/{campus_id}", response_model=CampusResponse)
async def update_campus(
    campus_id: int,
    campus_data: CampusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a campus.

    Args:
        campus_id: Campus ID
        campus_data: Updated campus data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Updated campus

    Raises:
        HTTPException: If campus not found or name conflict
    """
    # Get campus
    campus = db.query(Campus).filter(Campus.id == campus_id).first()

    if not campus:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campus with ID {campus_id} not found"
        )

    # Check if another campus with same name exists
    existing = db.query(Campus).filter(
        Campus.name.ilike(campus_data.name),
        Campus.id != campus_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Campus with name '{campus_data.name}' already exists"
        )

    # Update campus
    campus.name = campus_data.name
    db.commit()
    db.refresh(campus)

    return campus


@router.delete("/{campus_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_campus(
    campus_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete (deactivate) a campus.

    This is a soft delete - the campus is marked as inactive but not removed from database.
    This preserves historical data.

    Args:
        campus_id: Campus ID
        db: Database session
        current_user: Current authenticated user

    Raises:
        HTTPException: If campus not found
    """
    # Get campus
    campus = db.query(Campus).filter(Campus.id == campus_id).first()

    if not campus:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campus with ID {campus_id} not found"
        )

    # Soft delete - mark as inactive
    campus.is_active = False
    db.commit()

    return None
