'use client';

import React, { useState } from 'react';

const STATUS_TABS = ['Wote', 'Wazi', 'Wanachunguzwa', 'Wametatuliwa'];

export default function DisputesPage() {
  const [activeTab, setActiveTab] = useState('Wote');

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Migogoro</h1>
          <p className="text-sm text-gray-500 mt-1">Simamia na tatua migogoro kati ya wateja na mafundi</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              activeTab === tab
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Kazi</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Mteja</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Fundi</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Kiasi</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Hali</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Hatua</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-gray-300 text-sm">
                Hakuna migogoro kwa sasa
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
