import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, Mail, ExternalLink, Trash2, Copy, Check, Send, Link as LinkIcon } from 'lucide-react';
import api from '../utils/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import { formatDate } from '../utils/formatters';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';

const NewClientModal = ({ open, onClose, templates, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', templateId: '' });
  const [errors, setErrors] = useState({});
  const [createdClient, setCreatedClient] = useState(null);
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toasts, toast, removeToast } = useToast();

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setLoading(true);
    try {
      const res = await api.post('/clients', {
        name: form.name,
        email: form.email,
        templateId: form.templateId || undefined,
        sendInvite: false,
      });
      onCreated(res.data);
      setCreatedClient(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!createdClient) return;
    setSending(true);
    try {
      await api.post(`/clients/${createdClient.id}/resend-invite`);
      setEmailSent(true);
      toast.success('Invite email sent!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const portalUrl = createdClient
    ? `${window.location.origin}/portal/${createdClient.portalToken}`
    : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleClose = () => {
    setCreatedClient(null);
    setForm({ name: '', email: '', templateId: '' });
    setErrors({});
    setEmailSent(false);
    setCopied(false);
    onClose();
  };

  return (
    <>
      <Toast toasts={toasts} removeToast={removeToast} />
      <Modal open={open} onClose={handleClose} title={createdClient ? 'Client Added!' : 'Add New Client'}>
        {createdClient ? (
          <div className="space-y-5">
            {/* Success state */}
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{createdClient.name} was added</p>
                <p className="text-sm text-gray-500">{createdClient.email}</p>
              </div>
            </div>

            {/* Portal link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LinkIcon className="w-4 h-4 inline mr-1" />
                Onboarding Portal Link
              </label>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 truncate">
                  {portalUrl}
                </div>
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Share this link with your client to start onboarding.</p>
            </div>

            {/* Send email */}
            <div className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-800">Send Invite Email</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Send the portal link directly to <strong>{createdClient.email}</strong>
                </p>
              </div>
              {emailSent ? (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <Check className="w-4 h-4" />
                  Email sent to {createdClient.email}
                </div>
              ) : (
                <Button
                  onClick={handleSendEmail}
                  loading={sending}
                  className="w-full gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Email Invite
                </Button>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <Button variant="secondary" onClick={handleClose}>Done</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Client Name"
              placeholder="Acme Corp"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
              required
            />
            <Input
              label="Client Email"
              type="email"
              placeholder="contact@acmecorp.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              required
            />
            <Select
              label="Onboarding Template"
              placeholder="Select a template (optional)"
              value={form.templateId}
              onChange={(e) => setForm({ ...form, templateId: e.target.value })}
              options={templates.map((t) => ({ value: t.id, label: t.name }))}
            />
            <p className="text-xs text-gray-500">
              A unique portal link will be generated. You can send the invite email on the next step.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={handleClose}>Cancel</Button>
              <Button loading={loading} onClick={handleSubmit}>
                <Plus className="w-4 h-4" />
                Create Client
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const { toasts, toast, removeToast } = useToast();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [clientRes, tmplRes] = await Promise.all([
        api.get('/clients'),
        api.get('/templates'),
      ]);
      setClients(clientRes.data);
      setTemplates(tmplRes.data);
    } catch {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = clients.filter((c) => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await api.delete(`/clients/${deleteModal.id}`);
      setClients((prev) => prev.filter((c) => c.id !== deleteModal.id));
      toast.success('Client deleted');
      setDeleteModal(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete client');
    } finally {
      setDeleting(false);
    }
  };

  const copyPortalLink = async (client) => {
    const url = `${window.location.origin}/portal/${client.portalToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(client.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success('Portal link copied!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="space-y-6">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 mt-1">Manage and track your client onboarding</p>
        </div>
        <Button onClick={() => setShowNewModal(true)}>
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'not_started', label: 'Not Started' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'submitted', label: 'Submitted' },
            { value: 'completed', label: 'Completed' },
          ]}
          className="sm:w-48"
        />
      </div>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="divide-y divide-gray-50">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                <div className="w-9 h-9 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-200 rounded w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {clients.length === 0 ? 'No clients yet' : 'No results found'}
            </h3>
            <p className="text-gray-500 mb-6 text-sm">
              {clients.length === 0
                ? 'Add your first client to start the onboarding process.'
                : 'Try adjusting your search or filter.'}
            </p>
            {clients.length === 0 && (
              <Button onClick={() => setShowNewModal(true)}>
                <Plus className="w-4 h-4" />
                Add Client
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Template
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Added
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-semibold flex-shrink-0">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{client.name}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {client.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={client.status} />
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-600">
                        {client.template?.name || <span className="text-gray-400">No template</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm text-gray-500">{formatDate(client.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => copyPortalLink(client)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                          title="Copy portal link"
                        >
                          {copiedId === client.id ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <a
                          href={`/portal/${client.portalToken}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                          title="Open portal"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => setDeleteModal(client)}
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* New client modal */}
      <NewClientModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        templates={templates}
        onCreated={(newClient) => {
          setClients((prev) => [newClient, ...prev]);
          toast.success(`Client "${newClient.name}" added!`);
        }}
      />

      {/* Delete modal */}
      <Modal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Client"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{deleteModal?.name}</strong>? This will also delete all their tasks and submissions.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteModal(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete Client</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Clients;
