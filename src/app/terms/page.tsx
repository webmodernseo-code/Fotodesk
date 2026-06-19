import Link from 'next/link';

export const metadata = {
  title: "Conditions d'Utilisation — FotoDesk",
  description: "Conditions générales d'utilisation de la plateforme FotoDesk pour les photographes et leurs clients.",
};

export default function TermsPage() {
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
        <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Conditions d'Utilisation</h1>
        <p className="text-xs text-gray-500 mb-10">Dernière mise à jour : 18 Juin 2026</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gold mb-3">1. Acceptation des conditions</h2>
            <p>
              L'utilisation du service FotoDesk implique l'acceptation pleine et entière des présentes Conditions Générales d'Utilisation (CGU). Si vous n'acceptez pas ces conditions, vous devez cesser immédiatement d'utiliser le service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gold mb-3">2. Description du service</h2>
            <p>
              FotoDesk est une plateforme logicielle (SaaS) conçue pour aider les photographes à distribuer des galeries d'images privées à leurs clients finaux. Les fonctionnalités principales incluent :
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>La création et l'hébergement de galeries sécurisées.</li>
              <li>La sélection en ligne et l'ajout de remarques de retouche par le client.</li>
              <li>Le téléchargement des médias en haute définition.</li>
              <li>L'authentification double facteur (2FA) via WhatsApp pour sécuriser les accès clients.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gold mb-3">3. Propriété des contenus & Responsabilités</h2>
            <p>
              Les photographes sont seuls responsables des médias (photos et vidéos) qu'ils importent et diffusent via la plateforme. Vous devez disposer de tous les droits et autorisations nécessaires pour diffuser et distribuer ces images.
            </p>
            <p className="mt-2 font-medium text-white">
              FotoDesk n'exerce aucun contrôle a priori sur le contenu des galeries et décline toute responsabilité quant à l'utilisation non autorisée ou illégale d'images par ses utilisateurs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gold mb-3">4. Abonnements & Tarification</h2>
            <p>
              FotoDesk propose plusieurs formules d'abonnement : un forfait gratuit avec des quotas limités, ainsi que plusieurs forfaits payants (Starter, Pro, Studio). Les tarifs sont facturés en début de chaque période d'abonnement. Tout abonnement est annulable à tout moment depuis les paramètres du compte photographe.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gold mb-3">5. Modification des conditions</h2>
            <p>
              FotoDesk se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification significative par e-mail ou via une notification sur le site.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#0E0E11] py-8 text-center text-xs text-gray-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; 2026 FotoDesk. Tous droits réservés.</p>
          <div className="flex space-x-6">
            <Link href="/privacy" className="hover:text-white">Confidentialité</Link>
            <Link href="/legal" className="hover:text-white">Mentions légales</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
