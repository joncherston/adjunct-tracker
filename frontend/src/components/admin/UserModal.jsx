/**
 * User Modal Component
 * Modal for adding or editing users
 */
import { useState, useEffect } from 'react';
import { X, User, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const UserModal = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        full_name: user.full_name,
        password: '',
        confirm_password: ''
      });
    }
  }, [user]);

  const validate = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!isEditing) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }

      if (formData.password !== formData.confirm_password) {
        newErrors.confirm_password = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const url = isEditing
        ? `/api/admin/users/${user.id}`
        : '/api/admin/users';

      const method = isEditing ? 'PUT' : 'POST';

      const body = isEditing
        ? {
            email: formData.email,
            full_name: formData.full_name
          }
        : {
            email: formData.email,
            full_name: formData.full_name,
            password: formData.password
          };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to save user');
      }

      toast.success(isEditing ? 'User updated successfully' : 'User created successfully');
      onSuccess();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-suscc-blue text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-xl font-bold">
            {isEditing ? 'Edit User' : 'Add New User'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-suscc-gold transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Full Name */}
          <div className="mb-4">
            <label className="label">
              <User className="h-4 w-4 inline mr-2" />
              Full Name *
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className={`input ${errors.full_name ? 'input-error' : ''}`}
              placeholder="John Doe"
            />
            {errors.full_name && (
              <p className="error-message">{errors.full_name}</p>
            )}
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="label">
              <Mail className="h-4 w-4 inline mr-2" />
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`input ${errors.email ? 'input-error' : ''}`}
              placeholder="john.doe@suscc.edu"
            />
            {errors.email && (
              <p className="error-message">{errors.email}</p>
            )}
          </div>

          {/* Password (only for new users) */}
          {!isEditing && (
            <>
              <div className="mb-4">
                <label className="label">
                  <Lock className="h-4 w-4 inline mr-2" />
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`input ${errors.password ? 'input-error' : ''}`}
                  placeholder="At least 8 characters"
                />
                {errors.password && (
                  <p className="error-message">{errors.password}</p>
                )}
              </div>

              <div className="mb-6">
                <label className="label">
                  <Lock className="h-4 w-4 inline mr-2" />
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  className={`input ${errors.confirm_password ? 'input-error' : ''}`}
                  placeholder="Re-enter password"
                />
                {errors.confirm_password && (
                  <p className="error-message">{errors.confirm_password}</p>
                )}
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                isEditing ? 'Update User' : 'Create User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
