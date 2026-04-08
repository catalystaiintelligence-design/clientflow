export const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const statusLabel = (status) => {
  const labels = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    submitted: 'Submitted',
    completed: 'Completed',
    pending: 'Pending',
    done: 'Done',
  };
  return labels[status] || status;
};

export const statusColor = (status) => {
  const colors = {
    not_started: 'bg-gray-100 text-gray-600 border border-gray-200',
    in_progress: 'bg-blue-50 text-blue-700 border border-blue-200',
    submitted:   'bg-orange-50 text-orange-700 border border-orange-200',
    completed:   'bg-green-50 text-green-700 border border-green-200',
    pending:     'bg-gray-100 text-gray-600 border border-gray-200',
    done:        'bg-green-50 text-green-700 border border-green-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-600 border border-gray-200';
};

export const getInitials = (name) => {
  if (!name) return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};
