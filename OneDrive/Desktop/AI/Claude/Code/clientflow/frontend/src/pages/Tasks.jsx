import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Clock, AlertCircle, CheckCircle, Filter } from 'lucide-react';
import api from '../utils/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Select from '../components/Select';
import { formatDate } from '../utils/formatters';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const TaskStatusIcon = ({ status }) => {
  if (status === 'done') return <CheckCircle className="w-5 h-5 text-green-500" />;
  if (status === 'in_progress') return <Clock className="w-5 h-5 text-blue-500" />;
  return <AlertCircle className="w-5 h-5 text-gray-400" />;
};

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const { toasts, toast, removeToast } = useToast();

  const fetchTasks = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/tasks', { params });
      setTasks(res.data);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  const updateTaskStatus = async (task, newStatus) => {
    setUpdatingId(task.id);
    try {
      const res = await api.put(`/tasks/${task.id}`, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? res.data : t)));
      toast.success('Task updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update task');
    } finally {
      setUpdatingId(null);
    }
  };

  const pending = tasks.filter((t) => t.status === 'pending');
  const inProgress = tasks.filter((t) => t.status === 'in_progress');
  const done = tasks.filter((t) => t.status === 'done');

  const filteredTasks = statusFilter
    ? tasks.filter((t) => t.status === statusFilter)
    : tasks;

  return (
    <div className="space-y-6">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 mt-1">Track and manage all client onboarding tasks</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-gray-700">{pending.length}</p>
          <p className="text-sm text-gray-500 mt-1">Pending</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-blue-600">{inProgress.length}</p>
          <p className="text-sm text-gray-500 mt-1">In Progress</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-600">{done.length}</p>
          <p className="text-sm text-gray-500 mt-1">Done</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-gray-500" />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={STATUS_OPTIONS}
          className="w-48"
        />
      </div>

      {/* Task list */}
      <Card>
        {loading ? (
          <div className="divide-y divide-gray-50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                <div className="w-5 h-5 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-64" />
                  <div className="h-3 bg-gray-200 rounded w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-16 text-center">
            <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No tasks found</h3>
            <p className="text-gray-500 text-sm">
              Tasks are auto-created when clients submit their portal form.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <TaskStatusIcon status={task.status} />

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Link
                      to={`/clients/${task.client?.id}`}
                      className="text-xs text-primary-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {task.client?.name}
                    </Link>
                    {task.assignee && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-500">{task.assignee.fullName}</span>
                      </>
                    )}
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{formatDate(task.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge status={task.status} />
                  <Select
                    value={task.status}
                    onChange={(e) => updateTaskStatus(task, e.target.value)}
                    options={[
                      { value: 'pending', label: 'Pending' },
                      { value: 'in_progress', label: 'In Progress' },
                      { value: 'done', label: 'Done' },
                    ]}
                    className="text-xs w-36"
                    disabled={updatingId === task.id}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Tasks;
