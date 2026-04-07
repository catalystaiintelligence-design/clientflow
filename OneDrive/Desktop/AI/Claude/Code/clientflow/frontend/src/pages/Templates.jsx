import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FileText, Edit2, Trash2, Users } from 'lucide-react';
import api from '../utils/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { formatDate } from '../utils/formatters';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { toasts, toast, removeToast } = useToast();
  const navigate = useNavigate();

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/templates');
      setTemplates(res.data);
    } catch {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await api.delete(`/templates/${deleteModal.id}`);
      setTemplates((prev) => prev.filter((t) => t.id !== deleteModal.id));
      toast.success('Template deleted');
      setDeleteModal(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete template');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-500 mt-1">Build reusable onboarding forms for your clients</p>
        </div>
        <Button onClick={() => navigate('/templates/new')} className="gap-2">
          <Plus className="w-4 h-4" />
          New Template
        </Button>
      </div>

      {/* Templates grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <Card.Body className="py-16 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No templates yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first template to start onboarding clients.
            </p>
            <Button onClick={() => navigate('/templates/new')}>
              <Plus className="w-4 h-4" />
              Create Template
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <Card.Body className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/templates/${template.id}/edit`)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteModal(template)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {Array.isArray(template.fields) ? template.fields.length : 0} fields
                  {Array.isArray(template.taskTemplates) && template.taskTemplates.length > 0
                    ? ` · ${template.taskTemplates.length} auto-tasks`
                    : ''}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{template._count?.clients || 0} clients</span>
                  </div>
                  <span>Created {formatDate(template.createdAt)}</span>
                </div>
              </Card.Body>
              <Card.Footer className="pt-3 pb-3">
                <button
                  onClick={() => navigate(`/templates/${template.id}/edit`)}
                  className="text-sm text-primary-600 hover:underline font-medium"
                >
                  Edit template →
                </button>
              </Card.Footer>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Template"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{deleteModal?.name}</strong>? This action cannot
          be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteModal(null)}>
            Cancel
          </Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>
            Delete Template
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Templates;
