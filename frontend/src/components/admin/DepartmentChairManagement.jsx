/**
 * Department Chair Management Component
 * Full CRUD interface for managing department chairs
 */
import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Search, X, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { chairsAPI } from '../../services/api';

const DepartmentChairManagement = () => {
  const [chairs, setChairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingChair, setEditingChair] = useState(null);
  const [formData, setFormData] = useState({ full_name: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Load chairs on mount
  useEffect(() => {
    loadChairs();
  }, []);

  const loadChairs = async () => {
    try {
      setLoading(true);
      const response = await chairsAPI.getAll();
      setChairs(response.data);
    } catch (error) {
      console.error('Error loading department chairs:', error);
      toast.error('Failed to load department chairs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingChair(null);
    setFormData({ full_name: '', email: '' });
    setShowModal(true);
  };

  const handleEdit = (chair) => {
    setEditingChair(chair);
    setFormData({ full_name: chair.full_name, email: chair.email });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingChair(null);
    setFormData({ full_name: '', email: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.full_name.trim() || !formData.email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    try {
      setSubmitting(true);

      if (editingChair) {
        // Update existing chair
        await chairsAPI.update(editingChair.id, formData);
        toast.success('Department chair updated successfully');
      } else {
        // Create new chair
        await chairsAPI.create(formData);
        toast.success('Department chair created successfully');
      }

      handleCloseModal();
      loadChairs();
    } catch (error) {
      console.error('Error saving department chair:', error);
      const message = error.response?.data?.detail || 'Failed to save department chair';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (chair) => {
    try {
      await chairsAPI.delete(chair.id);
      toast.success('Department chair deleted successfully');
      setDeleteConfirm(null);
      loadChairs();
    } catch (error) {
      console.error('Error deleting department chair:', error);
      const message = error.response?.data?.detail || 'Failed to delete department chair';
      toast.error(message);
    }
  };

  // Filter chairs based on search term
  const filteredChairs = chairs.filter(chair =>
    chair.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chair.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-suscc-blue p-3 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-suscc-blue">Department Chair Management</h1>
                <p className="text-sm text-gray-600">Manage faculty department chairs</p>
              </div>
            </div>
            <button
              onClick={handleCreate}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Department Chair</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        {/* Chairs List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-suscc-blue"></div>
            <p className="mt-4 text-gray-600">Loading department chairs...</p>
          </div>
        ) : filteredChairs.length === 0 ? (
          <div className="card text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No chairs found' : 'No department chairs yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? 'Try adjusting your search term'
                : 'Get started by adding your first department chair'}
            </p>
            {!searchTerm && (
              <button onClick={handleCreate} className="btn-primary">
                <Plus className="h-5 w-5 inline mr-2" />
                Add Department Chair
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChairs.map((chair) => (
              <div key={chair.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-suscc-blue-light p-2 rounded-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {chair.full_name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {chair.is_active ? (
                          <span className="text-success">Active</span>
                        ) : (
                          <span className="text-danger">Inactive</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4 flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <a
                    href={`mailto:${chair.email}`}
                    className="hover:text-suscc-blue transition-colors"
                  >
                    {chair.email}
                  </a>
                </div>

                {/* Departments */}
                {chair.departments && chair.departments.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                      Departments
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {chair.departments.map((dept) => (
                        <span
                          key={dept.id}
                          className="inline-flex items-center px-2 py-1 bg-suscc-blue-light bg-opacity-20 text-suscc-blue text-xs rounded-md"
                        >
                          {dept.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(chair)}
                    className="flex-1 btn-secondary flex items-center justify-center space-x-2 text-sm py-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(chair)}
                    className="flex-1 bg-danger text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors flex items-center justify-center space-x-2 text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Created: {new Date(chair.created_at).toLocaleDateString()}
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
                {editingChair ? 'Edit Department Chair' : 'Add Department Chair'}
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
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="input"
                  placeholder="Enter full name"
                  required
                  autoFocus
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  placeholder="chair@suscc.edu"
                  required
                />
                <p className="mt-2 text-xs text-gray-500">
                  This email will be used to send semester requests
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
                    <span>{editingChair ? 'Update' : 'Create'}</span>
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
              <h2 className="ml-4 text-xl font-bold text-gray-900">Delete Department Chair</h2>
            </div>

            <p className="text-gray-600 mb-2">
              Are you sure you want to delete <strong>{deleteConfirm.full_name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              ({deleteConfirm.email})
            </p>
            <p className="text-sm text-gray-600 mb-6">
              This action will mark the chair as inactive but preserve all associated data.
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

export default DepartmentChairManagement;
