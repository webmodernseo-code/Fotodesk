"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  getCurrentAffiliate, 
  getStoredConversions, 
  getStoredPayouts, 
  logoutAffiliate, 
  requestPayout,
  canRequestPayout,
  Affiliate, 
  AffiliateConversion, 
  AffiliatePayout 
} from '@/lib/affiliateDb';

// Real-logo SVG Icons
const WaveIcon = () => (
  <svg className="w-6 h-6 rounded-md shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#1BB7F0"/>
    <path d="M6 14C8.5 11 12 11 14.5 13.5C17 16 20 12.5 20 12.5M10 8C10 8 11.5 6.5 13 8C14.5 9.5 16 8 16 8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const OrangeIcon = () => (
  <svg className="w-6 h-6 rounded-md shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#FF7900"/>
    <rect x="7" y="7" width="10" height="10" rx="1.5" stroke="white" strokeWidth="2.5"/>
  </svg>
);

const MtnIcon = () => (
  <svg className="w-6 h-6 rounded-md shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#FFCC00"/>
    <ellipse cx="12" cy="12" rx="7" ry="4.5" stroke="#003366" strokeWidth="2.5"/>
    <text x="9" y="15" fill="#003366" fontSize="9" fontWeight="900" fontFamily="Inter, sans-serif">M</text>
  </svg>
);

const MoovIcon = () => (
  <svg className="w-6 h-6 rounded-md shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#00A650"/>
    <path d="M7 16V8L12 12L17 8V16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PaypalIcon = () => (
  <svg className="w-6 h-6 rounded-md shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#003087"/>
    <path d="M9 7h3.5c1.2 0 2 .4 2 1.4s-.8 1.4-2 1.4H10.5V15H9V7z" fill="#0079C1"/>
    <path d="M10.5 8.5h3.5c1.2 0 2 .4 2 1.4s-.8 1.4-2 1.4H12V16.5h-1.5V8.5z" fill="#00457C" opacity="0.85"/>
  </svg>
);

const PAYMENT_METHODS = [
  { id: 'wave', name: 'Wave Mobile Money', icon: WaveIcon },
  { id: 'orange', name: 'Orange Money', icon: OrangeIcon },
  { id: 'mtn', name: 'MTN MoMo', icon: MtnIcon },
  { id: 'moov', name: 'Moov Money', icon: MoovIcon },
  { id: 'paypal', name: 'PayPal', icon: PaypalIcon },
] as const;

