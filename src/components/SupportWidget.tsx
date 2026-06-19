"use client";

import React, { useState, useEffect } from 'react';

type FAQItem = {
  question: string;
  answer: string;
};

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'options' | 'faq' | 'ticket'>('options');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  
  // Ticket form state
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Aide sur ma galerie photo');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // WhatsApp support phone number (international format, e.g. Ivory Coast +225)
  const SUPPORT_WHATSAPP_NUMBER = '22507070707'; // A remplacer par le numéro réel
  const whatsappUrl = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Bonjour le Support Fotodesk, j'ai besoin d'aide avec ma galerie photo."
  )}`;

  const faqItems: FAQItem[] = [
    {
      question: "Comment sélectionner mes photos ?",
      answer: "Pour sélectionner une photo, cliquez simplement dessus ou sur le bouton en forme de cœur/coche sur l'image. Le compteur de sélection se mettra à jour en haut de votre écran."
    },
    {
      question: "Mon paiement Mobile Money (Wave, Orange, MTN) a échoué ?",
      answer: "Assurez-vous que votre compte est suffisamment approvisionné et que vous avez validé la transaction sur votre téléphone via le code de confirmation reçu. Si le problème persiste, contactez-nous directement via WhatsApp."
    },
    {
      question: "Comment récupérer mes photos en haute définition ?",
      answer: "Une fois que vous avez validé et payé votre sélection, le photographe recevra une notification. Les liens de téléchargement HD sans filigrane s'activeront immédiatement ou vous seront envoyés directement par email/WhatsApp."
    },
    {
      question: "Je souhaite acheter plus de photos que le quota ?",
      answer: "C'est tout à fait possible ! Sélectionnez simplement toutes les photos que vous souhaitez. Le système calculera automatiquement le montant des photos supplémentaires selon le tarif défini par votre photographe, et vous pourrez payer par Mobile Money."
    }
  ];

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;

    setIsSubmitting(true);
    
    // Simulate Supabase or API submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setEmail('');
      setMessage('');
      
      // Reset status after a few seconds
      setTimeout(() => {
        setSubmitStatus('idle');
        setActiveTab('options');
      }, 3000);
    }, 1500);
  };

  // Prevent scroll when support widget is open on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth < 640) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Floating Action Button */}
      <button
        id="fotodesk-support-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-28 sm:bottom-6 right-6 z-[999] flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-[0_4px_20px_rgba(79,70,229,0.4)] hover:shadow-[0_6px_25px_rgba(79,70,229,0.6)] hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 active:scale-95"
        aria-label="Contacter le service client"
      >
        {isOpen ? (
          <svg className="w-6 h-6 animate-fade-in" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <div className="relative">
            <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-green-500 rounded-full border-2 border-indigo-600 animate-ping" />
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-green-500 rounded-full border-2 border-indigo-600" />
          </div>
        )}
      </button>

      {/* Support Chat Panel */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 z-[998] flex flex-col bg-[#121420]/95 sm:bg-[#121420]/90 backdrop-blur-xl border border-white/10 sm:rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.5)] w-full h-full sm:w-[380px] sm:h-[550px] transition-all duration-300 overflow-hidden animate-slide-up">
          
          {/* Header */}
          <div className="relative bg-gradient-to-r from-indigo-900/60 to-purple-950/60 p-6 border-b border-white/5 flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg">
                FD
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#121420] rounded-full" />
            </div>
            <div>
              <h4 className="text-white font-bold text-base">Support Fotodesk</h4>
              <p className="text-xs text-green-400 font-medium flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                En ligne • Réponse rapide
              </p>
            </div>
            {/* Mobile Close Button */}
            <button 
              onClick={() => setIsOpen(false)}
              className="sm:hidden absolute top-6 right-6 text-gray-400 hover:text-white"
              aria-label="Fermer le panneau d'assistance"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/5 text-sm bg-white/2">
            <button 
              onClick={() => setActiveTab('options')}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                activeTab === 'options' 
                  ? 'text-indigo-400 border-b-2 border-indigo-500 bg-white/3' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Options
            </button>
            <button 
              onClick={() => setActiveTab('faq')}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                activeTab === 'faq' 
                  ? 'text-indigo-400 border-b-2 border-indigo-500 bg-white/3' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              FAQ
            </button>
            <button 
              onClick={() => setActiveTab('ticket')}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                activeTab === 'ticket' 
                  ? 'text-indigo-400 border-b-2 border-indigo-500 bg-white/3' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Ticket
            </button>
          </div>

          {/* Panel Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Tab: Options */}
            {activeTab === 'options' && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center py-2">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Bonjour ! Comment pouvons-nous vous aider aujourd'hui ? Choisissez une option ci-dessous pour démarrer.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* WhatsApp Support Button */}
                  <a 
                    href={whatsappUrl}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/25 rounded-2xl transition-all group active:scale-[0.98]"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center text-white">
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-white font-semibold text-sm">Discuter sur WhatsApp</p>
                        <p className="text-[#25D366] text-xs font-medium">Recommandé • Réponse immédiate</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>

                  {/* Ask FAQ Button */}
                  <button 
                    onClick={() => setActiveTab('faq')}
                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group active:scale-[0.98]"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-white font-semibold text-sm">Consulter les aides (FAQ)</p>
                        <p className="text-gray-400 text-xs">Trouvez des réponses immédiates</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Submit Ticket Button */}
                  <button 
                    onClick={() => setActiveTab('ticket')}
                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group active:scale-[0.98]"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L22 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-white font-semibold text-sm">Ouvrir un ticket d'assistance</p>
                        <p className="text-gray-400 text-xs">Envoyez-nous un email</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Local hours warning */}
                <div className="p-4 bg-white/2 rounded-2xl border border-white/5 text-center text-xs text-gray-500">
                  <p>Support disponible 7j/7 de 8h à 22h GMT.</p>
                </div>
              </div>
            )}

            {/* Tab: FAQ */}
            {activeTab === 'faq' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center space-x-2 text-indigo-400 mb-2">
                  <button onClick={() => setActiveTab('options')} className="hover:underline text-xs flex items-center gap-1">
                    &larr; Retour
                  </button>
                </div>
                
                {faqItems.map((item, idx) => (
                  <div key={idx} className="border-b border-white/5 pb-3">
                    <button 
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      className="w-full flex items-center justify-between text-left py-2 text-white font-semibold text-sm hover:text-indigo-300 transition-colors"
                    >
                      <span>{item.question}</span>
                      <svg 
                        className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${openFaqIndex === idx ? 'rotate-180 text-indigo-400' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openFaqIndex === idx && (
                      <p className="mt-2 text-xs text-gray-400 leading-relaxed pl-1 animate-fade-in">
                        {item.answer}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tab: Ticket */}
            {activeTab === 'ticket' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between text-xs mb-2">
                  <button onClick={() => setActiveTab('options')} className="text-indigo-400 hover:underline flex items-center gap-1">
                    &larr; Retour
                  </button>
                  <span className="text-gray-500">Réponse sous 2h par email</span>
                </div>

                {submitStatus === 'success' ? (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h5 className="text-white font-bold text-lg">Message envoyé !</h5>
                    <p className="text-xs text-gray-400">
                      Votre demande a bien été transmise à notre service client. Nous vous répondrons dans les plus brefs délais.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleTicketSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">Votre adresse email</label>
                      <input 
                        type="email" 
                        required
                        placeholder="jean@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#090A10] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">Sujet</label>
                      <select 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full bg-[#090A10] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      >
                        <option>Aide sur ma galerie photo</option>
                        <option>Problème de paiement</option>
                        <option>Qualité des photos / Téléchargement</option>
                        <option>Créer mon compte photographe</option>
                        <option>Autre question</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">Message / Description</label>
                      <textarea 
                        required
                        rows={4}
                        placeholder="Décrivez votre problème en détail..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full bg-[#090A10] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold py-3 rounded-xl transition-all shadow-[0_4px_15px_rgba(79,70,229,0.3)] active:scale-[0.98] flex items-center justify-center text-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Envoi en cours...
                        </>
                      ) : 'Envoyer ma demande'}
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>

          {/* Footer branding */}
          <div className="p-4 bg-white/2 border-t border-white/5 text-center">
            <span className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
              Propulsé par Fotodesk
            </span>
          </div>

        </div>
      )}
    </>
  );
}
