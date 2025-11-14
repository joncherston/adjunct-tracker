# New Features Added - User Management & Profile Editing

## Overview

Based on features developed during the POC (Proof of Concept) deployment with Claude Desktop, two major feature sets have been integrated into the main codebase:

1. **User Management System** - Full CRUD for managing admin users
2. **Profile Editing** - Allows admins to edit their own profile and change password

## Features Implemented

### 1. User Management System

**Location:** `/users` (accessible from Dashboard → Manage Users)

**Capabilities:**
- ✅ View all admin users in a searchable table
- ✅ Add new admin users with email, name, and password
- ✅ Edit existing users (update name, email, active status)
- ✅ Reset any user's password
- ✅ Activate/deactivate users (soft disable)
- ✅ Delete users permanently
- ✅ Search users by name or email

**Safety Features:**
- Users cannot delete their own account
- Users cannot deactivate their own account
- Current user is clearly marked with "(You)" label
- Confirmation dialogs for destructive actions
- Email uniqueness validation
- Password strength requirements (8+ characters)

**UI Components:**
- Main user list with avatar initials
- Status badges (Active/Inactive)
- Action icons for each user
- UserModal for add/edit operations
- PasswordResetModal for admin password resets
- ConfirmDialog for delete confirmations
- Real-time search functionality

**Backend API Endpoints:**
```
GET    /api/admin/users           - List all users
POST   /api/admin/users           - Create new user
PUT    /api/admin/users/{id}      - Update user
POST   /api/admin/users/{id}/reset-password - Reset password
DELETE /api/admin/users/{id}      - Delete user
```

### 2. Profile Editing

**Location:** Navbar → Gold "Profile" button (next to Logout)

**Capabilities:**
- ✅ Edit own name and email
- ✅ Change own password (requires current password)
- ✅ Two-tab interface (Profile Info / Change Password)
- ✅ Real-time validation
- ✅ Changes reflected immediately throughout app

**Security:**
- Current password verification required for password changes
- Password confirmation required
- Email uniqueness validation
- Password strength requirements (8+ characters)

**UI Components:**
- ProfileModal with tabbed interface
- Profile tab for name/email updates
- Password tab with current/new/confirm fields
- Integrated into Dashboard navbar
- Gold button styling to stand out

**Backend API Endpoints:**
```
GET  /api/admin/profile                - Get current user's profile
PUT  /api/admin/profile                - Update own profile
POST /api/admin/profile/change-password - Change own password
```

## Technical Implementation

### Backend Changes

**New Files:**
- `backend/app/routers/admin/users.py` - User management endpoints (237 lines)
- `backend/app/routers/admin/profile.py` - Profile management endpoints (104 lines)

**Modified Files:**
- `backend/app/main.py` - Registered new routers

**Features:**
- Pydantic v2 validation with `@field_validator`
- Password hashing with bcrypt
- JWT authentication required
- SQLAlchemy ORM for database operations
- Proper error handling and HTTP status codes

### Frontend Changes

**New Components:**
- `frontend/src/components/admin/Users.jsx` - Main user management page (331 lines)
- `frontend/src/components/admin/UserModal.jsx` - Add/edit user modal (198 lines)
- `frontend/src/components/admin/PasswordResetModal.jsx` - Password reset modal (119 lines)
- `frontend/src/components/admin/ConfirmDialog.jsx` - Reusable confirmation dialog (56 lines)
- `frontend/src/components/admin/ProfileModal.jsx` - Profile editing modal (310 lines)

**Modified Components:**
- `frontend/src/components/dashboard/Dashboard.jsx` - Added Profile button and Manage Users link
- `frontend/src/contexts/AuthContext.jsx` - Added `updateUser()` function
- `frontend/src/App.jsx` - Added `/users` route

**Features:**
- React hooks (useState, useEffect)
- Toast notifications (react-hot-toast)
- Lucide icons
- Tailwind CSS styling (SUSCC branding)
- Real-time search/filtering
- Loading states and spinners
- Proper form validation
- Responsive design (mobile, tablet, desktop)

## Usage Instructions

### For Administrators

**Managing Users:**
1. Log into the admin dashboard
2. Click "Manage Users" from Quick Actions (or navigate to `/users`)
3. View the list of all admin users
4. Use the search bar to find specific users
5. Click action icons to:
   - ✏️ Edit - Update user details
   - 🔑 Reset Password - Set a new password for the user
   - 👤 Toggle Active - Activate or deactivate the user
   - 🗑️ Delete - Permanently remove the user

**Adding a New User:**
1. Click the "Add User" button
2. Fill in:
   - Full Name (e.g., "Dr. Jane Smith")
   - Email Address (e.g., "jane.smith@suscc.edu")
   - Password (minimum 8 characters)
   - Confirm Password
