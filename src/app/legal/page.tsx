import Link from 'next/link';

export const metadata = {
  title: "Mentions Légales — FotoDesk",
  description: "Mentions légales de la plateforme FotoDesk, service de galeries privées pour photographes.",
};

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0C] text-gray-300 font-sans">
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-[#0E0E11] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5">
            <img src="/logo.png" alt="FotoDesk Logo" className="w-9 h-9 object-contain" />
            <span className="text-lg font-bold text-white tracking-tight">
              Foto<span className="text-gold">Desk</span>
            </span>
          </Link>
          <Link href="/login" className="text-sm font-semibold text-white bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2 rounded-xl transition-all">
            Connexion
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-16 sm:py-20">
        <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Mentions Légales</h1>
        <p className="text-xs text-gray-500 mb-10">En vigueur le 18 Juin 2026</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gold mb-3">1. Édition du site</h2>
            <p>
              Le site <strong>FotoDesk</strong> est édité par la société <strong>FotoDesk SAS</strong>, au capital de 1 000 000 FCFA, immatriculée au Registre du Commerce et des Sociétés sous le numéro CI-ABJ-03-2026-B12-00456, dont le siège social est situé à Abidjan, Cocody Angré, Côte d'Ivoire.
            </p>
            <p className="mt-2">
              Directeur de la publication : <strong>Kouamé Assi</strong>.<br />
              Email de contact : <span className="text-indigo-400">contact@fotodesk.app</span>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gold mb-3">2. Hébergement du site</h2>
            <p>
              Le site <strong>FotoDesk</strong> est hébergé par la société <strong>Vercel Inc.</strong>, situé au 340 S Lemon Ave #4133 Walnut, CA 91789, États-Unis.<br />
              Les fichiers de stockage de médias sont hébergés sur les serveurs de la société <strong>Cloudflare Inc.</strong>, situé au 101 Townsend St, San Francisco, CA 94107, États-Unis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gold mb-3">3. Propriété intellectuelle</h2>
            <p>
              La structure générale du site, ainsi que les textes, graphismes, images, sons et vidéos la composant, sont la propriété de l'éditeur ou de ses partenaires. Toute représentation et/ou reproduction et/ou exploitation partielle ou totale des contenus et services proposés par le site, par quelque procédé que ce soit, sans l'autorisation préalable et par écrit de l'éditeur est strictement interdite.
            </p>
            <p className="mt-2">
              Les photographies et vidéos déposées par les utilisateurs au sein des galeries privées restent la propriété exclusive de leurs auteurs respectifs (les photographes). FotoDesk n'acquiert aucun droit de propriété sur ces contenus.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gold mb-3">4. Limitation de responsabilité</h2>
            <p>
              FotoDesk s'efforce d'assurer au mieux de ses possibilités, l'exactitude et la mise à jour des informations diffusées sur ce site. FotoDesk se réserve le droit de corriger, à tout moment et sans préavis, le contenu. FotoDesk décline toute responsabilité pour toute interruption du site, survenance de bugs, ou pour tout dommage résultant d'une intrusion frauduleuse d'un tiers ayant entraîné une modification des informations mises à la disposition sur le site.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#0E0E11] py-8 text-center text-xs text-gray-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; 2026 FotoDesk. Tous droits réservés.</p>
          <div className="flex space-x-6">
            <Link href="/terms" className="hover:text-white">Conditions</Link>
            <Link href="/privacy" className="hover:text-white">Confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
