/**
 * Department Chair Submission Page
 * Public page where department chairs submit adjunct data using their unique token
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, GraduationCap, Users, Plus, Trash2, Send, CheckCircle, AlertCircle, Copy, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { submitAPI } from '../../services/api';
import { useEscapeKey } from '../../hooks/useKeyPress';

const ChairSubmissionPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', email: '' });
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [previousSemesters, setPreviousSemesters] = useState([]);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [copying, setCopying] = useState(false);

  // Close modal with Escape key for accessibility
  useEscapeKey(() => setShowCopyModal(false), showCopyModal);

  useEffect(() => {
    if (token) {
      loadRequestData();
    }
  }, [token]);

  const loadRequestData = async () => {
    try {
      setLoading(true);
      const response = await submitAPI.getRequestByToken(token);
      setRequestData(response.data);
    } catch (error) {
      console.error('Error loading request:', error);
      toast.error('Invalid or expired access link');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdjunct = async (e) => {
    e.preventDefault();

    if (!formData.full_name.trim() || !formData.email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    try {
      await submitAPI.addAdjunct(token, formData);
      toast.success('Adjunct added successfully');
      setFormData({ full_name: '', email: '' });
      setShowAddForm(false);
      loadRequestData(); // Refresh the list
    } catch (error) {
      console.error('Error adding adjunct:', error);
      const message = error.response?.data?.detail || 'Failed to add adjunct';
      toast.error(message);
    }
  };

  const handleRemoveAdjunct = async (assignmentId, adjunctName) => {
    if (!confirm(`Remove ${adjunctName} from this request?`)) return;

    try {
      await submitAPI.removeAdjunct(token, assignmentId);
      toast.success('Adjunct removed');
      loadRequestData(); // Refresh the list
    } catch (error) {
      console.error('Error removing adjunct:', error);
      toast.error('Failed to remove adjunct');
    }
  };

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit? You will not be able to make changes after submission.')) {
      return;
    }

    try {
      setSubmitting(true);
      await submitAPI.submitRequest(token);
      toast.success('Submission completed successfully!', { duration: 5000 });
      loadRequestData(); // Refresh to show submitted status
    } catch (error) {
      console.error('Error submitting:', error);
      const message = error.response?.data?.detail || 'Failed to submit';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShowCopyModal = async () => {
    setShowCopyModal(true);
    setLoadingPrevious(true);

    try {
      const response = await submitAPI.getPreviousSemesters(token);
      setPreviousSemesters(response.data);
    } catch (error) {
      console.error('Error loading previous semesters:', error);
      toast.error('Failed to load previous semesters');
      setShowCopyModal(false);
    } finally {
      setLoadingPrevious(false);
    }
  };

  const handleCopyFromSemester = async (semesterId, semesterName) => {
    if (!confirm(`Copy all adjuncts from ${semesterName}?`)) {
      return;
    }

    try {
      setCopying(true);
      const response = await submitAPI.copyFromPrevious(token, semesterId);
      toast.success(response.data.message);

      if (response.data.skipped_count > 0) {
        toast.info(`${response.data.skipped_count} adjunct(s) already added, skipped duplicates`);
      }

      setShowCopyModal(false);
      loadRequestData(); // Refresh to show copied adjuncts
    } catch (error) {
      console.error('Error copying from semester:', error);
      const message = error.response?.data?.detail || 'Failed to copy adjuncts';
      toast.error(message);
    } finally {
      setCopying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-suscc-blue to-suscc-blue-dark flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
          <p className="mt-4 text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!requestData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-suscc-blue to-suscc-blue-dark flex items-center justify-center p-4">
        <div className="card max-w-md text-center">
          <AlertCircle className="h-16 w-16 text-danger mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Access Link</h1>
          <p className="text-gray-600">
            This link is invalid or has expired. Please contact the Adjunct Faculty Committee if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  const { semester, department, assignments, is_submitted } = requestData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-suscc-blue to-suscc-blue-dark text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-white bg-opacity-20 p-4 rounded-full">
              <GraduationCap className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">SUSCC Adjunct Request</h1>
              <p className="text-suscc-gold-light text-lg">{semester.display_name}</p>
            </div>
          </div>

          {is_submitted && (
            <div className="mt-4 bg-success bg-opacity-20 border-2 border-success rounded-lg p-4 flex items-center">
              <CheckCircle className="h-6 w-6 mr-3" />
              <div>
                <p className="font-semibold">Submitted Successfully</p>
                <p className="text-sm opacity-90">This request has been submitted and can no longer be modified.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Department Info Card */}
        <div className="card mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="h-6 w-6 text-suscc-blue" />
            <h2 className="text-xl font-bold text-suscc-blue">Department Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="font-semibold text-gray-900">{department.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Department Chair</p>
              <p className="font-semibold text-gray-900">
                {department.chair ? department.chair.full_name : 'Not Assigned'}
              </p>
            </div>
            {semester.deadline && (
              <div>
                <p className="text-sm text-gray-600">Deadline</p>
                <p className="font-semibold text-gray-900">
                  {new Date(semester.deadline).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>

          {semester.custom_message && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Message from Administration:</p>
              <p className="text-gray-900 whitespace-pre-wrap">{semester.custom_message}</p>
            </div>
          )}
        </div>

        {/* Adjunct List */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-suscc-blue" />
              <h2 className="text-xl font-bold text-suscc-blue">
                Adjunct Instructors ({assignments?.length || 0})
              </h2>
            </div>
            {!is_submitted && (
              <div className="flex space-x-2">
                <button
                  onClick={handleShowCopyModal}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Copy className="h-5 w-5" />
                  <span className="hidden sm:inline">Copy from Previous</span>
                  <span className="sm:hidden">Copy</span>
                </button>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Adjunct</span>
                </button>
              </div>
            )}
          </div>

          {/* Add Adjunct Form */}
          {showAddForm && !is_submitted && (
            <div className="mb-6 p-4 bg-suscc-gold-light border-2 border-suscc-gold rounded-lg">
              <form onSubmit={handleAddAdjunct}>
                <h3 className="font-semibold text-suscc-blue mb-4">Add Adjunct Instructor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="input"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                      placeholder="john.doe@example.com"
                      required
                    />
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setFormData({ full_name: '', email: '' });
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Add Adjunct
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Adjunct List */}
          {assignments && assignments.length > 0 ? (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{assignment.adjunct.full_name}</p>
                    <p className="text-sm text-gray-600">{assignment.adjunct.email}</p>
                  </div>
                  {!is_submitted && (
                    <button
                      onClick={() => handleRemoveAdjunct(assignment.id, assignment.adjunct.full_name)}
                      className="text-danger hover:text-red-700 p-2"
                      title="Remove adjunct"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No adjunct instructors added yet</p>
              {!is_submitted && (
                <p className="text-sm mt-1">Click "Add Adjunct" to get started</p>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        {!is_submitted && assignments && assignments.length > 0 && (
          <div className="mt-8 card bg-gradient-to-r from-suscc-blue to-suscc-blue-dark text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-1">Ready to Submit?</h3>
                <p className="text-sm opacity-90">
                  You have added {assignments.length} adjunct instructor{assignments.length !== 1 ? 's' : ''}.
                  Once submitted, you cannot make changes.
                </p>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-suscc-gold text-suscc-blue-dark px-8 py-3 rounded-md font-bold hover:bg-suscc-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-suscc-blue-dark"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Submit Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Copy from Previous Semester Modal */}
      {showCopyModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="copy-modal-title"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-suscc-blue text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Copy className="h-6 w-6" aria-hidden="true" />
                <h2 id="copy-modal-title" className="text-xl font-bold">Copy from Previous Semester</h2>
              </div>
              <button
                onClick={() => setShowCopyModal(false)}
                className="text-white hover:text-suscc-gold transition-colors"
                aria-label="Close copy from previous semester dialog"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {loadingPrevious ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-suscc-blue"></div>
                  <p className="mt-4 text-gray-600">Loading previous semesters...</p>
                </div>
              ) : previousSemesters.length > 0 ? (
                <>
                  <p className="text-gray-600 mb-4">
                    Select a previous semester to copy all adjunct instructors from that submission.
                    Duplicates will be automatically skipped.
                  </p>
                  <div className="space-y-3">
                    {previousSemesters.map((semester) => (
                      <div
                        key={semester.semester_id}
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-suscc-blue transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {semester.semester_display_name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {semester.adjunct_count} adjunct{semester.adjunct_count !== 1 ? 's' : ''} •{' '}
                              Submitted {new Date(semester.submitted_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleCopyFromSemester(semester.semester_id, semester.semester_display_name)}
                            disabled={copying}
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {copying ? 'Copying...' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No previous semester submissions found for your department.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    You'll need to manually add adjuncts for this semester.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChairSubmissionPage;
