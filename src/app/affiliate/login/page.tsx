"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginAffiliate } from '@/lib/affiliateDb';

function AffiliateLoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setInfoMessage("Inscription réussie ! Connectez-vous avec vos identifiants.");
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    const result = loginAffiliate(email);
    if (result.success) {
      router.push('/affiliate/dashboard');
    } else {
      setError(result.error || "Adresse email introuvable.");
    }
  };

  return (
    <div className="max-w-md w-full bg-[#161925] p-8 sm:p-10 rounded-3xl border border-white/5 shadow-2xl transition-all duration-300">
      
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center justify-center space-x-1.5 text-white font-bold text-2xl tracking-tight">
          <img src="/logo.png" alt="FotoDesk Logo" className="w-12 h-12 object-contain" />
          <span>Foto<span className="text-gold">Desk</span></span>
        </Link>
        <span className="block text-[10px] text-gold font-bold uppercase tracking-widest mt-2">Espace Affiliation</span>
        <h2 className="text-2xl font-bold text-white mt-4 font-sans font-semibold">Connexion Parrain</h2>
        <p className="text-gray-400 mt-2 text-xs">Accédez à votre tableau de bord et suivez vos gains</p>
      </div>

      {infoMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs py-3 px-4 rounded-xl mb-6 text-center font-medium font-sans">
          ✅ {infoMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-xl mb-6 text-center font-medium font-sans">
          ⚠️ {error}
        </div>
      )}

      {/* Demo Credentials Info Box */}
      <div className="bg-gold/5 border border-gold/10 rounded-2xl p-4 mb-6 text-xs text-gold/80 leading-relaxed font-sans">
        <strong className="text-white block mb-1">💡 Informations de démo :</strong>
        Pour tester instantanément avec un compte parrain actif pré-rempli, utilisez :<br/>
        • E-mail : <strong className="text-white">affiliate@fotodesk.com</strong><br/>
        • Mot de passe : <strong className="text-white">123456</strong>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase">Email de connexion</label>
          <input 
            type="email" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#0A0B10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors font-sans"
            placeholder="affiliate@fotodesk.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-gray-300 uppercase">Mot de passe</label>
          </div>
          <input 
            type="password" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0A0B10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors font-sans"
            placeholder="••••••••"
          />
        </div>

        <button 
          type="submit"
          className="w-full bg-gold hover:bg-gold-light text-background font-bold py-3.5 px-4 rounded-xl transition-all shadow-gold active:scale-95 text-sm font-sans"
        >
          Se connecter
        </button>
      </form>

      <p className="text-center text-gray-400 text-sm mt-6">
        Pas encore inscrit ?{' '}
        <Link href="/affiliate/register" className="text-gold hover:text-gold/80 font-medium">
          Devenir affilié
        </Link>
      </p>
    </div>
  );
}

export default function AffiliateLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0B10] px-4 py-12">
      <Suspense fallback={
        <div className="max-w-md w-full bg-[#161925] p-8 sm:p-10 rounded-3xl border border-white/5 shadow-2xl flex items-center justify-center text-white text-sm">
          Chargement...
        </div>
      }>
        <AffiliateLoginFormContent />
      </Suspense>
    </div>
  );
}
