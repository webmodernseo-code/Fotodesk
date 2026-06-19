import Link from 'next/link';

export default function Sidebar() {
  return (
    <div className="h-screen w-64 bg-[#10121A] border-r border-white/5 flex flex-col fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <Link href="/" className="text-white font-bold text-xl tracking-tight">
          FOTO<span className="text-indigo-500">DESK</span>
        </Link>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link href="/dashboard" className="block px-4 py-3 rounded-lg bg-indigo-600/10 text-indigo-400 font-medium">
          Vue d'ensemble
        </Link>
        <Link href="/dashboard/galleries" className="block px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
          Mes Galeries
        </Link>
        <Link href="/dashboard/clients" className="block px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
          Clients
        </Link>
        <Link href="/dashboard/settings" className="block px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
          Paramètres
        </Link>
      </nav>
    </div>
  );
}
