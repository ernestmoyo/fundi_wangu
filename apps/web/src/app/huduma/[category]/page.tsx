import Link from 'next/link';
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const CATEGORY_INFO: Record<string, { name: string; nameEn: string; description: string; icon: string }> = {
  plumbing: { name: 'Bomba', nameEn: 'Plumbing', description: 'Huduma za mfumo wa maji, kurekebisha mabomba, kufunga bomba mpya, na mengi zaidi.', icon: '🔧' },
  electrical: { name: 'Umeme', nameEn: 'Electrical', description: 'Kufunga umeme, kurekebisha tatizo la umeme, kuongeza soketi, na huduma zote za umeme.', icon: '⚡' },
  carpentry: { name: 'Seremala', nameEn: 'Carpentry', description: 'Kufanya samani, kurekebisha milango na madirisha, kazi zote za mbao.', icon: '🪚' },
  painting: { name: 'Rangi', nameEn: 'Painting', description: 'Kupaka rangi ndani na nje, kumaliza kuta, na huduma zote za rangi.', icon: '🎨' },
  cleaning: { name: 'Usafi', nameEn: 'Cleaning', description: 'Usafi wa nyumba, ofisi, na sehemu zingine. Usafi wa kina na wa kawaida.', icon: '🧹' },
  masonry: { name: 'Uashi', nameEn: 'Masonry', description: 'Kazi za ujenzi, kurekebisha kuta, kupiga plasta, na kazi zote za mawe.', icon: '🧱' },
  welding: { name: 'Welding', nameEn: 'Welding', description: 'Kazi za chuma, milango ya chuma, grili za madirisha, na kazi zote za welding.', icon: '🔩' },
  ac_repair: { name: 'AC', nameEn: 'AC Repair', description: 'Kurekebisha na kufunga AC, kusafisha AC, na huduma zote za baridi.', icon: '❄️' },
};

interface PageProps {
  params: { category: string };
}

export function generateMetadata({ params }: PageProps): Metadata {
  const info = CATEGORY_INFO[params.category];
  if (!info) return { title: 'Huduma' };
  return {
    title: `${info.name} (${info.nameEn}) — Fundi Wangu`,
    description: info.description,
  };
}

export function generateStaticParams() {
  return Object.keys(CATEGORY_INFO).map((category) => ({ category }));
}

export default function CategoryPage({ params }: PageProps) {
  const info = CATEGORY_INFO[params.category];

  if (!info) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Huduma hii haipatikani.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-500 to-primary-700 text-white py-16">
        <div className="container-app">
          <span className="text-5xl mb-4 block">{info.icon}</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold">
            Huduma za {info.name}
          </h1>
          <p className="mt-4 text-primary-100 max-w-xl">{info.description}</p>
          <Link href="/book" className="btn-secondary mt-8 inline-flex">
            Pata Fundi wa {info.name}
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container-app">
          <h2 className="text-2xl font-bold text-center mb-12">Jinsi Inavyofanya Kazi</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Eleza Kazi Yako', desc: 'Tuambie unahitaji nini na wapi.' },
              { step: '2', title: 'Pata Fundi', desc: 'Tutakupendekeza Mafundi bora karibu nawe.' },
              { step: '3', title: 'Kazi Inafanyika', desc: 'Fundi anafika na kumaliza kazi. Lipa baada ya kukamilika.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary-500 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
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
