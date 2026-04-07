import React from 'react';
import { statusLabel, statusColor } from '../utils/formatters';

const Badge = ({ status, children, className = '' }) => {
  const colorClass = statusColor(status);
  const label = children || statusLabel(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}
    >
      {label}
    </span>
  );
};

export default Badge;
