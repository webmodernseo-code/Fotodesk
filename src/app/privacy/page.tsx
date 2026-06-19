import Link from 'next/link';

export const metadata = {
  title: "Politique de Confidentialité — FotoDesk",
  description: "Politique de confidentialité et de protection des données personnelles de la plateforme FotoDesk.",
};

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Politique de Confidentialité</h1>
        <p className="text-xs text-gray-500 mb-10">Dernière mise à jour : 18 Juin 2026</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gold mb-3">1. Collecte des données</h2>
            <p>
              Dans le cadre de l'utilisation de la plateforme FotoDesk, nous collectons les données suivantes :
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Pour les photographes</strong> : Nom du studio/nom d'artiste, adresse e-mail, mot de passe (crypté), numéro de téléphone, préférences de profil et choix de forfait.</li>
              <li><strong>Pour les clients des photographes</strong> : Nom/Prénom, numéro WhatsApp (pour la transmission sécurisée et le code 2FA), et adresse e-mail optionnelle.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gold mb-3">2. Stockage des médias (Photos & Vidéos)</h2>
            <p>
              Toutes les images et vidéos uploadées par les photographes sont stockées de façon sécurisée sur des infrastructures cloud de confiance (notamment via <strong>Cloudflare R2</strong>).
            </p>
            <p className="mt-2">
              Les fichiers originaux en haute définition (HD) ne sont accessibles qu'aux clients disposant du lien de partage unique non devinable et du mot de passe associé, ou après validation du processus de double facteur (2FA).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gold mb-3">3. Utilisation des données</h2>
            <p>
              Vos informations personnelles sont uniquement utilisées pour :
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Permettre le bon fonctionnement du service (création de galeries, accès sécurisé, etc.).</li>
              <li>Gérer la facturation et les quotas de stockage.</li>
              <li>Envoyer les codes de sécurité à 6 chiffres par WhatsApp lors de la connexion client.</li>
              <li>Améliorer nos fonctionnalités de navigation et d'affichage.</li>
            </ul>
            <p className="mt-2 text-indigo-400 font-medium">
              FotoDesk ne vend, ne loue et ne partage jamais vos données ou les médias de vos clients à des tiers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gold mb-3">4. Vos Droits</h2>
            <p>
              Conformément aux réglementations de protection des données, vous disposez d'un droit d'accès, de rectification, de portabilité et de suppression de toutes vos données personnelles. Vous pouvez exercer ce droit à tout moment en nous écrivant à <span className="text-indigo-400">privacy@fotodesk.app</span> ou en supprimant vos galeries directement depuis le dashboard.
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
            <Link href="/legal" className="hover:text-white">Mentions légales</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
