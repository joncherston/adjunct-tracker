/**
 * Create Semester Request Component
 * Interface for creating semesters and sending requests to departments
 */
import { useState, useEffect } from 'react';
import { Calendar, Send, CheckSquare, Square, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { semestersAPI, departmentsAPI } from '../../services/api';

const CreateSemesterRequest = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    semester_type: 'Fall',
    year: new Date().getFullYear(),
    deadline: '',
    custom_message: '',
    department_ids: []
  });

  // Load departments on mount
  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentsAPI.getAll();
      setDepartments(response.data);
    } catch (error) {
      console.error('Error loading departments:', error);
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (formData.department_ids.length === departments.length) {
      // Deselect all
      setFormData({ ...formData, department_ids: [] });
    } else {
      // Select all
      setFormData({ ...formData, department_ids: departments.map(d => d.id) });
    }
  };

  const toggleDepartment = (deptId) => {
    if (formData.department_ids.includes(deptId)) {
      setFormData({
        ...formData,
        department_ids: formData.department_ids.filter(id => id !== deptId)
      });
    } else {
      setFormData({
        ...formData,
        department_ids: [...formData.department_ids, deptId]
      });
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.semester_type || !formData.year) {
      toast.error('Semester type and year are required');
      return;
    }

    if (formData.department_ids.length === 0) {
      toast.error('Please select at least one department');
      return;
    }

    try {
      setSubmitting(true);

      const submitData = {
        ...formData,
        deadline: formData.deadline || null,
        custom_message: formData.custom_message || null
      };

      await semestersAPI.create(submitData);

      toast.success(
        `${formData.semester_type} ${formData.year} semester created! Emails sent to ${formData.department_ids.length} department(s).`,
        { duration: 5000 }
      );

      // Navigate back to semesters list
      navigate('/semesters');
    } catch (error) {
      console.error('Error creating semester:', error);
      const message = error.response?.data?.detail || 'Failed to create semester';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/semesters')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="bg-suscc-gold p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-suscc-blue-dark" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-suscc-blue">Create Semester Request</h1>
                <p className="text-sm text-gray-600">Send adjunct requests to department chairs</p>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mt-6 flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-suscc-blue' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-suscc-blue text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Semester Details</span>
            </div>
            <div className="h-1 w-12 bg-gray-300"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-suscc-blue' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-suscc-blue text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Select Departments</span>
            </div>
            <div className="h-1 w-12 bg-gray-300"></div>
            <div className={`flex items-center ${step >= 3 ? 'text-suscc-blue' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-suscc-blue text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Review & Send</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          {/* Step 1: Semester Details */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-suscc-blue mb-6">Step 1: Semester Details</h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Semester Type *
                    </label>
                    <select
                      value={formData.semester_type}
                      onChange={(e) => setFormData({ ...formData, semester_type: e.target.value })}
                      className="input"
                      required
                    >
                      <option value="Fall">Fall</option>
                      <option value="Spring">Spring</option>
                      <option value="Summer">Summer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year *
                    </label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      className="input"
                      required
                    >
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Submission Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="input"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    When department chairs should submit their adjunct information by
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Message (Optional)
                  </label>
                  <textarea
                    value={formData.custom_message}
                    onChange={(e) => setFormData({ ...formData, custom_message: e.target.value })}
                    className="input"
                    rows={4}
                    placeholder="Add any special instructions or notes for department chairs..."
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    This message will be included in the email sent to department chairs
                  </p>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="btn-primary"
                >
                  Next: Select Departments →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Select Departments */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-suscc-blue mb-2">Step 2: Select Departments</h2>
              <p className="text-gray-600 mb-6">
                Choose which departments should receive the adjunct request
              </p>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-suscc-blue"></div>
                  <p className="mt-4 text-gray-600">Loading departments...</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {formData.department_ids.length} of {departments.length} departments selected
                    </p>
                    <button
                      onClick={handleSelectAll}
                      className="text-suscc-blue hover:text-suscc-blue-dark font-medium text-sm"
                    >
                      {formData.department_ids.length === departments.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {departments.map((dept) => (
                      <div
                        key={dept.id}
                        onClick={() => toggleDepartment(dept.id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          formData.department_ids.includes(dept.id)
                            ? 'border-suscc-blue bg-suscc-blue bg-opacity-5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {formData.department_ids.includes(dept.id) ? (
                            <CheckSquare className="h-5 w-5 text-suscc-blue" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{dept.name}</p>
                            {dept.chair ? (
                              <p className="text-sm text-gray-600">
                                Chair: {dept.chair.full_name} ({dept.chair.email})
                              </p>
                            ) : (
                              <p className="text-sm text-red-600 italic">No chair assigned</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={formData.department_ids.length === 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Review & Send →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Send */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-suscc-blue mb-6">Step 3: Review & Send</h2>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Semester</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {formData.semester_type} {formData.year}
                  </p>
                </div>

                {formData.deadline && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Deadline</h3>
                    <p className="text-gray-900">
                      {new Date(formData.deadline).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}

                {formData.custom_message && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Custom Message</h3>
                    <p className="text-gray-900 whitespace-pre-wrap">{formData.custom_message}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Selected Departments ({formData.department_ids.length})
                  </h3>
                  <div className="space-y-1">
                    {departments
                      .filter(d => formData.department_ids.includes(d.id))
                      .map(dept => (
                        <div key={dept.id} className="text-sm">
                          <span className="font-medium">{dept.name}</span>
                          {dept.chair && (
                            <span className="text-gray-600"> → {dept.chair.full_name} ({dept.chair.email})</span>
                          )}
                          {!dept.chair && (
                            <span className="text-red-600 italic"> (No chair - email will not be sent)</span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Send className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Clicking "Send Requests" will create the semester and send email notifications to all selected department chairs who have an assigned chair.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn-primary flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Send Requests</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateSemesterRequest;
