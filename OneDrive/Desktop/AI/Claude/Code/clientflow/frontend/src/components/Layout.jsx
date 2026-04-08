import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-sf-neutral">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col lg:ml-0 mt-14 lg:mt-0">
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
