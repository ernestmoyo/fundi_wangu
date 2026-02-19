'use client';

import React from 'react';

export default function WasifuPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Wasifu Wangu</h1>

      <div className="card mb-6">
        {/* Avatar + name */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xl font-bold">
            ?
          </div>
          <div>
            <p className="text-sm text-gray-400">Jina</p>
            <p className="font-semibold text-lg">—</p>
          </div>
        </div>

        {/* Profile fields */}
        <div className="space-y-4">
          <div className="flex justify-between py-3 border-b border-gray-100">
            <span className="text-sm text-gray-500">Simu</span>
            <span className="text-sm font-medium">—</span>
          </div>
          <div className="flex justify-between py-3 border-b border-gray-100">
            <span className="text-sm text-gray-500">Lugha</span>
            <span className="text-sm font-medium">Kiswahili</span>
          </div>
          <div className="flex justify-between py-3 border-b border-gray-100">
            <span className="text-sm text-gray-500">Akaunti</span>
            <span className="text-sm font-medium">Mteja</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button className="w-full card text-left flex items-center justify-between hover:bg-gray-50 transition-colors">
          <span className="text-sm">Badilisha Lugha</span>
          <span className="text-gray-400">›</span>
        </button>
        <button className="w-full card text-left flex items-center justify-between hover:bg-gray-50 transition-colors">
          <span className="text-sm">Arifa</span>
          <span className="text-gray-400">›</span>
        </button>
        <button className="w-full text-left px-6 py-3 rounded-2xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors">
          Toka
        </button>
      </div>
    </div>
  );
}
