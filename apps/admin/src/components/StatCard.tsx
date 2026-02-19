import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: string;
}

export function StatCard({ label, value, change, changeType = 'neutral', icon }: StatCardProps) {
  const changeColor = {
    positive: 'text-green-600 bg-green-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-100',
  }[changeType];

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {change && (
        <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${changeColor}`}>
          {change}
        </span>
      )}
    </div>
  );
}
