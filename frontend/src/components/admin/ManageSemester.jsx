/**
 * Manage Semester Component
 * Admin interface for managing adjunct assignments for a semester
 */
import { useState, useEffect } from 'react';
import { Calendar, Edit2, Trash2, Plus, X, Save, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { semestersAPI } from '../../services/api';
import AppHeader from '../common/AppHeader';
import api from '../../services/api';

const ManageSemester = () => {
  const navigate = useNavigate();
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [adjuncts, setAdjuncts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formData, setFormData] = useState({
    adjunct_id: null,
    department_id: null,
    campus_ids: [],
    course_names: []
  });
  const [courseInput, setCourseInput] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedSemester) {
      loadAssignments();
    }
  }, [selectedSemester]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [semestersRes, campusesRes, adjunctsRes, deptsRes] = await Promise.all([
        semestersAPI.getAll(),
        api.get('/admin/campuses'),
        api.get('/admin/adjuncts'),
        api.get('/admin/departments')
      ]);

      setSemesters(semestersRes.data);
      setCampuses(campusesRes.data);
      setAdjuncts(adjunctsRes.data);
      setDepartments(deptsRes.data);

      if (semestersRes.data.length > 0) {
        setSelectedSemester(semestersRes.data[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    if (!selectedSemester) return;

    try {
      setLoadingAssignments(true);
      const response = await api.get(`/admin/semesters/${selectedSemester.id}/assignments`);
      setAssignments(response.data.assignments);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      adjunct_id: assignment.adjunct.id,
      department_id: assignment.department.id,
      campus_ids: assignment.campus_assignments?.map(ca => ca.campus.id) || [],
      course_names: assignment.course_assignments?.map(ca => ca.course.course_name) || []
    });
    setCourseInput('');
    setShowEditModal(true);
  };

  const handleAdd = () => {
    setEditingAssignment(null);
    setFormData({
      adjunct_id: null,
      department_id: null,
      campus_ids: [],
      course_names: []
    });
    setCourseInput('');
    setShowAddModal(true);
  };

  const handleSaveEdit = async () => {
    if (formData.campus_ids.length === 0) {
      toast.error('Please select at least one campus');
      return;
    }

    try {
      await api.put(
        `/admin/semesters/${selectedSemester.id}/assignments/${editingAssignment.id}`,
        {
          campus_ids: formData.campus_ids,
          course_names: formData.course_names
        }
      );
      toast.success('Assignment updated successfully');
      setShowEditModal(false);
      loadAssignments();
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error(error.response?.data?.detail || 'Failed to update assignment');
    }
  };

  const handleSaveAdd = async () => {
    if (!formData.adjunct_id || !formData.department_id) {
      toast.error('Please select an adjunct and department');
      return;
    }

    if (formData.campus_ids.length === 0) {
      toast.error('Please select at least one campus');
      return;
    }

    try {
      await api.post(
        `/admin/semesters/${selectedSemester.id}/assignments`,
        formData
      );
      toast.success('Assignment added successfully');
      setShowAddModal(false);
      loadAssignments();
    } catch (error) {
      console.error('Error adding assignment:', error);
      toast.error(error.response?.data?.detail || 'Failed to add assignment');
    }
  };

  const handleDelete = async (assignment) => {
    if (!confirm(`Remove ${assignment.adjunct.full_name} from ${assignment.department.name}?`)) {
      return;
    }

    try {
      await api.delete(`/admin/semesters/${selectedSemester.id}/assignments/${assignment.id}`);
      toast.success('Assignment deleted successfully');
      loadAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete assignment');
    }
  };

  const handleAddCourse = () => {
    if (!courseInput.trim()) return;

    if (!formData.course_names.includes(courseInput.trim())) {
      setFormData({
        ...formData,
        course_names: [...formData.course_names, courseInput.trim()]
      });
    }
    setCourseInput('');
  };

  const handleRemoveCourse = (index) => {
    setFormData({
      ...formData,
      course_names: formData.course_names.filter((_, i) => i !== index)
    });
  };

  const groupByDepartment = () => {
    const grouped = {};
    assignments.forEach(assignment => {
      const deptName = assignment.department.name;
      if (!grouped[deptName]) {
        grouped[deptName] = [];
      }
      grouped[deptName].push(assignment);
    });
    return grouped;
  };

  const groupedAssignments = groupByDepartment();
  const departmentNames = Object.keys(groupedAssignments).sort();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        icon={Calendar}
        title="Manage Semester"
        subtitle="Edit adjunct assignments for a semester"
        actions={
          selectedSemester && (
            <button
              onClick={handleAdd}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Assignment</span>
            </button>
          )
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Semester Selector */}
        <div className="card mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Semester
          </label>
          <select
            value={selectedSemester?.id || ''}
            onChange={(e) => {
              const semester = semesters.find(s => s.id === parseInt(e.target.value));
              setSelectedSemester(semester);
            }}
            className="input max-w-md"
          >
            {semesters.map(semester => (
              <option key={semester.id} value={semester.id}>
                {semester.display_name}
              </option>
            ))}
          </select>
        </div>

        {/* Assignments List */}
        {loadingAssignments ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-suscc-blue"></div>
            <p className="mt-4 text-gray-600">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="card text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No assignments for this semester yet</p>
            <button
              onClick={handleAdd}
              className="btn-primary mt-4"
            >
              <Plus className="h-5 w-5 inline mr-2" />
              Add First Assignment
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {departmentNames.map(deptName => (
              <div key={deptName} className="card">
                <h2 className="text-xl font-bold text-suscc-blue mb-4">
                  {deptName}
                  <span className="text-gray-600 font-normal text-base ml-2">
                    ({groupedAssignments[deptName].length} instructor{groupedAssignments[deptName].length !== 1 ? 's' : ''})
                  </span>
                </h2>

                <div className="space-y-3">
                  {groupedAssignments[deptName].map(assignment => (
                    <div key={assignment.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{assignment.adjunct.full_name}</p>
                        <p className="text-sm text-gray-600">{assignment.adjunct.email}</p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {assignment.campus_assignments && assignment.campus_assignments.length > 0 ? (
                            assignment.campus_assignments.map((ca, idx) => (
                              <span key={idx} className="inline-block px-2 py-0.5 bg-suscc-gold-light text-suscc-blue text-xs rounded">
                                {ca.campus.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">No campus assigned</span>
                          )}
                        </div>

                        {assignment.course_assignments && assignment.course_assignments.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {assignment.course_assignments.map((ca, idx) => (
                              <span key={idx} className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                {ca.course.course_name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(assignment)}
                          className="text-suscc-blue hover:text-suscc-blue-dark"
                          title="Edit"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(assignment)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-suscc-blue mb-4">
                Edit Assignment: {editingAssignment?.adjunct.full_name}
              </h2>

              <div className="space-y-4">
                {/* Campus Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campus(es) *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {campuses.map((campus) => (
                      <label key={campus.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.campus_ids.includes(campus.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                campus_ids: [...formData.campus_ids, campus.id]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                campus_ids: formData.campus_ids.filter(id => id !== campus.id)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-suscc-blue focus:ring-suscc-blue"
                        />
                        <span className="text-sm text-gray-700">{campus.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Courses */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Courses (optional)
                  </label>

                  {formData.course_names.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.course_names.map((course, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-suscc-blue text-white"
                        >
                          {course}
                          <button
                            type="button"
                            onClick={() => handleRemoveCourse(idx)}
                            className="ml-2 hover:text-suscc-gold"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={courseInput}
                      onChange={(e) => setCourseInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCourse())}
                      className="input flex-1"
                      placeholder="Enter course name and press Enter"
                    />
                    <button
                      type="button"
                      onClick={handleAddCourse}
                      className="btn-secondary"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save className="h-5 w-5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-suscc-blue mb-4">
                Add Assignment
              </h2>

              <div className="space-y-4">
                {/* Adjunct Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adjunct Instructor *
                  </label>
                  <select
                    value={formData.adjunct_id || ''}
                    onChange={(e) => setFormData({ ...formData, adjunct_id: parseInt(e.target.value) })}
                    className="input w-full"
                  >
                    <option value="">Select an adjunct...</option>
                    {adjuncts.map(adjunct => (
                      <option key={adjunct.id} value={adjunct.id}>
                        {adjunct.full_name} ({adjunct.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <select
                    value={formData.department_id || ''}
                    onChange={(e) => setFormData({ ...formData, department_id: parseInt(e.target.value) })}
                    className="input w-full"
                  >
                    <option value="">Select a department...</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Campus Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campus(es) *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {campuses.map((campus) => (
                      <label key={campus.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.campus_ids.includes(campus.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                campus_ids: [...formData.campus_ids, campus.id]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                campus_ids: formData.campus_ids.filter(id => id !== campus.id)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-suscc-blue focus:ring-suscc-blue"
                        />
                        <span className="text-sm text-gray-700">{campus.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Courses */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Courses (optional)
                  </label>

                  {formData.course_names.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.course_names.map((course, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-suscc-blue text-white"
                        >
                          {course}
                          <button
                            type="button"
                            onClick={() => handleRemoveCourse(idx)}
                            className="ml-2 hover:text-suscc-gold"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={courseInput}
                      onChange={(e) => setCourseInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCourse())}
                      className="input flex-1"
                      placeholder="Enter course name and press Enter"
                    />
                    <button
                      type="button"
                      onClick={handleAddCourse}
                      className="btn-secondary"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAdd}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save className="h-5 w-5" />
                  <span>Add Assignment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSemester;
