import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-app py-16">
        <div className="grid md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="text-white text-lg font-bold mb-3">Fundi Wangu</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Jukwaa la kwanza Tanzania la huduma za fundi zinazotegemea uaminifu.
            </p>
          </div>

          {/* Huduma */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Huduma</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/huduma/plumbing" className="hover:text-white transition-colors">Bomba</Link></li>
              <li><Link href="/huduma/electrical" className="hover:text-white transition-colors">Umeme</Link></li>
              <li><Link href="/huduma/carpentry" className="hover:text-white transition-colors">Seremala</Link></li>
              <li><Link href="/huduma/painting" className="hover:text-white transition-colors">Rangi</Link></li>
              <li><Link href="/huduma/cleaning" className="hover:text-white transition-colors">Usafi</Link></li>
            </ul>
          </div>

          {/* Kampuni */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Kampuni</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/kuhusu" className="hover:text-white transition-colors">Kuhusu Sisi</Link></li>
              <li><Link href="/join" className="hover:text-white transition-colors">Kuwa Fundi</Link></li>
              <li><Link href="/biashara" className="hover:text-white transition-colors">Biashara</Link></li>
              <li><Link href="/msaada" className="hover:text-white transition-colors">Msaada</Link></li>
            </ul>
          </div>

          {/* Sheria */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Sheria</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/faragha" className="hover:text-white transition-colors">Sera ya Faragha</Link></li>
              <li><Link href="/masharti" className="hover:text-white transition-colors">Masharti ya Matumizi</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Fundi Wangu. Haki zote zimehifadhiwa.
          </p>
          <div className="flex gap-4 text-sm text-gray-500">
            <span>Dar es Salaam, Tanzania</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
