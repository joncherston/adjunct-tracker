"""Department Chair model"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class DepartmentChair(Base):
    """Department Chair model - represents a faculty member who chairs one or more departments"""

    __tablename__ = "department_chairs"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    departments = relationship("Department", back_populates="chair")

    def __repr__(self):
        return f"<DepartmentChair(id={self.id}, full_name='{self.full_name}', email='{self.email}')>"
