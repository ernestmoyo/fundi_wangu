'use client';

import React from 'react';

export default function VerificationPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Uthibitisho wa Mafundi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Thibitisha kitambulisho na ujuzi wa Mafundi wapya
          </p>
        </div>
        <div className="flex gap-2">
          <button className="text-sm px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors">
            Onyesha Wanasubiri Tu
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Jina</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Simu</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Huduma</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">NIN</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tarehe</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Hatua</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-300 text-sm">
                Hakuna maombi ya uthibitisho kwa sasa
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
