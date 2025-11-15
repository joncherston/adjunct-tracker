/**
 * Department Management Component
 * Full CRUD interface for managing departments
 */
import { useState, useEffect } from 'react';
import { GraduationCap, Plus, Edit2, Trash2, Search, X, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { departmentsAPI, chairsAPI } from '../../services/api';
import AppHeader from '../common/AppHeader';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [chairs, setChairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({ name: '', chair_id: null });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Load departments and chairs on mount
  useEffect(() => {
    loadDepartments();
    loadChairs();
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

  const loadChairs = async () => {
    try {
      const response = await chairsAPI.getAll();
      setChairs(response.data);
    } catch (error) {
      console.error('Error loading chairs:', error);
    }
  };

  const handleCreate = () => {
    setEditingDepartment(null);
    setFormData({ name: '', chair_id: null });
    setShowModal(true);
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      chair_id: department.chair_id || null
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDepartment(null);
    setFormData({ name: '', chair_id: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Department name is required');
      return;
    }

    try {
      setSubmitting(true);

      const submitData = {
        name: formData.name,
        chair_id: formData.chair_id === '' ? null : formData.chair_id
      };

      if (editingDepartment) {
        // Update existing department
        await departmentsAPI.update(editingDepartment.id, submitData);
        toast.success('Department updated successfully');
      } else {
        // Create new department
        await departmentsAPI.create(submitData);
        toast.success('Department created successfully');
      }

      handleCloseModal();
      loadDepartments();
    } catch (error) {
      console.error('Error saving department:', error);
      const message = error.response?.data?.detail || 'Failed to save department';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (department) => {
    try {
      await departmentsAPI.delete(department.id);
      toast.success('Department deleted successfully');
      setDeleteConfirm(null);
      loadDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
      const message = error.response?.data?.detail || 'Failed to delete department';
      toast.error(message);
    }
  };

  // Filter departments based on search term
  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.chair?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AppHeader
        icon={GraduationCap}
        title="Department Management"
        subtitle="Manage academic departments"
        actions={
          <button
            onClick={handleCreate}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Department</span>
          </button>
        }
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search departments or chairs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        {/* Departments List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-suscc-blue"></div>
            <p className="mt-4 text-gray-600">Loading departments...</p>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="card text-center py-12">
            <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No departments found' : 'No departments yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? 'Try adjusting your search term'
                : 'Get started by adding your first department'}
            </p>
            {!searchTerm && (
              <button onClick={handleCreate} className="btn-primary">
                <Plus className="h-5 w-5 inline mr-2" />
                Add Department
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDepartments.map((dept) => (
              <div key={dept.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-success bg-opacity-10 p-2 rounded-lg">
                      <GraduationCap className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {dept.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {dept.is_active ? (
                          <span className="text-success">Active</span>
                        ) : (
                          <span className="text-danger">Inactive</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-gray-600">
                      {dept.chair ? (
                        <span>
                          <strong>Chair:</strong> {dept.chair.full_name}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">No chair assigned</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(dept)}
                    className="flex-1 btn-secondary flex items-center justify-center space-x-2 text-sm py-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(dept)}
                    className="flex-1 bg-danger text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors flex items-center justify-center space-x-2 text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Created: {new Date(dept.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-suscc-blue">
                {editingDepartment ? 'Edit Department' : 'Add Department'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Enter department name"
                  required
                  autoFocus
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Chair (Optional)
                </label>
                <select
                  value={formData.chair_id || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    chair_id: e.target.value === '' ? null : parseInt(e.target.value)
                  })}
                  className="input"
                >
                  <option value="">-- No chair assigned --</option>
                  {chairs.map((chair) => (
                    <option key={chair.id} value={chair.id}>
                      {chair.full_name} ({chair.email})
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  Select a department chair to assign to this department
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </span>
                  ) : (
                    <span>{editingDepartment ? 'Update' : 'Create'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="bg-danger bg-opacity-10 p-3 rounded-full">
                <Trash2 className="h-6 w-6 text-danger" />
              </div>
              <h2 className="ml-4 text-xl font-bold text-gray-900">Delete Department</h2>
            </div>

            <p className="text-gray-600 mb-2">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
            </p>
            {deleteConfirm.chair && (
              <p className="text-sm text-gray-500 mb-4">
                Currently chaired by: {deleteConfirm.chair.full_name}
              </p>
            )}
            <p className="text-sm text-gray-600 mb-6">
              This action will mark the department as inactive but preserve all associated data.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-danger text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;
