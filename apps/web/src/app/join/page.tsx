import Link from 'next/link';
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Jiunge kama Fundi — Fundi Wangu',
  description: 'Jiunge na Fundi Wangu na uanze kupata wateja wapya. Pata kazi, lipa kidogo, pata zaidi.',
};

const BENEFITS = [
  { icon: '📱', title: 'Pata Kazi Moja kwa Moja', desc: 'Wateja karibu nawe watakupata moja kwa moja kupitia app.' },
  { icon: '💰', title: 'Lipa Kidogo', desc: 'Asilimia 15 tu ya kila kazi. Hakuna ada ya kujisajili.' },
  { icon: '⭐', title: 'Jenga Sifa Yako', desc: 'Wateja wataona tathmini zako na ujuzi wako. Nyota zaidi = kazi zaidi.' },
  { icon: '🏦', title: 'Malipo ya Haraka', desc: 'Fedha zinaenda moja kwa moja kwenye M-Pesa / Tigo Pesa yako.' },
  { icon: '📈', title: 'Kuza Biashara', desc: 'Pata zana za kukuza na kudhibiti biashara yako ya fundi.' },
  { icon: '🛡️', title: 'Ulinzi', desc: 'Mfumo wa escrow unalinda malipo yako. Haki za wazi za mgogoro.' },
];

const STEPS = [
  { step: '1', title: 'Sajili', desc: 'Jisajili kwa nambari ya simu na NIN yako.' },
  { step: '2', title: 'Thibitishwa', desc: 'Timu yetu inathibitisha kitambulisho na ujuzi wako.' },
  { step: '3', title: 'Anza Kupata Kazi', desc: 'Washa hali yako ya mtandaoni na anza kupokea maombi.' },
];

export default function JoinPage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-accent-500 to-accent-700 text-white py-20">
        <div className="container-app">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-extrabold">
              Jiunge na Mafundi Bora Tanzania
            </h1>
            <p className="mt-6 text-lg text-orange-100">
              Pata wateja wapya, jenga sifa yako, na kuza biashara yako ya fundi
              kupitia jukwaa la Fundi Wangu.
            </p>
            <Link href="/login" className="btn-primary mt-8 inline-flex bg-white text-accent-600 hover:bg-gray-100">
              Anza Sasa — Bure
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container-app">
          <h2 className="text-3xl font-bold text-center mb-12">Faida za Kuwa Fundi Wetu</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {BENEFITS.map((b) => (
              <div key={b.title} className="card">
                <span className="text-3xl block mb-3">{b.icon}</span>
                <h3 className="font-semibold text-lg mb-2">{b.title}</h3>
                <p className="text-sm text-gray-500">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 bg-gray-50">
        <div className="container-app">
          <h2 className="text-3xl font-bold text-center mb-12">Hatua 3 za Kuanza</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-accent-500 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
