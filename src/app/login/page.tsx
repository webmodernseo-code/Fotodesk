"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isSupabaseConfigured } from '@/lib/db';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [loginStep, setLoginStep] = useState<'credentials' | '2fa'>('credentials');
  
  // Credentials states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 2FA states
  const [code2faInput, setCode2faInput] = useState('');
  const [code2faError, setCode2faError] = useState('');

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError('');
    setLoading(true);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (authError) {
          setError(authError.message === 'Invalid login credentials' 
            ? 'Identifiants incorrects.' 
            : authError.message
          );
          setLoading(false);
          return;
        }

        if (data.user) {
          localStorage.setItem('fotodesk_logged_in_email', email);
          
          // Vérifie si l'utilisateur a un profil Whatsapp pour le 2FA
          const { data: profile } = await supabase
            .from('profiles')
            .select('whatsapp')
            .eq('id', data.user.id)
            .single();

          const is2faActive = localStorage.getItem('fotodesk_app_2fa_active') === 'true' || !!profile?.whatsapp;

          if (email.toLowerCase() === 'founder@fotodesk.com' || is2faActive) {
            setLoginStep('2fa');
          } else {
            router.push('/dashboard');
          }
        }
      } catch (err: any) {
        setError(err.message || "Une erreur s'est produite.");
      } finally {
        setLoading(false);
      }
    } else {
      localStorage.setItem('fotodesk_logged_in_email', email);
      setLoginStep('2fa');
      setLoading(false);
    }
  };

  const handle2faSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code2faInput === '654321') { // Mock SMS code
      const loggedInEmail = localStorage.getItem('fotodesk_logged_in_email') || '';
      if (loggedInEmail.toLowerCase() === 'founder@fotodesk.com') {
        localStorage.setItem('fotodesk_admin_session', 'true');
        router.push('/admin-portal');
      } else {
        router.push('/dashboard');
      }
    } else {
      setCode2faError('Code 2FA incorrect. Veuillez réessayer.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0B10] px-4">
      <div className="max-w-md w-full bg-[#161925] p-8 sm:p-10 rounded-3xl border border-white/5 shadow-2xl">
        
        {loginStep === 'credentials' ? (
          <>
            <div className="text-center mb-8">
              <Link href="/" className="inline-flex items-center justify-center space-x-1.5 text-white font-bold text-2xl tracking-tight">
                <img src="/logo.png" alt="FotoDesk Logo" className="w-12 h-12 object-contain" />
                <span>Foto<span className="text-gold">Desk</span></span>
              </Link>
              <h2 className="text-2xl font-bold text-white mt-6">Bon retour parmi nous</h2>
              <p className="text-gray-400 mt-2 text-sm">Connectez-vous à votre espace photographe</p>
            </div>

            <form onSubmit={handleCredentialsSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0A0B10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                  placeholder="jean@studio.com"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-300">Mot de passe</label>
                  <Link href="/forgot-password" className="text-xs text-gold hover:text-gold/80">Mot de passe oublié ?</Link>
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0A0B10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                  placeholder="••••••••"
                />
              </div>
              {error && (
                <p className="text-red-400 text-xs text-center font-medium mt-2">{error}</p>
              )}
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-gold hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed text-background font-bold py-3.5 px-4 rounded-xl transition-all shadow-gold active:scale-95 text-sm"
              >
                {loading ? 'Connexion en cours...' : 'Suivant'}
              </button>
            </form>

            <p className="text-center text-gray-400 text-sm mt-6">
              Pas encore de compte ?{' '}
              <Link href="/register" className="text-gold hover:text-gold/80 font-medium">
                Créer un compte
              </Link>
            </p>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto mb-4 border border-gold/20">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Validation 2FA</h2>
              <p className="text-gray-400 mt-2 text-xs">Saisissez le code temporaire envoyé par SMS à votre numéro de téléphone (+225 •• •• •• 07).</p>
              <p className="text-gold/80 text-[10px] italic mt-2">*(Code de test pour la démo : 654321)*</p>
            </div>

            <form onSubmit={handle2faSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">Code de sécurité à 6 chiffres</label>
                <input 
                  type="text" 
                  required
                  maxLength={6}
                  value={code2faInput}
                  onChange={(e) => setCode2faInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#0A0B10] border border-white/10 rounded-xl px-4 py-3 text-center text-lg font-bold tracking-widest text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                  placeholder="000000"
                />
              </div>

              {code2faError && (
                <p className="text-red-400 text-xs text-center font-medium mt-2">{code2faError}</p>
              )}

              <button 
                type="submit"
                className="w-full bg-gold text-background font-bold py-3.5 px-4 rounded-xl transition-all shadow-gold active:scale-95 text-sm"
              >
                Vérifier et se connecter
              </button>
              
              <button 
                type="button"
                onClick={() => setLoginStep('credentials')}
                className="w-full text-xs text-gray-500 hover:text-white transition-colors text-center"
              >
                Retour
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}
