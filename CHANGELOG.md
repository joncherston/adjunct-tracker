# Changelog

All notable changes to the SUSCC Adjunct Instructor Tracking System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **Reports Loading Issue** (2025-11-15)
  - Fixed "Failed to load report data" error in Reports page
  - Added explicit SQL table joins for Department and AdjunctInstructor tables
  - Query now properly orders results by department and instructor name
  - Location: `backend/app/routers/admin/reports.py:38-47`

- **"No Chair Assigned" Display Issue** (2025-11-15)
  - Fixed missing chair information in Semester Tracking page
  - Added chair relationship loading to semester requests query
  - Department chairs now properly display in semester tracking view
  - Location: `backend/app/routers/admin/semesters.py:47,65`

### Known Issues
- **Email Notifications**
  - Emails require valid Brevo API key in `.env` file (`BREVO_API_KEY`)
  - If API key is missing/invalid, emails fail silently (logged to console only)
  - To enable emails: Sign up at https://www.brevo.com and add API key to `.env`
  - Email sending is triggered when creating new semester requests (not during bulk import)
  - Bulk imported data is marked as "submitted" and does not trigger email notifications

## [1.1.0] - 2024-11-14

### Added
- User Management System
  - Full CRUD operations for admin users
  - Search users by name or email
  - Password reset functionality
  - Activate/deactivate users
  - Safety features (cannot delete/deactivate own account)

- Profile Editing
  - Edit own name and email
  - Change own password (with current password verification)
  - Tabbed interface for profile info and password changes

### Changed
- Made adjunct instructor email field optional
- Improved bulk import error handling with detailed error messages
- Enhanced dashboard to show active requests dynamically

### Fixed
- Reports schema validation issues
- Campus count display issues
- Bulk import database constraint errors
- Database migration execution order (custom migrations now run before alembic)

## [1.0.0] - Initial Release

### Added
- Admin Dashboard for managing campuses, departments, chairs, and semester requests
- Token-based submission system for department chairs
- Multi-campus support for instructors
- Automated email notifications via SendGrid
- Campus-specific reports with export and print functionality
- Historical data preservation
- Bulk import feature for adjunct instructors
- Multi-campus and course tracking features

### Technical Stack
- **Frontend**: React 18+, Vite, Tailwind CSS, React Router v6
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy 2.0, Alembic
- **Database**: SQLite (upgradeable to PostgreSQL)
- **Authentication**: JWT tokens
- **Email**: SendGrid integration

---

**Legend:**
- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` for vulnerability fixes
