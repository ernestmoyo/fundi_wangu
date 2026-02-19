'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const TABS = ['Zote', 'Zinasubiri', 'Zinafanyika', 'Zilizokamilika'];

export default function KaziPage() {
  const [activeTab, setActiveTab] = useState('Zote');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Kazi Zangu</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map((tab) => (
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

      {/* Jobs list — will integrate with API */}
      <div className="card text-center py-12 text-gray-400">
        <p className="text-4xl mb-3">📋</p>
        <p className="font-medium text-gray-600 mb-1">Huna kazi bado</p>
        <p className="text-sm mb-4">Anza kwa kupata Fundi wa kwako wa kwanza</p>
        <Link href="/book" className="btn-primary text-sm inline-flex">
          Pata Fundi
        </Link>
      </div>
    </div>
  );
}
