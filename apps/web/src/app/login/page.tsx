'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formattedPhone = phone.startsWith('0')
    ? `+255${phone.slice(1)}`
    : phone.startsWith('+')
      ? phone
      : `+255${phone}`;

  const isValidPhone = /^\+255[67]\d{8}$/.test(formattedPhone);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone) return;
    setLoading(true);
    setError('');
    try {
      // Will integrate with api.auth.requestOtp
      setStep('otp');
    } catch (err) {
      setError('Imeshindwa kutuma OTP. Jaribu tena.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      // Will integrate with api.auth.verifyOtp
      window.location.href = '/dashboard';
    } catch (err) {
      setError('OTP si sahihi. Jaribu tena.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-md">
          <div className="card-elevated">
            <h1 className="text-2xl font-bold text-center mb-2">Karibu Tena</h1>
            <p className="text-gray-500 text-center text-sm mb-8">
              Ingia kwa nambari yako ya simu
            </p>

            {step === 'phone' && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nambari ya Simu
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      +255
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="712 345 678"
                      className="flex-1 rounded-r-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      maxLength={10}
                      autoComplete="tel"
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={!isValidPhone || loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Inatuma...' : 'Tuma OTP'}
                </button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <p className="text-sm text-gray-500 text-center">
                  Tumetuma nambari ya uthibitisho kwa {formattedPhone}
                </p>

                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full text-center text-2xl tracking-[0.5em] font-bold rounded-xl border border-gray-300 px-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={otp.length !== 6 || loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Inathibitisha...' : 'Thibitisha'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-sm text-primary-500 hover:underline w-full text-center"
                >
                  Badilisha nambari
                </button>
              </form>
            )}

            <p className="text-center text-xs text-gray-400 mt-6">
              Kwa kuingia, unakubali{' '}
              <Link href="/masharti" className="text-primary-500 hover:underline">
                Masharti ya Matumizi
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
