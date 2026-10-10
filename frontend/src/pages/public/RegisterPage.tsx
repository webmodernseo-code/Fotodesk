import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, User, Eye, EyeOff, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    studioName: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studioName.trim() || !formData.email.trim() || !formData.password) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success('Compte créé avec succès ! Bienvenue sur FotoDesk.');
      // Redirige vers le tableau de bord ou la connexion
      navigate('/login');
    } catch (err: any) {
      setError('Une erreur est survenue lors de la création de votre compte.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center px-4 py-12 bg-[#000000] text-white selection:bg-[#C89561] selection:text-white overflow-hidden">
      {/* Halo ambré signature FotoDesk en arrière-plan */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full blur-[150px] opacity-25"
        style={{
          background: 'radial-gradient(circle, #C89561 0%, rgba(150, 105, 62, 0.4) 40%, transparent 70%)',
        }}
      />

      {/* CARTE D'INSCRIPTION LUXURY */}
      <div className="relative w-full max-w-[480px] rounded-[26px] bg-[#0A0A0C]/90 backdrop-blur-2xl border border-white/[0.08] p-8 sm:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.8)] transition-all">
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
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </Link>
        </div>

        {/* TITRE & AVANTAGES */}
        <h1 className="text-center text-2xl sm:text-[26px] font-bold text-white tracking-tight">
          Créer votre compte <span className="text-[#C89561]">FotoDesk</span>
        </h1>
        <p className="mt-1.5 text-center text-xs text-neutral-400">
          2 galeries offertes · Sans carte bancaire · Prêt en 2 minutes
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
          {/* NOM DU STUDIO */}
          <div>
            <label htmlFor="reg-studio" className="block text-xs font-medium text-neutral-300 mb-1.5">
              Nom de votre studio ou marque
            </label>
            <div className="relative">
              <input
                id="reg-studio"
                type="text"
                required
                autoFocus
                value={formData.studioName}
                onChange={(e) => setFormData({ ...formData, studioName: e.target.value })}
                placeholder="Ex : Atelier Lumière, Alex Studio..."
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-neutral-500 transition-all focus:outline-none focus:border-[#C89561] focus:ring-1 focus:ring-[#C89561]/40"
              />
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>

          {/* EMAIL */}
          <div>
            <label htmlFor="reg-email" className="block text-xs font-medium text-neutral-300 mb-1.5">
              Adresse e-mail professionnelle
            </label>
            <div className="relative">
              <input
                id="reg-email"
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@votrestudio.com"
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-neutral-500 transition-all focus:outline-none focus:border-[#C89561] focus:ring-1 focus:ring-[#C89561]/40"
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>

          {/* MOT DE PASSE */}
          <div>
            <label htmlFor="reg-password" className="block text-xs font-medium text-neutral-300 mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Au moins 6 caractères"
                className="w-full h-11 pl-10 pr-11 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-neutral-500 transition-all focus:outline-none focus:border-[#C89561] focus:ring-1 focus:ring-[#C89561]/40"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                aria-label={showPassword ? 'Masquer' : 'Afficher'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* BOUTON D'INSCRIPTION CTA AMBRÉ FOTODESK */}
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
                Création en cours...
              </span>
            ) : (
              'Créer mon compte gratuitement'
            )}
          </button>

          {/* LIEN DE CONNEXION */}
          <div className="pt-2 text-center text-xs text-neutral-400">
            Vous avez déjà un compte ?{' '}
            <Link to="/login" className="text-[#C89561] hover:text-[#E8BFA1] font-medium transition-colors">
              Se connecter
            </Link>
          </div>
        </form>

        {/* MICRO-RÉASSURANCE DISCRÈTE */}
        <div className="mt-7 pt-5 border-t border-white/[0.06] flex items-center justify-center gap-2 text-[11px] text-neutral-500">
          <Lock className="w-3.5 h-3.5 text-[#C89561]" />
          <span>Données et médias hébergés en infrastructure sécurisée</span>
        </div>
      </div>

      {/* FOOTER DISCRET */}
      <div className="mt-8 text-center text-xs text-neutral-500 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-[#C89561]" />
        <span>FotoDesk — Partage, épreuvage et livraison haute définition</span>
      </div>
    </div>
  );
};

export default RegisterPage;