export default function AffiliateDashboardPage() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [conversions, setConversions] = useState<AffiliateConversion[]>([]);
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  
  // Custom Select Dropdown states
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<'wave' | 'mtn' | 'orange' | 'moov' | 'paypal'>('wave');
  
  // Withdrawal Form states
  const [amountInput, setAmountInput] = useState('');
  const [details, setDetails] = useState('');
  
  // Withdrawal constraints status
  const [payoutRule, setPayoutRule] = useState<{ can: boolean; reason?: string }>({ can: true });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSelectOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load and refresh state
  const loadData = () => {
    const activeAff = getCurrentAffiliate();
    if (!activeAff) {
      router.push('/affiliate/login');
      return;
    }
    setAffiliate(activeAff);
    
    // Filter conversions and payouts by active affiliate
    const allConversions = getStoredConversions();
    const allPayouts = getStoredPayouts();
    
    setConversions(allConversions.filter(c => c.affiliateId === activeAff.id));
    setPayouts(allPayouts.filter(p => p.affiliateId === activeAff.id));

    // Check withdrawal rules constraint
    const rule = canRequestPayout(activeAff.id);
    setPayoutRule(rule);
  };

  useEffect(() => {
    loadData();
    
    const handleUpdate = () => loadData();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('fotodesk-db-updated', handleUpdate);
    
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('fotodesk-db-updated', handleUpdate);
    };
  }, []);

  const handleLogout = () => {
    logoutAffiliate();
    router.push('/affiliate/login');
  };

  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliate) return;
    setToast(null);

    // Double check rule constraint before submitting
    const rule = canRequestPayout(affiliate.id);
    if (!rule.can) {
      setToast({ message: rule.reason || 'Demande refusée par le système.', type: 'error' });
      return;
    }

    const amount = parseInt(amountInput, 10);
    if (isNaN(amount) || amount <= 0) {
      setToast({ message: 'Veuillez saisir un montant valide.', type: 'error' });
      return;
    }

    if (amount > affiliate.balance) {
      setToast({ message: 'Solde disponible insuffisant.', type: 'error' });
      return;
    }

    if (!details) {
      setToast({ message: 'Veuillez remplir vos informations de compte.', type: 'error' });
      return;
    }

    const res = requestPayout(affiliate.id, selectedMethodId, details, amount);
    if (res.success) {
      setToast({ message: 'Demande de retrait soumise avec succès ! Elle sera traitée sous 24h.', type: 'success' });
      setAmountInput('');
      setDetails('');
      loadData();
    } else {
      setToast({ message: res.error || "Une erreur s'est produite.", type: 'error' });
    }
  };

  if (!affiliate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0B10] text-white text-sm">
        Chargement de votre espace affilié...
      </div>
    );
  }

  const referralLink = `${window.location.protocol}//${window.location.host}/register?ref=${affiliate.refCode}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setToast({ message: `✓ ${label} copié dans le presse-papiers !`, type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const formatPrice = (val: number, currency: string) => {
    if (currency === 'europe') return `${val.toLocaleString()} €`;
    if (currency === 'usa') return `$${val.toLocaleString()}`;
    return `${val.toLocaleString()} FCFA`;
  };

  const selectedMethod = PAYMENT_METHODS.find(m => m.id === selectedMethodId) || PAYMENT_METHODS[0];
  const SelectedIcon = selectedMethod.icon;

  return (
    <div className="min-h-screen bg-[#0A0B10] text-gray-100 flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="border-b border-white/5 bg-[#111113] py-4 sticky top-0 z-30">
        <div className="container max-w-7xl mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center space-x-1.5 text-white font-bold text-xl tracking-tight">
            <img src="/logo.png" alt="FotoDesk Logo" className="w-11 h-11 object-contain" />
            <span>Foto<span className="text-gold">Desk</span></span>
            <span className="text-[10px] bg-gold/15 text-gold font-bold px-2 py-0.5 rounded uppercase ml-2 tracking-widest border border-gold/10">Partenaire</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right text-xs">
              <p className="font-semibold text-white">{affiliate.name}</p>
              <p className="text-[10px] text-gray-400">{affiliate.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="text-xs bg-white/5 hover:bg-white/10 text-gray-300 font-semibold px-4.5 py-2.5 rounded-xl border border-white/10 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 py-3 px-5 rounded-2xl shadow-xl border text-sm font-semibold flex items-center gap-2 animate-bounce ${
          toast.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
            : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {toast.type === 'success' ? '✅' : '⚠️'} {toast.message}
        </div>
      )}

      {/* DASHBOARD CONTAINER */}
      <main className="flex-1 container max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-[#161618] border border-white/5 p-5 rounded-3xl relative overflow-hidden">
            <span className="text-2xl font-black text-white">{affiliate.clicks}</span>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-1">Clics Lien</p>
            <div className="absolute right-4 bottom-4 text-gray-700 font-bold text-4xl opacity-10">🔗</div>
          </div>

          <div className="bg-[#161618] border border-white/5 p-5 rounded-3xl relative overflow-hidden">
            <span className="text-2xl font-black text-white">{affiliate.signups}</span>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-1">Inscriptions</p>
            <div className="absolute right-4 bottom-4 text-gray-700 font-bold text-4xl opacity-10">👤</div>
          </div>

          <div className="bg-[#161618] border border-white/5 p-5 rounded-3xl relative overflow-hidden">
            <span className="text-2xl font-black text-white">{affiliate.conversionsCount}</span>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-1">Ventes Parrainées</p>
            <div className="absolute right-4 bottom-4 text-gray-700 font-bold text-4xl opacity-10">💎</div>
          </div>

          <div className="bg-[#161618] border border-white/5 p-5 rounded-3xl relative overflow-hidden">
            <span className="text-lg font-black text-gold">{affiliate.totalEarned.toLocaleString()} F</span>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-2">Commissions Totales</p>
            <div className="absolute right-4 bottom-4 text-gray-700 font-bold text-4xl opacity-10">💰</div>
          </div>

          <div className="bg-gradient-to-br from-[#1E1C18] to-[#121215] border border-gold/20 p-5 rounded-3xl relative overflow-hidden col-span-2 md:col-span-1">
            <span className="text-lg font-black text-white flex items-center gap-1">
              {affiliate.balance.toLocaleString()} F
            </span>
            <p className="text-[11px] font-bold text-gold uppercase tracking-wider mt-2">Solde Retirable</p>
            <div className="absolute right-4 bottom-3 text-gold/10 font-bold text-5xl">⚡</div>
          </div>
        </div>

        {/* PROMO CODE & REFERRAL LINK WIDGETS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#161618] border border-white/5 p-6 rounded-3xl space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">🔗 Votre Lien d'Affilié (20% commission)</h3>
            <p className="text-xs text-gray-400">Partagez ce lien avec vos filleuls. Toute personne qui crée un compte payant via ce lien vous rapporte 20% de sa première facture.</p>
            <div className="flex bg-black/35 border border-white/10 rounded-xl overflow-hidden p-1">
              <input 
                type="text" 
                readOnly 
                value={referralLink}
                className="bg-transparent border-none focus:outline-none text-xs text-gold font-medium px-3 flex-1 overflow-x-auto truncate"
              />
              <button 
                onClick={() => copyToClipboard(referralLink, 'Lien affilié')}
                className="bg-gold text-background font-bold text-[10px] uppercase py-2 px-4 rounded-lg transition-transform active:scale-95 shrink-0"
              >
                Copier
              </button>
            </div>
          </div>

          <div className="bg-[#161618] border border-white/5 p-6 rounded-3xl space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">🎟️ Votre Code Promo Partenaire</h3>
            <p className="text-xs text-gray-400">Offre à vos filleuls un moyen de s'enregistrer avec parrainage direct. Vous serez automatiquement crédité de 20% du forfait.</p>
            <div className="flex bg-black/35 border border-white/10 rounded-xl overflow-hidden p-1">
              <input 
                type="text" 
                readOnly 
                value={affiliate.promoCode}
                className="bg-transparent border-none focus:outline-none text-xs text-gold font-medium px-3 flex-1 uppercase tracking-widest font-mono"
              />
              <button 
                onClick={() => copyToClipboard(affiliate.promoCode, 'Code promo')}
                className="bg-gold text-background font-bold text-[10px] uppercase py-2 px-4 rounded-lg transition-transform active:scale-95 shrink-0"
              >
                Copier
              </button>
            </div>
          </div>
        </div>

        {/* WORK AREA: WITHDRAWALS & COMMISSIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMN 1: REQUEST WITHDRAWAL */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#161618] border border-white/5 rounded-3xl p-6 relative">
              <h3 className="text-md font-bold text-white mb-4">Demander un versement</h3>
              
              {/* Constraint warning message */}
              {!payoutRule.can && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-5 text-xs text-amber-400 leading-relaxed">
                  <span className="font-bold block mb-1">⏳ Retrait Temporairement Bloqué :</span>
                  {payoutRule.reason}
                </div>
              )}

              <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                
                {/* Premium Custom Select Dropdown with payment logos */}
                <div className="relative" ref={dropdownRef}>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-2 uppercase">Moyen de paiement</label>
                  
                  <button
                    type="button"
                    onClick={() => { if (payoutRule.can) setIsSelectOpen(!isSelectOpen); }}
                    disabled={!payoutRule.can}
                    className="w-full bg-[#0A0B10] border border-white/10 hover:border-gold/30 disabled:hover:border-white/10 rounded-xl px-4 py-3 text-xs text-white text-left flex items-center justify-between transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <SelectedIcon />
                      <span className="font-medium">{selectedMethod.name}</span>
                    </div>
                    <span className="text-gray-500 text-[10px]">▼</span>
                  </button>

                  {isSelectOpen && (
                    <div className="absolute left-0 right-0 mt-2 bg-[#0E0F14] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-40 divide-y divide-white/5">
                      {PAYMENT_METHODS.map((methodItem) => {
                        const Icon = methodItem.icon;
                        const isSelected = selectedMethodId === methodItem.id;
                        return (
                          <button
                            key={methodItem.id}
                            type="button"
                            onClick={() => {
                              setSelectedMethodId(methodItem.id);
                              setIsSelectOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 flex items-center gap-3 text-xs transition-colors hover:bg-white/5 ${
                              isSelected ? 'bg-gold/10 text-gold' : 'text-gray-300'
                            }`}
                          >
                            <Icon />
                            <span className="font-semibold">{methodItem.name}</span>
                            {isSelected && <span className="ml-auto text-[10px]">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-2 uppercase">Numéro ou détails de compte</label>
                  <input 
                    type="text" 
                    required
                    disabled={!payoutRule.can}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="w-full bg-[#0A0B10] border border-white/10 focus:border-gold rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Ex: +225 07 00 00 00 00"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-2 uppercase">Montant à retirer (FCFA)</label>
                  <input 
                    type="number" 
                    required
                    disabled={!payoutRule.can || affiliate.balance <= 0}
                    min={1}
                    max={affiliate.balance}
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    className="w-full bg-[#0A0B10] border border-white/10 focus:border-gold rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder={affiliate.balance <= 0 ? "Aucun gain retirable" : `Max retirable : ${affiliate.balance.toLocaleString()} F`}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={!payoutRule.can || affiliate.balance <= 0}
                  className="w-full py-3 bg-gold hover:bg-gold-light disabled:bg-gray-800 text-background disabled:text-gray-500 font-bold text-xs uppercase rounded-xl transition-all shadow-gold disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  Valider le retrait de gains
                </button>
              </form>
            </div>

            {/* WITHDRAWAL HISTORY */}
            <div className="bg-[#161618] border border-white/5 rounded-3xl p-6">
              <h3 className="text-md font-bold text-white mb-4">Historique des retraits</h3>
              
              {payouts.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4 font-medium">Aucune demande de versement effectuée.</p>
              ) : (
                <div className="space-y-3">
                  {payouts.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5 text-xs">
                      <div>
                        <p className="text-white font-bold">{p.amount.toLocaleString()} FCFA</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                          Par {PAYMENT_METHODS.find(m => m.id === p.method)?.name || p.method} • {p.date}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md ${
                        p.status === 'completed' 
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                      }`}>
                        {p.status === 'completed' ? 'Réalisé' : 'En attente'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: COMMISSIONS TABLE */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#161618] border border-white/5 rounded-3xl p-6 overflow-hidden">
              <h3 className="text-md font-bold text-white mb-4">Conversions & Parrainages</h3>
              
              {conversions.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">Aucun parrainage payant enregistré pour le moment.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-500 font-semibold uppercase text-[10px]">
                        <th className="pb-3">Studio parrainé</th>
                        <th className="pb-3">Forfait</th>
                        <th className="pb-3 text-right">Montant payé</th>
                        <th className="pb-3 text-right text-gold">Commission (20%)</th>
                        <th className="pb-3 text-right">Date</th>
                        <th className="pb-3 text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                      {conversions.map((c, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.01]">
                          <td className="py-3 font-semibold text-white">{c.referredStudioName}</td>
                          <td className="py-3 capitalize">SaaS {c.plan}</td>
                          <td className="py-3 text-right">{formatPrice(c.amountPaid, c.currency)}</td>
                          <td className="py-3 text-right font-bold text-gold">{formatPrice(c.commissionEarned, c.currency)}</td>
                          <td className="py-3 text-right text-gray-500">{c.date}</td>
                          <td className="py-3 text-center">
                            <span className="bg-emerald-500/15 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block">
                              Validé
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* GUIDELINES WIDGET */}
            <div className="bg-[#161618] border border-white/5 rounded-3xl p-6 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">💡 Guide de l'Affilié FotoDesk</h4>
              <ul className="text-xs text-gray-400 space-y-2.5 list-disc list-inside">
                <li>Partagez votre lien d'affiliation ou code promo sur vos réseaux.</li>
                <li>Le cookie de parrainage reste valide pendant 30 jours après le clic.</li>
                <li><strong>Règles de Retrait</strong> : Les retraits sont limités à <strong>2 fois maximum par mois</strong>.</li>
                <li><strong>Délai requis</strong> : Un espacement de <strong>10 jours ouvrés</strong> (soit 14 jours calendaires) est imposé entre chaque retrait.</li>
                <li>Les demandes sont traitées sous 24h ouvrées par l'équipe de FotoDesk.</li>
              </ul>
            </div>
          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-6 bg-[#0E0E10] text-center text-xs text-gray-500">
        © 2026 FotoDesk — Espace Partenaires & Affiliés
      </footer>
    </div>
  );
}
