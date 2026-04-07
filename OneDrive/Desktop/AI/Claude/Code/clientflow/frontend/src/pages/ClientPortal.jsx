import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Zap, CheckCircle, Upload, Loader2, AlertCircle, X } from 'lucide-react';
import axios from 'axios';

const apiBase = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

const FieldRenderer = ({ field, value, onChange, error, files, onFileChange, onRemoveFile }) => {
  const fileInputRef = useRef(null);

  const baseInputClass = `
    w-full px-3 py-2 border rounded-lg text-sm
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
    ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}
  `;

  const label = (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {field.label}
      {field.required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );

  switch (field.type) {
    case 'textarea':
      return (
        <div>
          {label}
          <textarea
            rows={4}
            className={baseInputClass}
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
          />
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      );

    case 'select':
      return (
        <div>
          {label}
          <select
            className={`${baseInputClass} appearance-none`}
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
          >
            <option value="">Select an option...</option>
            {(field.options || []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      );

    case 'checkbox':
      return (
        <div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={value || false}
              onChange={(e) => onChange(field.id, e.target.checked)}
            />
            <span className="text-sm text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </span>
          </label>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      );

    case 'file':
      return (
        <div>
          {label}
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
              ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-primary-300 hover:bg-primary-50'}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, Images up to 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onFileChange(field.id, e.target.files)}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv"
            />
          </div>
          {/* File list */}
          {files && files.length > 0 && (
            <ul className="mt-2 space-y-1">
              {Array.from(files).map((file, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <span className="flex-1 truncate">{file.name}</span>
                  <span className="text-gray-400 flex-shrink-0">
                    {(file.size / 1024).toFixed(0)}KB
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemoveFile(field.id, i); }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      );

    default:
      // text, email, phone
      return (
        <div>
          {label}
          <input
            type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
            className={baseInputClass}
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={
              field.type === 'email' ? 'you@example.com'
              : field.type === 'phone' ? '+1 (555) 000-0000'
              : `Enter ${field.label.toLowerCase()}...`
            }
          />
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      );
  }
};

const ClientPortal = () => {
  const { token } = useParams();

  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [fieldValues, setFieldValues] = useState({});
  const [fileValues, setFileValues] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const fetchPortal = async () => {
      try {
        const res = await axios.get(`${apiBase}/portal/${token}`);
        setPortalData(res.data);
        if (res.data.hasSubmission) setSubmitted(true);
      } catch (err) {
        if (err.response?.status === 404) setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPortal();
  }, [token]);

  const handleFieldChange = (fieldId, value) => {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => ({ ...prev, [fieldId]: '' }));
  };

  const handleFileChange = (fieldId, fileList) => {
    setFileValues((prev) => ({ ...prev, [fieldId]: Array.from(fileList) }));
    setErrors((prev) => ({ ...prev, [fieldId]: '' }));
  };

  const removeFile = (fieldId, index) => {
    setFileValues((prev) => {
      const newFiles = [...(prev[fieldId] || [])];
      newFiles.splice(index, 1);
      return { ...prev, [fieldId]: newFiles };
    });
  };

  const validate = () => {
    const newErrors = {};
    const fields = portalData?.template?.fields || [];
    for (const field of fields) {
      if (!field.required) continue;
      if (field.type === 'file') {
        if (!fileValues[field.id] || fileValues[field.id].length === 0) {
          newErrors[field.id] = 'This file is required';
        }
      } else if (field.type === 'checkbox') {
        if (!fieldValues[field.id]) {
          newErrors[field.id] = 'You must check this box';
        }
      } else {
        if (!fieldValues[field.id]?.toString().trim()) {
          newErrors[field.id] = 'This field is required';
        }
      }
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstError = document.querySelector('[data-error="true"]');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const formData = new FormData();
      formData.append('fieldData', JSON.stringify(fieldValues));

      // Append files
      for (const [fieldId, files] of Object.entries(fileValues)) {
        for (const file of files) {
          formData.append(fieldId, file);
        }
      }

      await axios.post(`${apiBase}/portal/${token}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Not found
  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Portal Not Found</h1>
          <p className="text-gray-500">This onboarding link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  // Already submitted
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-9 h-9 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {portalData?.hasSubmission ? 'Already Submitted' : 'Thank You!'}
          </h1>
          <p className="text-gray-500 mb-2">
            {portalData?.hasSubmission
              ? `Your onboarding form for ${portalData?.clientName} has already been submitted.`
              : `Your onboarding form has been submitted successfully, ${portalData?.clientName}!`}
          </p>
          <p className="text-sm text-gray-400">
            We'll be in touch with you soon.
          </p>
        </div>
      </div>
    );
  }

  const fields = portalData?.template?.fields || [];

  // No template assigned
  if (!portalData?.template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Form Not Ready</h1>
          <p className="text-gray-500">
            Your onboarding form isn't set up yet. Please contact the team for assistance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">ClientFlow</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, {portalData?.clientName}!
          </h1>
          <p className="text-gray-600">
            Please complete the form below to get started with your onboarding.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Template name */}
          <div className="px-8 py-5 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-900">{portalData?.template?.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {fields.filter((f) => f.required).length} required fields
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
            {fields.map((field) => (
              <div
                key={field.id}
                data-error={!!errors[field.id]}
              >
                <FieldRenderer
                  field={field}
                  value={fieldValues[field.id]}
                  onChange={handleFieldChange}
                  error={errors[field.id]}
                  files={fileValues[field.id]}
                  onFileChange={handleFileChange}
                  onRemoveFile={removeFile}
                />
              </div>
            ))}

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Submit Form
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by ClientFlow · Your information is secure
        </p>
      </div>
    </div>
  );
};

export default ClientPortal;
