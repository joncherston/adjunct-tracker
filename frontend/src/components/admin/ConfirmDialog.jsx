/**
 * Confirm Dialog Component
 * Reusable confirmation dialog
 */
import { AlertTriangle, X } from 'lucide-react';

const ConfirmDialog = ({ title, message, confirmText = 'Confirm', confirmStyle = 'primary', onConfirm, onCancel }) => {
  const confirmButtonClass = confirmStyle === 'danger'
    ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
    : 'btn-primary';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between rounded-t-lg ${
          confirmStyle === 'danger' ? 'bg-red-600' : 'bg-suscc-blue'
        } text-white`}>
          <div className="flex items-center space-x-3">
            {confirmStyle === 'danger' && <AlertTriangle className="h-6 w-6" />}
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-6">{message}</p>

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 rounded-md font-semibold transition-colors ${confirmButtonClass}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
