/**
 * Adjunct Instructor Management Component
 * Full CRUD interface for managing adjunct instructors
 */
import { useState, useEffect } from 'react';
import { UserCircle, Plus, Edit2, Trash2, Search, X, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import AppHeader from '../common/AppHeader';

const AdjunctManagement = () => {
  const [adjuncts, setAdjuncts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAdjunct, setEditingAdjunct] = useState(null);
  const [formData, setFormData] = useState({ full_name: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Load adjuncts on mount
  useEffect(() => {
    loadAdjuncts();
  }, []);

  const loadAdjuncts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/adjuncts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to load adjuncts');

      const data = await response.json();
      setAdjuncts(data);
    } catch (error) {
      console.error('Error loading adjunct instructors:', error);
      toast.error('Failed to load adjunct instructors');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAdjunct(null);
    setFormData({ full_name: '', email: '' });
    setShowModal(true);
  };

  const handleEdit = (adjunct) => {
    setEditingAdjunct(adjunct);
    setFormData({ full_name: adjunct.full_name, email: adjunct.email });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAdjunct(null);
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

      const url = editingAdjunct
        ? `/api/admin/adjuncts/${editingAdjunct.id}`
        : '/api/admin/adjuncts';

      const method = editingAdjunct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to save adjunct instructor');
      }

      toast.success(`Adjunct instructor ${editingAdjunct ? 'updated' : 'created'} successfully`);
      handleCloseModal();
      loadAdjuncts();
    } catch (error) {
      console.error('Error saving adjunct instructor:', error);
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (adjunct) => {
    try {
      const response = await fetch(`/api/admin/adjuncts/${adjunct.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete adjunct instructor');
      }

      toast.success('Adjunct instructor deleted successfully');
      setDeleteConfirm(null);
      loadAdjuncts();
    } catch (error) {
      console.error('Error deleting adjunct instructor:', error);
      toast.error(error.message);
    }
  };

  // Filter adjuncts based on search term
  const filteredAdjuncts = adjuncts.filter(adjunct =>
    adjunct.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adjunct.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AppHeader
        icon={UserCircle}
        title="Adjunct Instructor Management"
        subtitle="Manage adjunct instructor database"
        actions={
          <button
            onClick={handleCreate}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Adjunct</span>
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
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        {/* Adjuncts List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-suscc-blue"></div>
            <p className="mt-4 text-gray-600">Loading adjunct instructors...</p>
          </div>
        ) : filteredAdjuncts.length === 0 ? (
          <div className="card text-center py-12">
            <UserCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No adjuncts found' : 'No adjunct instructors yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? 'Try adjusting your search term'
                : 'Get started by adding your first adjunct instructor'}
            </p>
            {!searchTerm && (
              <button onClick={handleCreate} className="btn-primary">
                <Plus className="h-5 w-5 inline mr-2" />
                Add Adjunct Instructor
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAdjuncts.map((adjunct) => (
              <div key={adjunct.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-suscc-blue-light p-2 rounded-lg">
                      <UserCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {adjunct.full_name}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="mb-4 flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <a
                    href={`mailto:${adjunct.email}`}
                    className="hover:text-suscc-blue transition-colors"
                  >
                    {adjunct.email}
                  </a>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(adjunct)}
                    className="flex-1 btn-secondary flex items-center justify-center space-x-2 text-sm py-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(adjunct)}
                    className="flex-1 bg-danger text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors flex items-center justify-center space-x-2 text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Added: {new Date(adjunct.created_at).toLocaleDateString()}
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
                {editingAdjunct ? 'Edit Adjunct Instructor' : 'Add Adjunct Instructor'}
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
                  placeholder="adjunct@email.com"
                  required
                />
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
                    <span>{editingAdjunct ? 'Update' : 'Create'}</span>
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
              <h2 className="ml-4 text-xl font-bold text-gray-900">Delete Adjunct Instructor</h2>
            </div>

            <p className="text-gray-600 mb-2">
              Are you sure you want to delete <strong>{deleteConfirm.full_name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              ({deleteConfirm.email})
            </p>
            <p className="text-sm text-gray-600 mb-6">
              This action cannot be undone. This instructor will be permanently removed from the database.
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

export default AdjunctManagement;
