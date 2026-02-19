'use client';

import React from 'react';

const CONFIG_SECTIONS = [
  {
    title: 'Ada za Jukwaa',
    items: [
      { label: 'Asilimia ya Ada', value: '15%', key: 'platform_fee_pct' },
      { label: 'VAT', value: '18%', key: 'vat_pct' },
      { label: 'Kiwango cha Chini (TZS)', value: '10,000', key: 'min_job_amount_tzs' },
    ],
  },
  {
    title: 'Escrow',
    items: [
      { label: 'Muda wa Kuhifadhi (saa)', value: '24', key: 'escrow_hold_hours' },
      { label: 'Muda wa Kutatua Mgogoro (siku)', value: '7', key: 'dispute_resolution_days' },
    ],
  },
  {
    title: 'OTP',
    items: [
      { label: 'Urefu wa OTP', value: '6', key: 'otp_length' },
      { label: 'Muda wa OTP (dakika)', value: '10', key: 'otp_expiry_minutes' },
      { label: 'Majaribio ya Juu', value: '5', key: 'otp_max_attempts' },
    ],
  },
  {
    title: 'Fundi',
    items: [
      { label: 'Radius ya Utafutaji (km)', value: '15', key: 'search_radius_km' },
      { label: 'Mafundi wa Juu kwa Utafutaji', value: '20', key: 'max_search_results' },
      { label: 'Kiwango cha Chini cha Nyota (Bronze)', value: '3.0', key: 'min_rating_bronze' },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Mipangilio ya Jukwaa</h1>
        <p className="text-sm text-gray-500 mt-1">
          Dhibiti usanidi wa jukwaa zima
        </p>
      </div>

      <div className="space-y-6">
        {CONFIG_SECTIONS.map((section) => (
          <div key={section.title} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold">{section.title}</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {section.items.map((item) => (
                <div key={item.key} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.key}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-gray-600 bg-gray-50 px-3 py-1 rounded-lg">
                      {item.value}
                    </span>
                    <button className="text-xs text-primary-500 hover:underline">
                      Hariri
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
