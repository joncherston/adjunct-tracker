/**
 * Semester Tracking Component
 * View and manage semesters and track submission status
 */
import { useState, useEffect } from 'react';
import { Calendar, Plus, Mail, CheckCircle, Clock, AlertCircle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { semestersAPI } from '../../services/api';
import AppHeader from '../common/AppHeader';

const SemesterTracking = () => {
  const navigate = useNavigate();
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [sendingReminders, setSendingReminders] = useState(false);

  useEffect(() => {
    loadSemesters();
  }, []);

  const loadSemesters = async () => {
    try {
      setLoading(true);
      const response = await semestersAPI.getAll(true); // Include requests
      setSemesters(response.data);

      // Auto-select the first semester if available
      if (response.data.length > 0 && !selectedSemester) {
        setSelectedSemester(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading semesters:', error);
      toast.error('Failed to load semesters');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminders = async (requestIds) => {
    if (!selectedSemester || requestIds.length === 0) return;

    try {
      setSendingReminders(true);
      const response = await semestersAPI.sendReminders(selectedSemester.id, requestIds);

      toast.success(response.data.message, { duration: 5000 });

      if (response.data.failed && response.data.failed.length > 0) {
        toast.error(`Failed to send to: ${response.data.failed.join(', ')}`, { duration: 7000 });
      }

      loadSemesters(); // Refresh to update last_reminded_at timestamps
    } catch (error) {
      console.error('Error sending reminders:', error);
      toast.error('Failed to send reminders');
    } finally {
      setSendingReminders(false);
    }
  };

  const getSubmissionStats = (semester) => {
    if (!semester.requests) return { total: 0, submitted: 0, pending: 0 };

    const total = semester.requests.length;
    const submitted = semester.requests.filter(r => r.is_submitted).length;
    const pending = total - submitted;

    return { total, submitted, pending };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AppHeader
        icon={Calendar}
        title="Semester Tracking"
        subtitle="Track adjunct request submissions"
        actions={
          <button
            onClick={() => navigate('/semesters/create')}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Create New Request</span>
          </button>
        }
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-suscc-blue"></div>
            <p className="mt-4 text-gray-600">Loading semesters...</p>
          </div>
        ) : semesters.length === 0 ? (
          <div className="card text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No semesters yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first semester request</p>
            <button
              onClick={() => navigate('/semesters/create')}
              className="btn-primary"
            >
              <Plus className="h-5 w-5 inline mr-2" />
              Create Semester Request
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Semester List */}
            <div className="lg:col-span-1">
              <div className="card">
                <h2 className="text-lg font-bold text-suscc-blue mb-4">Semesters</h2>
                <div className="space-y-2">
                  {semesters.map((semester) => {
                    const stats = getSubmissionStats(semester);
                    const isSelected = selectedSemester?.id === semester.id;

                    return (
                      <div
                        key={semester.id}
                        onClick={() => setSelectedSemester(semester)}
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-suscc-blue text-white'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-semibold">{semester.display_name}</div>
                        <div className={`text-sm mt-1 ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                          {stats.submitted} / {stats.total} submitted
                        </div>
                        {semester.deadline && (
                          <div className={`text-xs mt-1 ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                            Deadline: {new Date(semester.deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Semester Details */}
            <div className="lg:col-span-2">
              {selectedSemester ? (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="card bg-gradient-to-br from-success to-green-600 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-90">Submitted</p>
                          <p className="text-3xl font-bold mt-1">
                            {getSubmissionStats(selectedSemester).submitted}
                          </p>
                        </div>
                        <CheckCircle className="h-12 w-12 opacity-50" />
                      </div>
                    </div>

                    <div className="card bg-gradient-to-br from-yellow-400 to-yellow-600 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-90">Pending</p>
                          <p className="text-3xl font-bold mt-1">
                            {getSubmissionStats(selectedSemester).pending}
                          </p>
                        </div>
                        <Clock className="h-12 w-12 opacity-50" />
                      </div>
                    </div>

                    <div className="card bg-gradient-to-br from-suscc-blue to-suscc-blue-dark text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-90">Total</p>
                          <p className="text-3xl font-bold mt-1">
                            {getSubmissionStats(selectedSemester).total}
                          </p>
                        </div>
                        <Users className="h-12 w-12 opacity-50" />
                      </div>
                    </div>
                  </div>

                  {/* Department Requests */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-suscc-blue">Department Requests</h2>
                      <button
                        onClick={() => {
                          const pendingIds = selectedSemester.requests
                            .filter(r => !r.is_submitted)
                            .map(r => r.id);
                          if (pendingIds.length > 0) {
                            handleSendReminders(pendingIds);
                          } else {
                            toast.error('No pending requests to remind');
                          }
                        }}
                        disabled={sendingReminders || getSubmissionStats(selectedSemester).pending === 0}
                        className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <Mail className="h-4 w-4" />
                        <span>Send Reminders</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {selectedSemester.requests && selectedSemester.requests.length > 0 ? (
                        selectedSemester.requests.map((request) => (
                          <div
                            key={request.id}
                            className={`p-4 rounded-lg border ${
                              request.is_submitted
                                ? 'border-success bg-green-50'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-semibold text-gray-900">
                                    {request.department.name}
                                  </h3>
                                  {request.is_submitted ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-success text-white">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Submitted
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Pending
                                    </span>
                                  )}
                                </div>

                                <div className="mt-2 text-sm text-gray-600 space-y-1">
                                  {request.department.chair ? (
                                    <p>Chair: {request.department.chair.full_name}</p>
                                  ) : (
                                    <p className="text-red-600 italic">No chair assigned</p>
                                  )}

                                  {request.is_submitted && request.submitted_at && (
                                    <p className="text-success">
                                      Submitted: {new Date(request.submitted_at).toLocaleString()}
                                    </p>
                                  )}

                                  {!request.is_submitted && request.last_reminded_at && (
                                    <p className="text-gray-500">
                                      Last reminded: {new Date(request.last_reminded_at).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {!request.is_submitted && request.department.chair && (
                                <button
                                  onClick={() => handleSendReminders([request.id])}
                                  disabled={sendingReminders}
                                  className="text-suscc-blue hover:text-suscc-blue-dark disabled:opacity-50"
                                  title="Send reminder"
                                >
                                  <Mail className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">No requests for this semester</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a semester to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SemesterTracking;
