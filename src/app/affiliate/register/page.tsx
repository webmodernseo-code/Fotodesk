"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerAffiliate } from '@/lib/affiliateDb';

export default function AffiliateRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [refCodeInput, setRefCodeInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password || !refCodeInput) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    const result = registerAffiliate(name, email, refCodeInput);
    if (result.success) {
      router.push('/affiliate/login?registered=true');
    } else {
      setError(result.error || "Une erreur s'est produite lors de l'inscription.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0B10] px-4 py-12">
      <div className="max-w-md w-full bg-[#161925] p-8 sm:p-10 rounded-3xl border border-white/5 shadow-2xl transition-all duration-300">
        
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center space-x-1.5 text-white font-bold text-2xl tracking-tight">
            <img src="/logo.png" alt="FotoDesk Logo" className="w-12 h-12 object-contain" />
            <span>Foto<span className="text-gold">Desk</span></span>
          </Link>
          <span className="block text-[10px] text-gold font-bold uppercase tracking-widest mt-2">Programme d'affiliation</span>
          <h2 className="text-2xl font-bold text-white mt-4 font-sans">Devenir Affilié</h2>
          <p className="text-gray-400 mt-2 text-xs">Recommandez FotoDesk et gagnez 20% de commission cash</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-xl mb-6 text-center font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Nom complet</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0A0B10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors font-sans"
              placeholder="Ex: Jean Kouamé"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Adresse Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0A0B10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors font-sans"
              placeholder="jean@confrere.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Code Parrainage Personnalisé</label>
            <input 
              type="text" 
              required
              value={refCodeInput}
              onChange={(e) => setRefCodeInput(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
              className="w-full bg-[#0A0B10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors font-sans font-medium"
              placeholder="Ex: jean20 (Lettres et chiffres uniquement)"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Votre lien : <span className="text-gold">fotodesk.com/?ref={refCodeInput || '...'}</span><br/>
              Votre code promo : <span className="text-gold">{(refCodeInput || '...').toUpperCase()}20</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Mot de passe</label>
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
            className="w-full bg-gold hover:bg-gold-light text-background font-bold py-3.5 px-4 rounded-xl transition-all shadow-gold active:scale-95 text-sm mt-4 font-sans"
          >
            Créer mon compte affilié
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          Déjà inscrit ?{' '}
          <Link href="/affiliate/login" className="text-gold hover:text-gold/80 font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
