import Link from 'next/link';

export default function ClientsPage() {
  const clients = [
    {
      id: 'c-1',
      name: 'Sophie Kouamé',
      email: 'sophie.k@gmail.com',
      phone: '+225 07 07 07 07 01',
      status: 'Active',
      galleryId: 'g-wedding-01',
      galleryTitle: 'Mariage de Sophie & Marc',
      totalPhotos: 120,
    },
    {
      id: 'c-2',
      name: 'Léa Konan',
      email: 'lea.konan@hotmail.com',
      phone: '+225 07 07 07 07 02',
      status: 'Expirée',
      galleryId: 'g-portrait-02',
      galleryTitle: 'Shooting Mode Studio',
      totalPhotos: 45,
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Vos Clients</h2>
          <p className="text-sm text-gray-400">Suivez et contactez vos clients et leurs galeries associées.</p>
        </div>
        <button className="bg-gold hover:bg-gold-light text-background font-bold py-2.5 px-6 rounded-full transition-all text-sm">
          + Nouveau Client
        </button>
      </div>

      <div className="bg-[#161618] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#1A1A1D] text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800">
              <tr>
                <th className="px-6 py-4">Nom</th>
                <th className="px-6 py-4">Téléphone / Email</th>
                <th className="px-6 py-4">Galerie Associée</th>
                <th className="px-6 py-4">Statut d'accès</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-6 py-4 font-bold text-white">{client.name}</td>
                  <td className="px-6 py-4">
                    <p>{client.phone}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{client.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/galleries/${client.galleryId}`} className="text-indigo-400 hover:underline font-medium">
                      {client.galleryTitle}
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5">{client.totalPhotos} photos</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                      client.status === 'Active' 
                        ? 'bg-green-500/10 text-green-400' 
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <a 
                      href={`https://wa.me/${client.phone.replace(/[\s+]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] font-semibold py-1.5 px-3 rounded-lg border border-[#25D366]/20 transition-colors inline-block"
                    >
                      WhatsApp
                    </a>
                    <Link 
                      href={`/dashboard/galleries/${client.galleryId}`}
                      className="text-xs bg-white/5 hover:bg-white/10 text-white font-semibold py-1.5 px-3 rounded-lg border border-white/10 transition-colors inline-block"
                    >
                      Gérer
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
