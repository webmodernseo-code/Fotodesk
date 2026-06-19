"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  getStoredAffiliates, 
  getStoredConversions, 
  getStoredPayouts, 
  getStoredPhotographers, 
  saveStoredPayouts,
  Affiliate, 
  AffiliatePayout, 
  SimulatedPhotographer,
  AffiliateConversion
} from '@/lib/affiliateDb';
import { isSupabaseConfigured } from '@/lib/db';
import { createClient } from '@/lib/supabase/client';

export default function FounderPortalClient() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dashboards stats state
  const [photographers, setPhotographers] = useState<SimulatedPhotographer[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  const [conversions, setConversions] = useState<AffiliateConversion[]>([]);
  
  // Filter for photographer list
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'starter' | 'pro' | 'studio'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAdminSession = async () => {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email?.toLowerCase() === 'founder@fotodesk.com') {
          setIsLoggedIn(true);
          loadAdminData();
        } else {
          setIsLoggedIn(false);
        }
      } else {
        const adminSession = localStorage.getItem('fotodesk_admin_session');
        const photographerSessionEmail = localStorage.getItem('fotodesk_logged_in_email');
        if (adminSession === 'true' || (photographerSessionEmail && photographerSessionEmail.toLowerCase() === 'founder@fotodesk.com')) {
          setIsLoggedIn(true);
          loadAdminData();
        }
      }
    };
    checkAdminSession();
  }, []);

  const loadAdminData = () => {
    setPhotographers(getStoredPhotographers());
    setAffiliates(getStoredAffiliates());
    setPayouts(getStoredPayouts());
    setConversions(getStoredConversions());
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          setLoginError(error.message);
          setLoading(false);
          return;
        }

        if (data.user && data.user.email?.toLowerCase() === 'founder@fotodesk.com') {
          localStorage.setItem('fotodesk_admin_session', 'true');
          setIsLoggedIn(true);
          loadAdminData();
        } else {
          setLoginError("Accès refusé. Réservé au fondateur.");
        }
      } catch (err: any) {
        setLoginError(err.message || "Une erreur s'est produite.");
      } finally {
        setLoading(false);
      }
    } else {
      if (email.toLowerCase() === 'founder@fotodesk.com' && password === 'admin2026') {
        localStorage.setItem('fotodesk_admin_session', 'true');
        setIsLoggedIn(true);
        loadAdminData();
      } else {
        setLoginError("Identifiants de fondateur incorrects.");
      }
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    localStorage.removeItem('fotodesk_admin_session');
    localStorage.removeItem('fotodesk_logged_in_email');
    setIsLoggedIn(false);
    window.location.href = '/login';
  };

  // Payout validation handler
  const handleApprovePayout = (payoutId: string) => {
    const allPayouts = getStoredPayouts();
    const idx = allPayouts.findIndex(p => p.id === payoutId);
    if (idx === -1) return;

    // Set to completed
    allPayouts[idx].status = 'completed';
    saveStoredPayouts(allPayouts);
    
    // Dispatch update event
    window.dispatchEvent(new CustomEvent('fotodesk-db-updated'));
    loadAdminData();

    setToastMessage("✓ Paiement validé avec succès ! L'affilié a été notifié.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Metrics calculations
  const totalSubscribers = photographers.length;
  
  const mrr = photographers.reduce((sum, p) => {
    if (p.plan === 'starter') return sum + 5000;
    if (p.plan === 'pro') return sum + 12000;
    if (p.plan === 'studio') return sum + 25000;
    return sum;
  }, 0);

  const totalPayoutsPaid = payouts
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayouts = payouts.filter(p => p.status === 'pending');

  const filteredPhotographers = photographers.filter(p => {
    if (planFilter === 'all') return true;
    return p.plan === planFilter;
  });

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0B10] px-4 py-12">
        <div className="max-w-md w-full bg-[#161925] p-8 sm:p-10 rounded-3xl border border-white/5 shadow-2xl">
          
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center justify-center space-x-1.5 text-white font-bold text-2xl tracking-tight">
              <img src="/logo.png" alt="FotoDesk Logo" className="w-12 h-12 object-contain" />
              <span>Foto<span className="text-gold">Desk</span></span>
            </Link>
            <span className="block text-[10px] text-red-400 font-bold uppercase tracking-widest mt-2 border border-red-500/10 bg-red-500/5 py-1 px-3 rounded-full max-w-max mx-auto">
              Vault Fondateur 🔐
            </span>
            <h2 className="text-xl font-bold text-white mt-4 font-sans">Accès Fondateur Privé</h2>
            <p className="text-gray-400 mt-2 text-xs">Portail confidentiel et non indexé par les moteurs de recherche</p>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-xl mb-6 text-center font-medium font-sans">
              ⚠️ {loginError}
            </div>
          )}

          {/* Seeded credentials note */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-xs text-gray-400 leading-relaxed font-sans">
            <strong className="text-white block mb-1">🔑 Identifiants d'accès :</strong>
            • E-mail : <strong className="text-white">founder@fotodesk.com</strong><br/>
            • Mot de passe : <strong className="text-white">admin2026</strong>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase">Email Fondateur</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0A0B10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold transition-colors font-sans"
                placeholder="founder@fotodesk.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase">Clé d'accès secrète</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0A0B10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold transition-colors font-sans"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-gold hover:bg-gold-light text-background font-bold py-3.5 px-4 rounded-xl transition-all shadow-gold active:scale-95 text-sm font-sans"
            >
              Déverrouiller le Vault
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0B10] text-gray-100 flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="border-b border-white/5 bg-[#111113] py-4 sticky top-0 z-30">
        <div className="container max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="inline-flex items-center space-x-1.5 text-white font-bold text-xl tracking-tight">
              <img src="/logo.png" alt="FotoDesk Logo" className="w-11 h-11 object-contain" />
              <span>Foto<span className="text-gold">Desk</span></span>
            </Link>
            <span className="text-[9px] bg-red-500/10 text-red-400 font-bold px-2.5 py-0.5 rounded uppercase tracking-wider border border-red-500/20">
              Founder Portal
            </span>
          </div>

          <button 
            onClick={handleLogout}
            className="text-xs bg-white/5 hover:bg-white/10 text-gray-300 font-semibold px-4.5 py-2.5 rounded-xl border border-white/10 transition-colors"
          >
            Fermer le Vault
          </button>
        </div>
      </header>

      {/* TOAST */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 py-3 px-5 rounded-2xl shadow-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-semibold flex items-center gap-2 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* BODY */}
      <main className="flex-1 container max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* METRICS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#161618] border border-white/5 p-5 rounded-3xl">
            <span className="text-2xl font-black text-white">{totalSubscribers}</span>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">Photographes Inscrits</p>
          </div>
          <div className="bg-[#161618] border border-white/5 p-5 rounded-3xl">
            <span className="text-2xl font-black text-gold">{mrr.toLocaleString()} FCFA</span>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">Revenu Mensuel (MRR)</p>
          </div>
          <div className="bg-[#161618] border border-white/5 p-5 rounded-3xl">
            <span className="text-2xl font-black text-white">{affiliates.length}</span>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">Affiliés Partenaires</p>
          </div>
          <div className="bg-[#161618] border border-white/5 p-5 rounded-3xl">
            <span className="text-2xl font-black text-white">{totalPayoutsPaid.toLocaleString()} FCFA</span>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">Commissions Payées</p>
          </div>
        </div>

        {/* WORK BENCH */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMN 1: PENDING PAYOUT APPROVALS */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#161618] border border-white/5 rounded-3xl p-6">
              <h3 className="text-md font-bold text-white mb-1 flex items-center gap-2">
                <span>⚡ Versements Affiliés en Attente</span>
                {pendingPayouts.length > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                )}
              </h3>
              <p className="text-[11px] text-gray-400 mb-4">Validez les retraits de gains demandés par vos parrains d'un simple clic.</p>
              
              {pendingPayouts.length === 0 ? (
                <div className="text-center py-8 bg-black/10 rounded-2xl border border-white/5">
                  <p className="text-xs text-gray-500">🎉 Aucun versement en attente.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingPayouts.map((p) => {
                    const aff = affiliates.find(a => a.id === p.affiliateId);
                    return (
                      <div key={p.id} className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-white font-bold text-sm">{p.amount.toLocaleString()} FCFA</p>
                            <p className="text-[10px] text-gold font-semibold uppercase mt-0.5">Parrain: {aff?.name || 'Inconnu'}</p>
                          </div>
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">
                            En attente
                          </span>
                        </div>
                        
                        <div className="bg-black/20 p-2.5 rounded-xl text-[11px] text-gray-400 space-y-1">
                          <p><span className="text-gray-500">Méthode:</span> <span className="capitalize text-white font-medium">{p.method}</span></p>
                          <p><span className="text-gray-500">Coordonnées:</span> <span className="text-white font-mono">{p.accountDetails}</span></p>
                          <p><span className="text-gray-500">Date demande:</span> {p.date}</p>
                        </div>

                        <button
                          onClick={() => handleApprovePayout(p.id)}
                          className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-background font-bold text-xs uppercase rounded-xl transition-all shadow-[0_2px_8px_rgba(16,185,129,0.2)]"
                        >
                          Valider le paiement
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: SUBSCRIBERS LIST WITH FILTER */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* PHOTOGRAPHERS TAB & TABLE */}
            <div className="bg-[#161618] border border-white/5 rounded-3xl p-6 overflow-hidden">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-md font-bold text-white">Photographes & Inscriptions</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Liste complète des utilisateurs simulés inscrits sur FotoDesk.</p>
                </div>

                {/* FILTER TABS */}
                <div className="flex bg-black/40 border border-white/5 p-0.5 rounded-xl text-[10px] font-bold">
                  {(['all', 'free', 'starter', 'pro', 'studio'] as const).map((tab) => {
                    const labels = { all: 'Tous', free: 'Gratuit', starter: 'Starter', pro: 'Pro', studio: 'Studio' };
                    return (
                      <button
                        key={tab}
                        onClick={() => setPlanFilter(tab)}
                        className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors ${
                          planFilter === tab ? 'bg-gold/15 text-gold border border-gold/10' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {labels[tab]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {filteredPhotographers.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">Aucun photographe ne correspond à ce filtre.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-500 font-semibold uppercase text-[10px] pb-3">
                        <th className="pb-3">Studio / Photographe</th>
                        <th className="pb-3">Email</th>
                        <th className="pb-3">Forfait Actif</th>
                        <th className="pb-3">Date rejoint</th>
                        <th className="pb-3 text-right">Parrain d'affiliation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                      {filteredPhotographers.map((p) => {
                        const aff = affiliates.find(a => a.refCode === p.referredBy);
                        return (
                          <tr key={p.id} className="hover:bg-white/[0.01]">
                            <td className="py-3 font-semibold text-white">{p.studioName}</td>
                            <td className="py-3 text-gray-400 font-mono text-[11px]">{p.email}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                                p.plan === 'free' ? 'bg-gray-800 text-gray-400 border border-white/5' :
                                p.plan === 'starter' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                p.plan === 'pro' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                'bg-gold/10 text-gold border border-gold/20'
                              }`}>
                                {p.plan}
                              </span>
                            </td>
                            <td className="py-3 text-gray-500">{p.dateJoined}</td>
                            <td className="py-3 text-right font-medium text-gold">
                              {aff ? `${aff.name} (${aff.refCode})` : <span className="text-gray-600">-</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* REGISTERED PARTNERS / AFFILIATES */}
            <div className="bg-[#161618] border border-white/5 rounded-3xl p-6 overflow-hidden">
              <h3 className="text-md font-bold text-white mb-1">Performances des Affiliés</h3>
              <p className="text-[11px] text-gray-400 mb-4">Classement et statistiques de ventes générées par vos partenaires.</p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-500 font-semibold uppercase text-[10px] pb-3">
                      <th className="pb-3">Parrain</th>
                      <th className="pb-3">Code Promo</th>
                      <th className="pb-3 text-right">Clics</th>
                      <th className="pb-3 text-right">Inscriptions</th>
                      <th className="pb-3 text-right">Ventes Payantes</th>
                      <th className="pb-3 text-right text-gold">Solde disponible</th>
                      <th className="pb-3 text-right">Gains totaux</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {affiliates.map((a) => (
                      <tr key={a.id} className="hover:bg-white/[0.01]">
                        <td className="py-3 font-semibold text-white">{a.name}</td>
                        <td className="py-3 font-mono text-gray-400 uppercase tracking-widest">{a.promoCode}</td>
                        <td className="py-3 text-right font-semibold">{a.clicks}</td>
                        <td className="py-3 text-right font-semibold">{a.signups}</td>
                        <td className="py-3 text-right font-semibold text-emerald-400">{a.conversionsCount}</td>
                        <td className="py-3 text-right font-bold text-gold">{a.balance.toLocaleString()} F</td>
                        <td className="py-3 text-right font-bold text-white">{a.totalEarned.toLocaleString()} F</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-6 bg-[#0E0E10] text-center text-xs text-gray-500">
        Portail de Contrôle FotoDesk — Réservé au Fondateur
      </footer>
    </div>
  );
}
