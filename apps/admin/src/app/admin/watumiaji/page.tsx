'use client';

import React, { useState } from 'react';

const ROLE_TABS = ['Wote', 'Wateja', 'Mafundi', 'Mawakala', 'Biashara'];

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState('Wote');
  const [search, setSearch] = useState('');

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Watumiaji</h1>
          <p className="text-sm text-gray-500 mt-1">Simamia watumiaji wote wa jukwaa</p>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex gap-2">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                activeTab === tab
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tafuta kwa jina au simu..."
          className="flex-1 max-w-xs border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Jina</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Simu</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Jukumu</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Hali</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Kazi</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tarehe</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Hatua</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-gray-300 text-sm">
                Hakuna watumiaji wanaolingana na utafutaji
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
