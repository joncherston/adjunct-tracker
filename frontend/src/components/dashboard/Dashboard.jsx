/**
 * Admin Dashboard Component
 * Main dashboard for admin users
 */
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Home, Users, Building2, GraduationCap, Calendar } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-suscc-blue shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="bg-white rounded-full w-10 h-10 flex items-center justify-center">
                  <span className="text-suscc-blue font-bold text-xl">SU</span>
                </div>
                <span className="ml-3 text-white font-bold text-xl">
                  Adjunct Tracker
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white">
                {user?.full_name}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-white text-suscc-blue px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-suscc-blue">
            Welcome, {user?.full_name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Manage adjunct instructor data for Southern Union State Community College
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Active Request Card */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-suscc-blue-light p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Active Requests
            </h3>
            <p className="text-3xl font-bold text-suscc-blue mb-2">
              0
            </p>
            <p className="text-sm text-gray-600">
              No active semester requests
            </p>
          </div>

          {/* Campuses Card */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-suscc-gold p-3 rounded-lg">
                <Building2 className="h-6 w-6 text-suscc-blue-dark" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Campuses
            </h3>
            <p className="text-3xl font-bold text-suscc-blue mb-2">
              3
            </p>
            <p className="text-sm text-gray-600">
              Wadley, Opelika, Valley
            </p>
          </div>

          {/* Departments Card */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-success p-3 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Departments
            </h3>
            <p className="text-3xl font-bold text-suscc-blue mb-2">
              0
            </p>
            <p className="text-sm text-gray-600">
              No departments configured
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-bold text-suscc-blue mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="btn-primary">
              Create Semester Request
            </button>
            <button
              onClick={() => navigate('/campuses')}
              className="btn-secondary"
            >
              Manage Campuses
            </button>
            <button
              onClick={() => navigate('/chairs')}
              className="btn-secondary"
            >
              Manage Chairs
            </button>
            <button className="btn-secondary">
              Manage Departments
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 bg-white rounded-lg p-6 border-l-4 border-success">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-success flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">
                System Online
              </h3>
              <p className="text-sm text-gray-600">
                All systems operational. Ready to manage adjunct data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
