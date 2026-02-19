'use client';

import React from 'react';

export default function PayoutsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Malipo ya Nje</h1>
          <p className="text-sm text-gray-500 mt-1">
            Maombi ya kutoa fedha kutoka kwa Mafundi kwenda M-Pesa/Tigo Pesa
          </p>
        </div>
        <button className="text-sm px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors">
          Lipie Yote Yanayosubiri
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Yanayosubiri</p>
          <p className="text-xl font-bold text-amber-500">—</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Yanafanyika</p>
          <p className="text-xl font-bold text-blue-500">—</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Yaliyokamilika Leo</p>
          <p className="text-xl font-bold text-green-500">—</p>
        </div>
      </div>

      {/* Payouts table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Fundi</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Kiasi (TZS)</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Simu</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Mtandao</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Hali</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Hatua</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-300 text-sm">
                Hakuna malipo yanayosubiri
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
