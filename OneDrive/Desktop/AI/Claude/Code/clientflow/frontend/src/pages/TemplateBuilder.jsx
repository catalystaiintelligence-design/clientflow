import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, ChevronUp, ChevronDown, Save, ArrowLeft, GripVertical } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import api from '../utils/api';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Card from '../components/Card';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'select', label: 'Dropdown' },
  { value: 'file', label: 'File Upload' },
  { value: 'checkbox', label: 'Checkbox' },
];

const defaultField = () => ({
  id: uuidv4(),
  type: 'text',
  label: '',
  required: false,
  options: [],
});

const FieldRow = ({ field, index, total, onChange, onRemove, onMove }) => {
  const [optionInput, setOptionInput] = useState('');

  const addOption = () => {
    if (!optionInput.trim()) return;
    onChange({ ...field, options: [...(field.options || []), optionInput.trim()] });
    setOptionInput('');
  };

  const removeOption = (i) => {
    const opts = [...(field.options || [])];
    opts.splice(i, 1);
    onChange({ ...field, options: opts });
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-3">
      <div className="flex items-center gap-3">
        <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Field label"
            value={field.label}
            onChange={(e) => onChange({ ...field, label: e.target.value })}
          />
          <Select
            options={FIELD_TYPES}
            value={field.type}
            onChange={(e) => onChange({ ...field, type: e.target.value, options: [] })}
          />
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onChange({ ...field, required: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Required
          </label>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onMove(index, -1)}
            disabled={index === 0}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
            title="Move up"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMove(index, 1)}
            disabled={index === total - 1}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
            title="Move down"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRemove(field.id)}
            className="p-1.5 rounded hover:bg-red-50 text-red-500"
            title="Remove field"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Options for select */}
      {field.type === 'select' && (
        <div className="ml-7 space-y-2">
          <p className="text-xs font-medium text-gray-600">Dropdown options:</p>
          <div className="flex flex-wrap gap-2">
            {(field.options || []).map((opt, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs"
              >
                {opt}
                <button onClick={() => removeOption(i)} className="hover:text-red-600">
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={optionInput}
              onChange={(e) => setOptionInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
              placeholder="Add option and press Enter"
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={addOption}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const TemplateBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { toasts, toast, removeToast } = useToast();

  const [name, setName] = useState('');
  const [fields, setFields] = useState([defaultField()]);
  const [taskTemplates, setTaskTemplates] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);

  useEffect(() => {
    if (!isEditing) return;
    const fetchTemplate = async () => {
      try {
        const res = await api.get(`/templates/${id}`);
        setName(res.data.name);
        setFields(res.data.fields || []);
        setTaskTemplates(
          Array.isArray(res.data.taskTemplates)
            ? res.data.taskTemplates.map((t) => (typeof t === 'string' ? t : t.title))
            : []
        );
      } catch {
        toast.error('Failed to load template');
        navigate('/templates');
      } finally {
        setFetching(false);
      }
    };
    fetchTemplate();
  }, [id]);

  const addField = () => setFields((prev) => [...prev, defaultField()]);

  const updateField = (updated) => {
    setFields((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  const removeField = (fieldId) => {
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
  };

  const moveField = (index, direction) => {
    const newFields = [...fields];
    const target = index + direction;
    if (target < 0 || target >= newFields.length) return;
    [newFields[index], newFields[target]] = [newFields[target], newFields[index]];
    setFields(newFields);
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    setTaskTemplates((prev) => [...prev, newTask.trim()]);
    setNewTask('');
  };

  const removeTask = (i) => {
    setTaskTemplates((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    if (fields.length === 0) {
      toast.error('Please add at least one field');
      return;
    }
    const emptyLabels = fields.filter((f) => !f.label.trim());
    if (emptyLabels.length > 0) {
      toast.error('All fields must have a label');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/templates/${id}`, { name, fields, taskTemplates });
        toast.success('Template updated!');
      } else {
        await api.post('/templates', { name, fields, taskTemplates });
        toast.success('Template created!');
      }
      setTimeout(() => navigate('/templates'), 800);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/templates')}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Template' : 'New Template'}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Build your client onboarding form
          </p>
        </div>
      </div>

      {/* Template Name */}
      <Card>
        <Card.Body>
          <Input
            label="Template Name"
            placeholder="e.g. Web Design Client Intake"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Card.Body>
      </Card>

      {/* Fields */}
      <Card>
        <Card.Header>
          <h2 className="font-semibold text-gray-900">Form Fields</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Define the fields your clients will fill out
          </p>
        </Card.Header>
        <Card.Body className="space-y-3">
          {fields.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No fields yet. Add your first field below.
            </div>
          ) : (
            fields.map((field, index) => (
              <FieldRow
                key={field.id}
                field={field}
                index={index}
                total={fields.length}
                onChange={updateField}
                onRemove={removeField}
                onMove={moveField}
              />
            ))
          )}

          <Button variant="secondary" onClick={addField} className="w-full">
            <Plus className="w-4 h-4" />
            Add Field
          </Button>
        </Card.Body>
      </Card>

      {/* Task Templates */}
      <Card>
        <Card.Header>
          <h2 className="font-semibold text-gray-900">Auto-Tasks</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Tasks that are automatically created when a client submits the form
          </p>
        </Card.Header>
        <Card.Body className="space-y-3">
          {taskTemplates.length > 0 && (
            <ul className="space-y-2">
              {taskTemplates.map((task, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-700 flex items-center gap-2">
                    <span className="w-5 h-5 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-semibold">
                      {i + 1}
                    </span>
                    {task}
                  </span>
                  <button
                    onClick={() => removeTask(i)}
                    className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTask())}
              placeholder="e.g. Schedule kickoff call"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Button variant="secondary" onClick={addTask}>
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Save */}
      <div className="flex gap-3 justify-end pb-4">
        <Button variant="secondary" onClick={() => navigate('/templates')}>
          Cancel
        </Button>
        <Button loading={loading} onClick={handleSave}>
          <Save className="w-4 h-4" />
          {isEditing ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </div>
  );
};

export default TemplateBuilder;
