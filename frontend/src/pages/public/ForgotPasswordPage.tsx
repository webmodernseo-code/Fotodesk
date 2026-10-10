import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Lock, Mail, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Veuillez renseigner votre adresse e-mail');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      // Appel API ou simulation pour la réinitialisation
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsSubmitted(true);
      toast.success('Instructions envoyées par e-mail');
    } catch (err: any) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center px-4 py-12 bg-[#000000] text-white selection:bg-[#C89561] selection:text-white overflow-hidden">
      {/* Halo ambré signature FotoDesk en arrière-plan */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] opacity-25"
        style={{
          background: 'radial-gradient(circle, #C89561 0%, rgba(150, 105, 62, 0.4) 40%, transparent 70%)',
        }}
      />

      {/* CARTE D'AUTHENTIFICATION LUXURY */}
      <div className="relative w-full max-w-[460px] rounded-[26px] bg-[#0A0A0C]/90 backdrop-blur-2xl border border-white/[0.08] p-8 sm:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.8)] transition-all">
        {/* LOGO FOTODESK LUMINEUX */}
        <div className="flex justify-center mb-6">
          <Link
            to="/"
            className="w-14 h-14 rounded-full flex items-center justify-center bg-white/[0.06] border border-[#C89561]/30 shadow-[0_0_25px_rgba(200,149,97,0.25)] transition-transform hover:scale-105"
            aria-label="Accueil FotoDesk"
          >
            <img
              src="/logo.png"
              alt="FotoDesk"
              className="w-8 h-8 object-contain drop-shadow-[0_2px_10px_rgba(200,149,97,0.4)]"
              onError={(e) => {
                // Fallback icon si image non trouvée
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </Link>
        </div>

        {/* TITRE & SOUS-TITRE */}
        <h1 className="text-center text-2xl sm:text-[26px] font-bold text-white tracking-tight">
          Foto<span className="text-[#C89561]">Desk</span>
        </h1>
        <p className="mt-1 text-center text-xs text-neutral-400 font-medium uppercase tracking-wider">
          Réinitialisation du mot de passe
        </p>

        {isSubmitted ? (
          <div className="mt-8 text-center space-y-5 animate-fade-in">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">E-mail envoyé</h2>
              <p className="mt-2 text-sm text-neutral-300 leading-relaxed">
                Si un compte existe pour <span className="text-white font-medium">{email}</span>, vous recevrez un lien de réinitialisation sous quelques instants.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#C89561] hover:text-[#E8BFA1] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à la connexion
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <p className="text-sm text-neutral-400 text-center leading-relaxed">
              Saisissez l'adresse e-mail associée à votre studio FotoDesk. Nous vous enverrons un lien d'accès sécurisé.
            </p>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="reset-email" className="block text-xs font-medium text-neutral-300 mb-1.5">
                Adresse e-mail
              </label>
              <div className="relative">
                <input
                  id="reset-email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@votrestudio.com"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-neutral-500 transition-all focus:outline-none focus:border-[#C89561] focus:ring-1 focus:ring-[#C89561]/40"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            {/* BOUTON D'ENVOI CTA AMBRÉ FOTODESK */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 mt-2 rounded-xl text-sm font-semibold text-[#0A0A0C] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-[0_4px_20px_rgba(200,149,97,0.3)] hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #C89561 0%, #D4A853 50%, #C89561 100%)',
              }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2 text-[#0A0A0C]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi en cours...
                </span>
              ) : (
                'Envoyer le lien de réinitialisation'
              )}
            </button>

            {/* RETOUR CONNEXION */}
            <div className="pt-3 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Retour à la page de connexion
              </Link>
            </div>
          </form>
        )}

        {/* MICRO-RÉASSURANCE DISCRÈTE */}
        <div className="mt-7 pt-5 border-t border-white/[0.06] flex items-center justify-center gap-2 text-[11px] text-neutral-500">
          <Lock className="w-3.5 h-3.5 text-[#C89561]" />
          <span>Plateforme sécurisée certifiée SSL 256-bit</span>
        </div>
      </div>

      {/* PREUVE SOCIALE CRÉATEURS */}
      <div className="mt-8 text-center text-xs text-neutral-500 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-[#C89561]" />
        <span>FotoDesk — La solution de référence pour photographes & monteurs</span>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
