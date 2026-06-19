export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Paramètres de l'Application</h2>
        <p className="text-sm text-gray-400">Gérez vos préférences de studio, de filigrane et de sécurité.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Studio Info Settings */}
        <div className="bg-[#161618] border border-gray-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Préférences du Studio</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Nom du Studio commercial</label>
              <input type="text" defaultValue="Assi Kouamé Studio d'Art" className="w-full bg-[#0E0E11] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Email de contact</label>
              <input type="email" defaultValue="contact@assi-studio.com" className="w-full bg-[#0E0E11] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold" />
            </div>
          </div>
        </div>

        {/* Security / 2FA settings */}
        <div className="bg-[#161618] border border-gray-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Sécurité & Double Facteur (2FA)</h3>
          
          <div className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5">
            <div>
              <p className="text-sm font-bold text-white mb-1">Authentification double facteur par SMS</p>
              <p className="text-xs text-gray-400">Exiger un code de sécurité reçu par SMS au numéro de téléphone enregistré pour chaque connexion photographe.</p>
            </div>
            <span className="text-xs font-semibold bg-green-500/10 text-green-400 px-3 py-1.5 rounded-full border border-green-500/20">
              Activé
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5">
            <div>
              <p className="text-sm font-bold text-white mb-1">Sécurisation des galeries clients par 2FA</p>
              <p className="text-xs text-gray-400">Activer par défaut l'étape de vérification par code à 6 chiffres par SMS lors de l'accès client aux galeries privées.</p>
            </div>
            <span className="text-xs font-semibold bg-green-500/10 text-green-400 px-3 py-1.5 rounded-full border border-green-500/20">
              Activé
            </span>
          </div>
        </div>

        {/* Watermark Preferences */}
        <div className="bg-[#161618] border border-gray-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Filigrane Antivol</h3>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">Texte du filigrane sur les miniatures client</label>
            <input type="text" defaultValue="FOTODESK" className="w-full bg-[#0E0E11] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold" />
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" defaultChecked id="watermark-active" className="rounded border-gray-800 text-gold focus:ring-gold bg-[#0E0E11] h-4 w-4" />
            <label htmlFor="watermark-active" className="text-xs text-gray-300">Appliquer automatiquement le filigrane lors du téléversement de nouvelles photos</label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="bg-gold hover:bg-gold-light text-background font-bold py-2.5 px-8 rounded-full transition-all text-sm shadow-gold">
          Enregistrer les paramètres
        </button>
      </div>
    </div>
  );
}
