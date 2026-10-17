import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AppLayout({ children, onNewWorkspace }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg-main text-text-main">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar onNewWorkspace={onNewWorkspace} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
