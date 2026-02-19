'use client';

import React from 'react';
import { StatCard } from '@/components/StatCard';

export default function FinancePage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Fedha</h1>
          <p className="text-sm text-gray-500 mt-1">
            Muhtasari wa fedha za jukwaa, ada, VAT, na malipo
          </p>
        </div>
        <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
          <option>Mwezi Huu</option>
          <option>Wiki Hii</option>
          <option>Mwaka Huu</option>
        </select>
      </div>

      {/* Finance KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="GMV Jumla" value="—" icon="💰" />
        <StatCard label="Ada za Jukwaa (15%)" value="—" icon="📊" />
        <StatCard label="VAT (18%)" value="—" icon="🏛️" />
        <StatCard label="Fedha za Escrow" value="—" icon="🔒" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <StatCard label="Fedha Zilizorejeshwa" value="—" icon="↩️" />
        <StatCard label="Malipo ya Nje Yaliyofanyika" value="—" icon="🏦" />
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
        <h3 className="font-semibold mb-4">Mapato kwa Mwezi</h3>
        <div className="h-72 flex items-center justify-center text-gray-300 text-sm">
          Chati ya mapato litaunganishwa na API ya admin
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold">Malipo ya Hivi Karibuni</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tarehe</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Kazi</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Kiasi</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ada</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Hali</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-gray-300 text-sm">
                Hakuna malipo ya hivi karibuni
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
