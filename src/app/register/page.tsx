"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { recordConversion, recordSignup, addPhotographerToMockList } from '@/lib/affiliateDb';
import { isSupabaseConfigured } from '@/lib/db';
import { createClient } from '@/lib/supabase/client';

type PlanType = 'free' | 'starter' | 'pro' | 'studio';

const PLAN_DETAILS = {
  free: { name: 'Gratuit', price: '0 XOF/mois', storage: '5 Go' },
  starter: { name: 'Starter', price: '5 000 XOF/mois', storage: '30 Go' },
  pro: { name: 'Pro', price: '12 000 XOF/mois', storage: '150 Go' },
  studio: { name: 'Studio', price: '25 000 XOF/mois', storage: '750 Go' },
};

function RegisterFormContent() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan') as PlanType;
  
  const [step, setStep] = useState<'form' | 'confirmation'>('form');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('free');
  
  // Registration form inputs
  const [studioName, setStudioName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [refCode, setRefCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (planParam && ['free', 'starter', 'pro', 'studio'].includes(planParam)) {
      setSelectedPlan(planParam);
    }
  }, [planParam]);

  // Load pending ref on mount
  useEffect(() => {
    const pendingRef = localStorage.getItem('fotodesk_pending_ref');
    if (pendingRef) {
      setRefCode(pendingRef);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studioName || !email || !password) return;
    setError('');
    setLoading(true);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: studioName,
              business_name: studioName,
              subscription_plan: selectedPlan
            }
          }
        });

        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }

        // Si l'inscription réussit, on synchronise aussi le plan local pour la compatibilité
        localStorage.setItem('fotodesk_subscription_plan', selectedPlan);
        
        // Simuler le processus d'affiliation et parrainage en local pour conserver la cohérence
        addPhotographerToMockList(studioName, email, selectedPlan, refCode || undefined);
        if (refCode) {
          recordSignup(refCode);
          if (selectedPlan !== 'free') {
            let amount = 5000;
            if (selectedPlan === 'pro') amount = 12000;
            if (selectedPlan === 'studio') amount = 25000;
            recordConversion(refCode, studioName, selectedPlan, amount, 'africa');
          }
          localStorage.setItem('fotodesk_user_referrer', refCode);
          localStorage.removeItem('fotodesk_pending_ref');
        }

        setStep('confirmation');
      } catch (err: any) {
        setError(err.message || "Une erreur s'est produite lors de la création du compte.");
      } finally {
        setLoading(false);
      }
    } else {
      localStorage.setItem('fotodesk_subscription_plan', selectedPlan);
      
      // Add to mock photographers database for founder portal
      addPhotographerToMockList(studioName, email, selectedPlan, refCode || undefined);
      
      // Affiliate logic
      if (refCode) {
        recordSignup(refCode);
        
        if (selectedPlan !== 'free') {
          let amount = 5000;
          if (selectedPlan === 'pro') amount = 12000;
          if (selectedPlan === 'studio') amount = 25000;
          
          recordConversion(refCode, studioName, selectedPlan, amount, 'africa');
        }
        
        localStorage.setItem('fotodesk_user_referrer', refCode);
        localStorage.removeItem('fotodesk_pending_ref');
      }
      
      setStep('confirmation');
      setLoading(false);
    }
  };

  const handleSocialRegister = (provider: string) => {
    localStorage.setItem('fotodesk_subscription_plan', selectedPlan);
    
    // Add to mock photographers database for founder portal
    addPhotographerToMockList(studioName || 'Studio Affilié', email || 'social@demo.com', selectedPlan, refCode || undefined);

    if (refCode) {
      recordSignup(refCode);
      if (selectedPlan !== 'free') {
        let amount = 5000;
        if (selectedPlan === 'pro') amount = 12000;
        if (selectedPlan === 'studio') amount = 25000;
        recordConversion(refCode, studioName || 'Studio Affilié', selectedPlan, amount, 'africa');
      }
      localStorage.setItem('fotodesk_user_referrer', refCode);
      localStorage.removeItem('fotodesk_pending_ref');
    }
    setStep('confirmation');
  };

  return (
    <div className="max-w-md w-full bg-[#161925] p-8 sm:p-10 rounded-3xl border border-white/5 shadow-2xl transition-all duration-300">
      {step === 'form' ? (
        <>
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center justify-center space-x-1.5 text-white font-bold text-2xl tracking-tight">
              <img src="/logo.png" alt="FotoDesk Logo" className="w-12 h-12 object-contain" />
              <span>Foto<span className="text-gold">Desk</span></span>
            </Link>
            <h2 className="text-2xl font-bold text-white mt-6 font-sans">Créez votre compte</h2>
            <p className="text-gray-400 mt-2 text-xs">Rejoignez la plateforme des photographes professionnels</p>
          </div>

          {/* Social Logins */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-3 gap-3">
              {/* Google Button */}
              <button 
                type="button"
                onClick={() => handleSocialRegister('Google')}
                className="bg-[#0A0B10] hover:bg-[#0c0d15] border border-white/10 rounded-xl py-3 flex items-center justify-center transition-colors text-white text-xs font-semibold gap-2"
                title="S'inscrire avec Google"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
              </button>

              {/* Facebook Button */}
              <button 
                type="button"
                onClick={() => handleSocialRegister('Facebook')}
                className="bg-[#0A0B10] hover:bg-[#0c0d15] border border-white/10 rounded-xl py-3 flex items-center justify-center transition-colors text-white text-xs font-semibold gap-2"
                title="S'inscrire avec Facebook"
              >
                <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>

              {/* Apple Button */}
              <button 
                type="button"
                onClick={() => handleSocialRegister('Apple')}
                className="bg-[#0A0B10] hover:bg-[#0c0d15] border border-white/10 rounded-xl py-3 flex items-center justify-center transition-colors text-white text-xs font-semibold gap-2"
                title="S'inscrire avec Apple"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.94-1.39z"/>
                </svg>
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-between mt-4">
              <span className="w-[30%] h-px bg-white/5"></span>
              <span className="text-[10px] text-gray-500 uppercase font-semibold">ou s'inscrire par e-mail</span>
              <span className="w-[30%] h-px bg-white/5"></span>
            </div>
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Forfait Sélectionné</label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value as PlanType)}
                className="w-full bg-[#0A0B10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors font-sans"
              >
                <option value="free">Gratuit (5 Go de stockage • 2 galeries)</option>
                <option value="starter">Starter (5 000 FCFA/mois • 30 Go)</option>
                <option value="pro">Pro (12 000 FCFA/mois • 150 Go) — Populaire</option>
                <option value="studio">Studio (25 000 FCFA/mois • 750 Go)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Nom du studio / Photographe</label>
              <input 
                type="text" 
                required
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                className="w-full bg-[#0A0B10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors font-sans"
                placeholder="Ex: Studio Lumière"
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
                placeholder="contact@studio.com"
              />
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
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Code Parrain / Code Promo (Optionnel)</label>
              <input 
                type="text" 
                value={refCode}
                onChange={(e) => setRefCode(e.target.value)}
                className="w-full bg-[#0A0B10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors font-sans"
                placeholder="Ex: MARC20"
              />
            </div>
            {error && (
              <p className="text-red-400 text-xs text-center font-medium mt-2">{error}</p>
            )}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gold hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed text-background font-bold py-3.5 px-4 rounded-xl transition-all shadow-gold active:scale-95 text-sm mt-2 font-sans"
            >
              {loading ? "Création en cours..." : `S'inscrire avec le forfait ${PLAN_DETAILS[selectedPlan].name}`}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-gold hover:text-gold/80 font-medium">
              Se connecter
            </Link>
          </p>
        </>
      ) : (
        /* Confirmation Screen */
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto mb-6 border border-gold/20 animate-pulse">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 font-sans">Inscription validée !</h3>
          <p className="text-xs text-gold/90 mb-4 font-sans font-semibold">
            Forfait sélectionné : {PLAN_DETAILS[selectedPlan].name} ({PLAN_DETAILS[selectedPlan].price})
          </p>
          <p className="text-gray-300 text-xs leading-relaxed mb-8 px-2 font-sans">
            Un e-mail de confirmation a été envoyé à l'adresse <strong className="text-gold font-semibold">{email}</strong>.<br/><br/>
            Veuillez vérifier votre boîte de réception et cliquer sur le lien de validation pour finaliser la création de votre compte.
          </p>
          <Link 
            href="/login"
            className="w-full inline-block bg-gold hover:bg-gold-light text-background font-bold py-3.5 px-4 rounded-xl transition-all shadow-gold active:scale-95 text-sm font-sans"
          >
            Retour à la connexion
          </Link>
        </div>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0B10] px-4 py-12">
      <Suspense fallback={
        <div className="max-w-md w-full bg-[#161925] p-8 sm:p-10 rounded-3xl border border-white/5 shadow-2xl flex items-center justify-center">
          <p className="text-white text-sm">Chargement du formulaire...</p>
        </div>
      }>
        <RegisterFormContent />
      </Suspense>
    </div>
  );
}
