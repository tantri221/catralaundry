import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Skeleton Header */}
      <div className="bg-slate-200/70 h-24 rounded-2xl w-full"></div>

      {/* Skeleton Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-200/70 h-24 rounded-2xl"></div>
        <div className="bg-slate-200/70 h-24 rounded-2xl"></div>
        <div className="bg-slate-200/70 h-24 rounded-2xl"></div>
      </div>

      {/* Skeleton Content */}
      <div className="bg-slate-200/70 h-64 rounded-2xl w-full"></div>
    </div>
  );
}
