'use client';

import React from 'react';

export default function LiveJobsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Kazi za Moja kwa Moja</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ramani ya kazi zinazoendelea kwa wakati halisi
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="inline-flex items-center gap-1.5 text-sm text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Moja kwa Moja
          </span>
        </div>
      </div>

      {/* Map placeholder */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="h-96 flex items-center justify-center bg-gray-100 text-gray-400">
          <div className="text-center">
            <p className="text-4xl mb-3">🗺️</p>
            <p className="text-sm">Ramani ya kazi itaunganishwa na Google Maps API</p>
            <p className="text-xs mt-1">Dar es Salaam, Tanzania</p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-amber-500">—</p>
          <p className="text-xs text-gray-500 mt-1">Zinasubiri</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-blue-500">—</p>
          <p className="text-xs text-gray-500 mt-1">Njiani</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-primary-500">—</p>
          <p className="text-xs text-gray-500 mt-1">Zinafanyika</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-green-500">—</p>
          <p className="text-xs text-gray-500 mt-1">Zilizomalizika Leo</p>
        </div>
      </div>
    </div>
  );
}
