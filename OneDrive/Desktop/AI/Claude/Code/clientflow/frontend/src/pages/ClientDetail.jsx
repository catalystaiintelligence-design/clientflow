import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Mail, ExternalLink, Copy, Check, Plus, CheckCircle,
  Clock, AlertCircle, FileText, Send, Edit2, Save, X
} from 'lucide-react';
import api from '../utils/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import { formatDate, formatDateTime, statusLabel } from '../utils/formatters';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';

const TaskItem = ({ task, onUpdate }) => {
  const [updating, setUpdating] = useState(false);

  const cycleStatus = async () => {
    const next = { pending: 'in_progress', in_progress: 'done', done: 'pending' };
    setUpdating(true);
    try {
      const updated = await api.put(`/tasks/${task.id}`, { status: next[task.status] });
      onUpdate(updated.data);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const icons = {
    pending: <AlertCircle className="w-5 h-5 text-gray-400" />,
    in_progress: <Clock className="w-5 h-5 text-blue-500" />,
    done: <CheckCircle className="w-5 h-5 text-green-500" />,
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <button
        onClick={cycleStatus}
        disabled={updating}
        className="flex-shrink-0 hover:opacity-70 transition-opacity disabled:opacity-50"
        title={`Mark as ${task.status === 'done' ? 'pending' : task.status === 'pending' ? 'in progress' : 'done'}`}
      >
        {icons[task.status]}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {task.title}
        </p>
        {task.assignee && (
          <p className="text-xs text-gray-500">{task.assignee.fullName}</p>
        )}
      </div>
      <Badge status={task.status} />
    </div>
  );
};

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toasts, toast, removeToast } = useToast();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [editStatus, setEditStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [resendingInvite, setResendingInvite] = useState(false);

  const fetchClient = async () => {
    try {
      const res = await api.get(`/clients/${id}`);
      setClient(res.data);
      setNewStatus(res.data.status);
    } catch {
      toast.error('Failed to load client');
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClient(); }, [id]);

  const copyPortalLink = async () => {
    const url = `${window.location.origin}/portal/${client.portalToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
      toast.success('Portal link copied!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    setAddingTask(true);
    try {
      const res = await api.post('/tasks', { clientId: id, title: newTaskTitle });
      setClient((prev) => ({ ...prev, tasks: [res.data, ...prev.tasks] }));
      setNewTaskTitle('');
      setShowAddTask(false);
      toast.success('Task added');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add task');
    } finally {
      setAddingTask(false);
    }
  };

  const handleTaskUpdate = (updated) => {
    setClient((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === updated.id ? updated : t)),
    }));
  };

  const handleStatusUpdate = async () => {
    setUpdatingStatus(true);
    try {
      const res = await api.put(`/clients/${id}`, { status: newStatus });
      setClient((prev) => ({ ...prev, status: res.data.status }));
      setEditStatus(false);
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleResendInvite = async () => {
    setResendingInvite(true);
    try {
      await api.post(`/clients/${id}/resend-invite`);
      toast.success('Invite email sent!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send invite');
    } finally {
      setResendingInvite(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-gray-200 rounded-xl" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!client) return null;

  const latestSubmission = client.submissions?.[0];

  return (
    <div className="space-y-6">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/clients')}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <Badge status={client.status} />
          </div>
          <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5">
            <Mail className="w-3.5 h-3.5" />
            {client.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={copyPortalLink}>
            {copiedToken ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            Copy Link
          </Button>
          <a
            href={`/portal/${client.portalToken}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary" size="sm">
              <ExternalLink className="w-4 h-4" />
              Portal
            </Button>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tasks */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">
                  Tasks
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({client.tasks?.filter((t) => t.status === 'done').length || 0}/
                    {client.tasks?.length || 0} done)
                  </span>
                </h2>
                <Button size="sm" variant="secondary" onClick={() => setShowAddTask(true)}>
                  <Plus className="w-4 h-4" />
                  Add Task
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="py-2">
              {showAddTask && (
                <div className="flex gap-2 mb-3 py-2">
                  <Input
                    placeholder="Task title..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                    className="flex-1"
                    autoFocus
                  />
                  <Button size="sm" loading={addingTask} onClick={handleAddTask}>
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddTask(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {client.tasks?.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">
                  No tasks yet. Add a task or submit the portal to auto-create tasks.
                </div>
              ) : (
                <div>
                  {client.tasks?.map((task) => (
                    <TaskItem key={task.id} task={task} onUpdate={handleTaskUpdate} />
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Latest Submission */}
          {latestSubmission && (
            <Card>
              <Card.Header>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <h2 className="font-semibold text-gray-900">Form Submission</h2>
                  <span className="text-xs text-gray-400">
                    {formatDateTime(latestSubmission.submittedAt)}
                  </span>
                </div>
              </Card.Header>
              <Card.Body>
                {latestSubmission.fieldData && Object.keys(latestSubmission.fieldData).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {client.template?.fields?.map((field) => {
                      const value = latestSubmission.fieldData[field.id];
                      if (value === undefined || value === null || value === '') return null;
                      return (
                        <div key={field.id}>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            {field.label}
                          </p>
                          <p className="text-sm text-gray-800">
                            {field.type === 'checkbox'
                              ? value ? 'Yes' : 'No'
                              : String(value)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No field data submitted</p>
                )}

                {latestSubmission.fileUrls && Object.keys(latestSubmission.fileUrls).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Uploaded Files
                    </p>
                    <div className="space-y-2">
                      {Object.entries(latestSubmission.fileUrls).map(([key, files]) =>
                        (Array.isArray(files) ? files : [files]).map((file, i) => (
                          <a
                            key={`${key}-${i}`}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary-600 hover:underline"
                          >
                            <FileText className="w-4 h-4" />
                            {file.originalName || `File ${i + 1}`}
                          </a>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </div>

        {/* Right column - Client info */}
        <div className="space-y-6">
          <Card>
            <Card.Header>
              <h2 className="font-semibold text-gray-900">Client Details</h2>
            </Card.Header>
            <Card.Body className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Status</p>
                {editStatus ? (
                  <div className="flex gap-2">
                    <Select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      options={[
                        { value: 'not_started', label: 'Not Started' },
                        { value: 'in_progress', label: 'In Progress' },
                        { value: 'submitted', label: 'Submitted' },
                        { value: 'completed', label: 'Completed' },
                      ]}
                    />
                    <Button size="sm" loading={updatingStatus} onClick={handleStatusUpdate}>
                      <Save className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditStatus(false)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge status={client.status} />
                    <button
                      onClick={() => setEditStatus(true)}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Template</p>
                <p className="text-sm text-gray-800">
                  {client.template?.name || (
                    <span className="text-gray-400">No template assigned</span>
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Added</p>
                <p className="text-sm text-gray-800">{formatDate(client.createdAt)}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Submissions</p>
                <p className="text-sm text-gray-800">{client.submissions?.length || 0}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Portal Link</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500 truncate flex-1 font-mono bg-gray-50 px-2 py-1 rounded">
                    /portal/{client.portalToken?.slice(0, 12)}...
                  </p>
                  <button onClick={copyPortalLink} className="text-primary-600 hover:text-primary-700">
                    {copiedToken ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </Card.Body>
            <Card.Footer>
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                loading={resendingInvite}
                onClick={handleResendInvite}
              >
                <Send className="w-4 h-4" />
                Resend Invite Email
              </Button>
            </Card.Footer>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;
