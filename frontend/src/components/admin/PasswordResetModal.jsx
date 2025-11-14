/**
 * Password Reset Modal Component
 * Modal for resetting a user's password
 */
import { useState } from 'react';
import { X, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const PasswordResetModal = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!formData.new_password) {
      newErrors.new_password = 'Password is required';
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters';
    }

    if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
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
      const response = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ new_password: formData.new_password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to reset password');
      }

      toast.success('Password reset successfully');
      onSuccess();
    } catch (error) {
      console.error('Error resetting password:', error);
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
          <h2 className="text-xl font-bold">Reset Password</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-suscc-gold transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-gray-600 mb-4">
            Reset password for <span className="font-semibold">{user?.full_name}</span>
          </p>

          {/* New Password */}
          <div className="mb-4">
            <label className="label">
              <Lock className="h-4 w-4 inline mr-2" />
              New Password *
            </label>
            <input
              type="password"
              value={formData.new_password}
              onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
              className={`input ${errors.new_password ? 'input-error' : ''}`}
              placeholder="At least 8 characters"
              autoFocus
            />
            {errors.new_password && (
              <p className="error-message">{errors.new_password}</p>
            )}
          </div>

          {/* Confirm Password */}
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
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordResetModal;
