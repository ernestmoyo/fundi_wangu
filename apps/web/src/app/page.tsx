import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const CATEGORIES = [
  { id: 'plumbing', icon: '🔧', name: 'Bomba', nameEn: 'Plumbing' },
  { id: 'electrical', icon: '⚡', name: 'Umeme', nameEn: 'Electrical' },
  { id: 'carpentry', icon: '🪚', name: 'Seremala', nameEn: 'Carpentry' },
  { id: 'painting', icon: '🎨', name: 'Rangi', nameEn: 'Painting' },
  { id: 'cleaning', icon: '🧹', name: 'Usafi', nameEn: 'Cleaning' },
  { id: 'masonry', icon: '🧱', name: 'Uashi', nameEn: 'Masonry' },
  { id: 'welding', icon: '🔩', name: 'Welding', nameEn: 'Welding' },
  { id: 'ac_repair', icon: '❄️', name: 'AC', nameEn: 'AC Repair' },
];

const FEATURES = [
  {
    title: 'Mafundi Waliothibitishwa',
    titleEn: 'Verified Professionals',
    description: 'Kila Fundi amethibitishwa kwa NIN na ujuzi wake.',
    icon: '✅',
  },
  {
    title: 'Bei Wazi',
    titleEn: 'Transparent Pricing',
    description: 'Jua bei kabla ya kuanza kazi. Hakuna gharama za siri.',
    icon: '💰',
  },
  {
    title: 'Malipo Salama',
    titleEn: 'Secure Payments',
    description: 'Pesa yako iko salama mpaka kazi ikamilike.',
    icon: '🔒',
  },
  {
    title: 'Haraka',
    titleEn: 'Fast Service',
    description: 'Pata Fundi ndani ya dakika 15. Karibu na eneo lako.',
    icon: '⚡',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
        <div className="container-app py-20 lg:py-28">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Pata Fundi wa Kuaminika
            </h1>
            <p className="mt-6 text-lg leading-8 text-primary-100">
              Huduma za fundi za kuaminika Tanzania. Bomba, umeme, seremala, rangi, na zaidi.
              Mafundi waliothibitishwa, bei nzuri, huduma ya haraka.
            </p>
            <div className="mt-10 flex gap-4">
              <Link href="/book" className="btn-secondary">
                Pata Fundi Sasa
              </Link>
              <Link
                href="/join"
                className="inline-flex items-center rounded-xl border-2 border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Jiunge kama Fundi
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20" id="huduma">
        <div className="container-app">
          <h2 className="text-3xl font-bold text-center mb-4">Huduma Zetu</h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
            Chagua aina ya huduma unayohitaji na upate Mafundi bora karibu nawe.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/huduma/${cat.id}`}
                className="card text-center hover:shadow-lg transition-shadow group"
              >
                <span className="text-4xl block mb-3">{cat.icon}</span>
                <h3 className="font-semibold text-gray-800 group-hover:text-primary-500 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{cat.nameEn}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50" id="kwa-nini">
        <div className="container-app">
          <h2 className="text-3xl font-bold text-center mb-4">Kwa Nini Fundi Wangu?</h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
            Jukwaa la kwanza Tanzania linalowezesha uaminifu kati ya wateja na mafundi.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="card text-center">
                <span className="text-3xl block mb-4">{f.icon}</span>
                <h3 className="font-semibold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-500 text-white">
        <div className="container-app text-center">
          <h2 className="text-3xl font-bold mb-4">Uko Tayari?</h2>
          <p className="text-primary-100 mb-8 max-w-md mx-auto">
            Jiunge na maelfu ya wateja na Mafundi wanaotumia Fundi Wangu kila siku.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/book" className="btn-secondary">
              Pata Fundi
            </Link>
            <Link
              href="/join"
              className="inline-flex items-center rounded-xl border-2 border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Jiunge kama Fundi
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