3. Click "Create User"
4. The new user can now log in with their credentials

**Editing Your Profile:**
1. Click the gold "Profile" button in the top right navbar
2. **Profile Info tab:**
   - Update your name
   - Update your email address
   - Click "Save Changes"
3. **Change Password tab:**
   - Enter your current password
   - Enter your new password (minimum 8 characters)
   - Confirm your new password
   - Click "Change Password"
4. Changes are applied immediately

### First-Time Setup

After deploying the application for the first time, you'll need at least one admin user to get started. The default admin account created by the seed script is:

```
Email: admin@suscholarsbowl.com
Password: ChangeMe123!
```

**IMPORTANT:** Log in immediately after deployment and:
1. Change the default admin password
2. Update the admin email if needed
3. Create additional admin users as needed

## Security Considerations

### Authentication
- All endpoints require JWT authentication
- Tokens stored securely in localStorage
- Automatic logout on token expiration

### Password Security
- Passwords hashed using bcrypt
- Minimum 8 character requirement
- Password confirmation required
- Current password verification for changes

### Data Validation
- Email format validation
- Email uniqueness enforcement
- Password strength requirements
- Trim whitespace from inputs
- Prevent self-deletion/deactivation

### Authorization
- Only authenticated admins can access user management
- Users can only edit their own profile
- Users cannot modify/delete themselves
- Proper error messages (no information leakage)

## Database Schema

No database changes required - uses existing `users` table:

```sql
Table: users
- id (integer, primary key)
- email (varchar, unique, indexed)
- password_hash (varchar)
- full_name (varchar)
- is_active (boolean, default true)
- created_at (datetime)
- updated_at (datetime)
```

## API Documentation

Full API documentation available at `/docs` (Swagger UI) when the backend is running.

Key endpoints:

**User Management:**
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user (requires: email, full_name, password)
- `PUT /api/admin/users/{id}` - Update user (optional: email, full_name, is_active)
- `POST /api/admin/users/{id}/reset-password` - Reset password (requires: new_password)
- `DELETE /api/admin/users/{id}` - Delete user

**Profile Management:**
- `GET /api/admin/profile` - Get own profile
- `PUT /api/admin/profile` - Update own profile (optional: email, full_name)
- `POST /api/admin/profile/change-password` - Change password (requires: current_password, new_password, confirm_password)

## Testing

### Manual Testing Checklist

**User Management:**
- [ ] Create a new user
- [ ] Search for users
- [ ] Edit a user's name
- [ ] Edit a user's email
- [ ] Reset a user's password
- [ ] Deactivate a user (verify they cannot log in)
- [ ] Reactivate a user
- [ ] Delete a user
- [ ] Verify you cannot delete yourself
- [ ] Verify you cannot deactivate yourself

**Profile Editing:**
- [ ] Update your name
- [ ] Update your email
- [ ] Change your password
- [ ] Verify old password no longer works
- [ ] Verify new password works
- [ ] Test incorrect current password (should fail)
- [ ] Test mismatched passwords (should fail)

### Build Verification

The frontend has been tested and builds successfully:

```bash
cd frontend
npm run build
# ✓ built in 7.38s
# No errors or warnings
```

## Troubleshooting

### "Failed to load users"
- Check that backend is running
- Verify JWT token is valid (try logging out and back in)
- Check browser console for detailed error

### "Email already registered"
- Email must be unique across all users
- Try a different email address

### "Password must be at least 8 characters"
- Ensure password meets minimum length requirement
- Use a mix of letters, numbers, and symbols for security

### "Current password is incorrect"
- Verify you're entering the correct current password
- Password is case-sensitive

### Cannot delete/deactivate own account
- This is intentional for safety
- Have another admin modify your account if needed

## Future Enhancements

Potential improvements for future releases:

- [ ] User roles/permissions (admin, viewer, etc.)
- [ ] Email verification for new users
- [ ] Password complexity requirements (uppercase, numbers, symbols)
- [ ] Account lockout after failed login attempts
- [ ] Activity log (who created/modified/deleted users)
- [ ] Bulk user operations (import, export, bulk delete)
- [ ] User profile pictures (avatar upload)
- [ ] Two-factor authentication (2FA)
- [ ] Session management (view active sessions, force logout)
- [ ] Email notifications on password changes

## Deployment Notes

These features are **production-ready** and included in the main branch. They will be automatically deployed when you set up the application on your Ubuntu server.

**No additional configuration required** - just deploy the application normally and the features will be available immediately.

See `DEPLOYMENT.md` for full deployment instructions.

## Support

For issues or questions:
- Check the browser console for error messages
- Check backend logs: `journalctl -u adjunct-tracker -n 50`
- Review this document for usage instructions
- Contact the development team

---

**Version:** 1.1.0
**Date Added:** 2024-11-14
**Status:** Production Ready ✅
