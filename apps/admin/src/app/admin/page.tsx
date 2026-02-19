'use client';

import React from 'react';
import { StatCard } from '@/components/StatCard';

export default function AdminDashboard() {
  // These will integrate with admin API endpoints
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Muhtasari wa jukwaa</p>
        </div>
        <div className="flex gap-2">
          <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
            <option>Leo</option>
            <option>Wiki Hii</option>
            <option>Mwezi Huu</option>
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Kazi Leo" value="—" change="—" changeType="neutral" icon="📋" />
        <StatCard label="GMV (TZS)" value="—" change="—" changeType="neutral" icon="💰" />
        <StatCard label="Mafundi Mtandaoni" value="—" icon="🟢" />
        <StatCard label="Wateja Wapya" value="—" icon="👥" />
      </div>

      {/* Charts area */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Kazi kwa Siku</h3>
          <div className="h-64 flex items-center justify-center text-gray-300 text-sm">
            Chati ya kazi litaunganishwa na API
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Mapato kwa Siku</h3>
          <div className="h-64 flex items-center justify-center text-gray-300 text-sm">
            Chati ya mapato litaunganishwa na API
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Verification queue */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Foleni ya Uthibitisho</h3>
            <span className="text-xs px-2 py-1 bg-amber-50 text-amber-600 rounded-full">
              — wanasubiri
            </span>
          </div>
          <div className="text-center py-8 text-gray-300 text-sm">
            Hakuna mafundi wanaosubiri uthibitisho
          </div>
        </div>

        {/* Active disputes */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Migogoro Hai</h3>
            <span className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-full">
              — wazi
            </span>
          </div>
          <div className="text-center py-8 text-gray-300 text-sm">
            Hakuna migogoro wazi
          </div>
        </div>
      </div>
    </div>
  );
}
