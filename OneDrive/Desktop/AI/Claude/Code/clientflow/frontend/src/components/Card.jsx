import React from 'react';

const Card = ({ children, className = '', ...props }) => (
  <div
    className={`bg-white rounded-lg border border-sf-border shadow-card ${className}`}
    {...props}
  >
    {children}
  </div>
);

Card.Header = ({ children, className = '' }) => (
  <div className={`px-5 py-3.5 border-b border-sf-border bg-gray-50/50 rounded-t-lg ${className}`}>
    {children}
  </div>
);

Card.Body = ({ children, className = '' }) => (
  <div className={`px-5 py-4 ${className}`}>{children}</div>
);

Card.Footer = ({ children, className = '' }) => (
  <div className={`px-5 py-3 border-t border-sf-border bg-gray-50/50 rounded-b-lg ${className}`}>
    {children}
  </div>
);

export default Card;
