import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Lock, Mail, Loader2, ShieldCheck } from 'lucide-react';
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
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center px-4 py-12 bg-[#090A0C] text-white selection:bg-[#5C8762] selection:text-white overflow-hidden">
      {/* Halo kaki signature FotoDesk en arrière-plan */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] opacity-20"
        style={{
          background: 'radial-gradient(circle, #5C8762 0%, rgba(92, 135, 98, 0.35) 40%, transparent 70%)',
        }}
      />

      {/* CARTE D'AUTHENTIFICATION LUXURY */}
      <div className="relative w-full max-w-[440px] rounded-2xl bg-[#10141A]/95 backdrop-blur-2xl border border-white/[0.08] p-8 sm:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.85)] transition-all">
        {/* LOGO FOTODESK LUMINEUX */}
        <div className="flex justify-center mb-5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 transition-transform hover:scale-105"
            aria-label="Accueil FotoDesk"
          >
            <img
              src="/logo.png"
              alt="FotoDesk"
              className="h-10 w-auto object-contain drop-shadow-[0_2px_12px_rgba(92,135,98,0.3)]"
            />
          </Link>
        </div>

        {/* TITRE & SOUS-TITRE */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#5C8762]/15 text-[#8CB492] border border-[#5C8762]/30 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5C8762] animate-pulse" />
            Sécurité FotoDesk
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Mot de passe oublié
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Récupérez l'accès à votre studio FotoDesk
          </p>
        </div>

        {isSubmitted ? (
          <div className="text-center space-y-5 animate-fade-in">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#5C8762]/15 border border-[#5C8762]/30 flex items-center justify-center text-[#8CB492]">
              <CheckCircle2 className="w-6 h-6 text-[#5C8762]" />
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
                className="inline-flex items-center gap-2 text-sm font-medium text-[#7FA685] hover:text-[#9BBF9F] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à la connexion
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-neutral-400 text-center leading-relaxed">
              Saisissez l'adresse e-mail associée à votre compte FotoDesk. Nous vous enverrons un lien d'accès sécurisé.
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
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#13161C] border border-white/[0.1] text-sm text-white placeholder-neutral-500 transition-all focus:outline-none focus:border-[#5C8762] focus:ring-2 focus:ring-[#5C8762]/30"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            {/* BOUTON D'ENVOI CTA KAKI FOTODESK */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 mt-2 rounded-xl text-sm font-semibold text-white bg-[#5C8762] hover:bg-[#4E7554] active:bg-[#416246] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-[0_4px_16px_rgba(92,135,98,0.3)] hover:shadow-[0_6px_22px_rgba(92,135,98,0.45)] disabled:opacity-60"
            >
              {isLoading ? (
                <span className="flex items-center gap-2 text-white">
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
          <ShieldCheck className="w-3.5 h-3.5 text-[#5C8762]" />
          <span>Plateforme sécurisée certifiée SSL 256-bit</span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
