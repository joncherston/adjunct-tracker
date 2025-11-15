/**
 * Campus Management Component
 * Full CRUD interface for managing campuses
 */
import { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { campusesAPI } from '../../services/api';
import AppHeader from '../common/AppHeader';

const CampusManagement = () => {
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCampus, setEditingCampus] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Load campuses on mount
  useEffect(() => {
    loadCampuses();
  }, []);

  const loadCampuses = async () => {
    try {
      setLoading(true);
      const response = await campusesAPI.getAll();
      setCampuses(response.data);
    } catch (error) {
      console.error('Error loading campuses:', error);
      toast.error('Failed to load campuses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCampus(null);
    setFormData({ name: '' });
    setShowModal(true);
  };

  const handleEdit = (campus) => {
    setEditingCampus(campus);
    setFormData({ name: campus.name });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCampus(null);
    setFormData({ name: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Campus name is required');
      return;
    }

    try {
      setSubmitting(true);

      if (editingCampus) {
        // Update existing campus
        await campusesAPI.update(editingCampus.id, formData);
        toast.success('Campus updated successfully');
      } else {
        // Create new campus
        await campusesAPI.create(formData);
        toast.success('Campus created successfully');
      }

      handleCloseModal();
      loadCampuses();
    } catch (error) {
      console.error('Error saving campus:', error);
      const message = error.response?.data?.detail || 'Failed to save campus';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (campus) => {
    try {
      await campusesAPI.delete(campus.id);
      toast.success('Campus deleted successfully');
      setDeleteConfirm(null);
      loadCampuses();
    } catch (error) {
      console.error('Error deleting campus:', error);
      const message = error.response?.data?.detail || 'Failed to delete campus';
      toast.error(message);
    }
  };

  // Filter campuses based on search term
  const filteredCampuses = campuses.filter(campus =>
    campus.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AppHeader
        icon={Building2}
        title="Campus Management"
        subtitle="Manage campus locations"
        actions={
          <button
            onClick={handleCreate}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Campus</span>
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
              placeholder="Search campuses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        {/* Campus List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-suscc-blue"></div>
            <p className="mt-4 text-gray-600">Loading campuses...</p>
          </div>
        ) : filteredCampuses.length === 0 ? (
          <div className="card text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No campuses found' : 'No campuses yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? 'Try adjusting your search term'
                : 'Get started by adding your first campus'}
            </p>
            {!searchTerm && (
              <button onClick={handleCreate} className="btn-primary">
                <Plus className="h-5 w-5 inline mr-2" />
                Add Campus
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampuses.map((campus) => (
              <div key={campus.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-suscc-gold-light p-2 rounded-lg">
                      <Building2 className="h-5 w-5 text-suscc-blue" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {campus.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {campus.is_active ? (
                          <span className="text-success">Active</span>
                        ) : (
                          <span className="text-danger">Inactive</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(campus)}
                    className="flex-1 btn-secondary flex items-center justify-center space-x-2 text-sm py-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(campus)}
                    className="flex-1 bg-danger text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors flex items-center justify-center space-x-2 text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Created: {new Date(campus.created_at).toLocaleDateString()}
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
                {editingCampus ? 'Edit Campus' : 'Add Campus'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campus Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Enter campus name"
                  required
                  autoFocus
                />
                <p className="mt-2 text-xs text-gray-500">
                  Enter the name of the campus location (e.g., Wadley, Opelika, Valley)
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
                    <span>{editingCampus ? 'Update' : 'Create'}</span>
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
              <h2 className="ml-4 text-xl font-bold text-gray-900">Delete Campus</h2>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
              This action will mark the campus as inactive but preserve all associated data.
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

export default CampusManagement;
