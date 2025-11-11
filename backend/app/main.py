"""Main FastAPI application"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db

# Import routers (will be created)
# from app.routers import auth
# from app.routers.admin import campuses, chairs, departments, semesters, reports
# from app.routers import submit

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Adjunct Instructor Tracking System for Southern Union State Community College",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_db()
    print(f"✓ {settings.APP_NAME} started successfully")
    print(f"✓ API Documentation: http://localhost:8000/docs")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


# Include routers
# app.include_router(auth.router, prefix=f"{settings.API_PREFIX}/auth", tags=["Authentication"])
# app.include_router(campuses.router, prefix=f"{settings.API_PREFIX}/admin/campuses", tags=["Admin - Campuses"])
# app.include_router(chairs.router, prefix=f"{settings.API_PREFIX}/admin/chairs", tags=["Admin - Department Chairs"])
# app.include_router(departments.router, prefix=f"{settings.API_PREFIX}/admin/departments", tags=["Admin - Departments"])
# app.include_router(semesters.router, prefix=f"{settings.API_PREFIX}/admin/semesters", tags=["Admin - Semesters"])
# app.include_router(reports.router, prefix=f"{settings.API_PREFIX}/admin/reports", tags=["Admin - Reports"])
# app.include_router(submit.router, prefix=f"{settings.API_PREFIX}/submit", tags=["Department Chair Submission"])
