"use client";

export default function HelpPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Aide & Support Technique</h2>
        <p className="text-sm text-gray-400">Trouvez des guides de prise en main, des réponses à la FAQ ou contactez notre équipe.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* FAQ Card */}
        <div className="bg-[#161618] border border-gray-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Guides Rapides</h3>
          
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-start space-x-2">
              <span className="text-gold">•</span>
              <span><strong>Créer une galerie client :</strong> Allez sur Galleries, cliquez sur Nouvelle Galerie, uploadez vos photos, renseignez les accès client et la validité.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-gold">•</span>
              <span><strong>Sécuriser une galerie :</strong> La double authentification (2FA) par SMS est active par défaut pour valider l'identité de chaque client lors de sa connexion.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-gold">•</span>
              <span><strong>Gérer les retouches client :</strong> Consultez la galerie dans votre dashboard pour voir les remarques et filtres appliqués sous chaque photo.</span>
            </li>
          </ul>
        </div>

        {/* Assistance Widget Trigger */}
        <div className="bg-[#161618] border border-gray-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Besoin d'assistance personnalisée ?</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Utilisez notre widget flottant en bas à droite de l'écran pour démarrer une discussion WhatsApp instantanée ou ouvrir un ticket d'aide auprès de nos agents.
            </p>
          </div>
          
          {/* Button that highlights the support widget */}
          <button 
            onClick={() => {
              const widgetTrigger = document.getElementById('fotodesk-support-trigger');
              if (widgetTrigger) widgetTrigger.click();
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition-all text-xs"
          >
            Ouvrir le widget de support
          </button>
        </div>
      </div>
    </div>
  );
}
