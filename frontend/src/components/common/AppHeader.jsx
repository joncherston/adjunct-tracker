/**
 * App Header Component
 * Reusable header with logo that links back to dashboard
 */
import { useNavigate } from 'react-router-dom';

const AppHeader = ({ icon: Icon, title, subtitle, actions }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Logo - Click to return to dashboard */}
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-shrink-0 hover:opacity-80 transition-opacity"
              title="Back to Dashboard"
            >
              <img
                src="https://jonathanherston.com/wp-content/uploads/2025/11/SU-Logo-1.png"
                alt="Southern Union State Community College"
                className="h-10 w-auto"
              />
            </button>

            {/* Page Icon and Title */}
            {Icon && (
              <div className="bg-suscc-blue p-3 rounded-lg">
                <Icon className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-suscc-blue">{title}</h1>
              {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
            </div>
          </div>

          {/* Action buttons (optional) */}
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
};

export default AppHeader;
