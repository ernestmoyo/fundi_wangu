'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="container-app flex items-center justify-between h-16">
        <Link href="/" className="text-xl font-extrabold text-primary-500">
          Fundi Wangu
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/#huduma" className="text-sm text-gray-600 hover:text-primary-500 transition-colors">
            Huduma
          </Link>
          <Link href="/#kwa-nini" className="text-sm text-gray-600 hover:text-primary-500 transition-colors">
            Kwa Nini Sisi
          </Link>
          <Link href="/join" className="text-sm text-gray-600 hover:text-primary-500 transition-colors">
            Kuwa Fundi
          </Link>
          <Link href="/login" className="btn-outline text-xs py-2 px-4">
            Ingia
          </Link>
          <Link href="/book" className="btn-primary text-xs py-2 px-4">
            Pata Fundi
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="md:hidden border-t border-gray-100 px-4 pb-4 space-y-3 bg-white">
          <Link href="/#huduma" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>
            Huduma
          </Link>
          <Link href="/#kwa-nini" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>
            Kwa Nini Sisi
          </Link>
          <Link href="/join" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>
            Kuwa Fundi
          </Link>
          <div className="flex gap-3 pt-2">
            <Link href="/login" className="btn-outline flex-1 text-center text-sm py-2">
              Ingia
            </Link>
            <Link href="/book" className="btn-primary flex-1 text-center text-sm py-2">
              Pata Fundi
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
