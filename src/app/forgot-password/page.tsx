"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'request' | 'resetForm' | 'success'>('request');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStep('resetForm');
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMsg('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }
    setErrorMsg('');
    setStep('success');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0B10] px-4 py-12">
      <div className="max-w-md w-full bg-[#161925] p-8 sm:p-10 rounded-3xl border border-white/5 shadow-2xl transition-all duration-300">
        
        {step === 'request' && (
          <>
            <div className="text-center mb-8">
              <Link href="/" className="inline-flex items-center justify-center space-x-2 text-white font-bold text-2xl tracking-tight">
                <img src="/logo.png" alt="FotoDesk Logo" className="w-8 h-8 object-contain" />
                <span>Foto<span className="text-gold">Desk</span></span>
              </Link>
              <h2 className="text-xl font-bold text-white mt-6">Mot de passe oublié ?</h2>
              <p className="text-gray-400 mt-2 text-xs">Saisissez votre e-mail pour recevoir le lien de réinitialisation.</p>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Adresse E-mail</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0A0B10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                  placeholder="contact@studio.com"
                />
              </div>
              
              <button 
                type="submit"
                className="w-full bg-gold hover:bg-gold-light text-background font-bold py-3.5 px-4 rounded-xl transition-all shadow-gold active:scale-95 text-sm"
              >
                Envoyer le lien de réinitialisation
              </button>
            </form>

            <p className="text-center text-gray-500 text-xs mt-6">
              <Link href="/login" className="hover:text-white transition-colors font-medium">
                &larr; Retour à la connexion
              </Link>
            </p>
          </>
        )}

        {step === 'resetForm' && (
          <>
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-gold/15 text-gold rounded-full flex items-center justify-center mx-auto mb-4 border border-gold/10">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Créer un nouveau mot de passe</h2>
              <p className="text-gray-400 mt-2 text-xs">Un lien a été envoyé à {email}. Simulez la saisie de votre nouveau mot de passe ci-dessous.</p>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Nouveau mot de passe</label>
                <input 
                  type="password" 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#0A0B10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Confirmer le mot de passe</label>
                <input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#0A0B10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {errorMsg && (
                <p className="text-red-400 text-xs text-center font-medium mt-2">{errorMsg}</p>
              )}

              <button 
                type="submit"
                className="w-full bg-gold hover:bg-gold-light text-background font-bold py-3.5 px-4 rounded-xl transition-all shadow-gold active:scale-95 text-sm"
              >
                Réinitialiser le mot de passe
              </button>
            </form>
          </>
        )}

        {step === 'success' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Mot de passe réinitialisé !</h3>
            <p className="text-gray-400 text-xs leading-relaxed mb-8">
              Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter à votre compte photographe.
            </p>
            <Link 
              href="/login"
              className="w-full inline-block bg-gold hover:bg-gold-light text-background font-bold py-3.5 px-4 rounded-xl transition-all shadow-gold active:scale-95 text-sm"
            >
              Se connecter
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
