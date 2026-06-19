export type Affiliate = {
  id: string;
  name: string;
  email: string;
  refCode: string;
  promoCode: string;
  balance: number;
  totalEarned: number;
  clicks: number;
  signups: number;
  conversionsCount: number;
};

export type AffiliateConversion = {
  id: string;
  affiliateId: string;
  referredStudioName: string;
  plan: 'starter' | 'pro' | 'studio';
  amountPaid: number;
  commissionEarned: number;
  currency: 'africa' | 'europe' | 'usa';
  date: string;
  status: 'valid' | 'pending';
};

export type AffiliatePayout = {
  id: string;
  affiliateId: string;
  amount: number;
  method: 'wave' | 'mtn' | 'orange' | 'moov' | 'paypal';
  accountDetails: string;
  date: string;
  status: 'completed' | 'pending';
  createdAt?: number; // timestamp
};

export type SimulatedPhotographer = {
  id: string;
  studioName: string;
  email: string;
  plan: 'free' | 'starter' | 'pro' | 'studio';
  dateJoined: string;
  referredBy?: string;
};

const STORAGE_KEYS = {
  AFFILIATES: 'fotodesk_affiliates_v1',
  CONVERSIONS: 'fotodesk_conversions_v1',
  PAYOUTS: 'fotodesk_payouts_v1',
  PHOTOGRAPHERS: 'fotodesk_simulated_photographers_v1',
  ACTIVE_SESSION: 'fotodesk_active_affiliate_session'
};

const isClient = () => typeof window !== 'undefined';

// Default seeded data for simulation
const DEFAULT_AFFILIATES: Affiliate[] = [
  {
    id: 'aff-marc',
    name: 'Marc Parrainage',
    email: 'affiliate@fotodesk.com',
    refCode: 'marc',
    promoCode: 'MARC20',
    balance: 45000,
    totalEarned: 60000,
    clicks: 148,
    signups: 12,
    conversionsCount: 3
  }
];

const DEFAULT_CONVERSIONS: AffiliateConversion[] = [
  {
    id: 'conv-1',
    affiliateId: 'aff-marc',
    referredStudioName: 'Studio Lumière',
    plan: 'pro',
    amountPaid: 12000,
    commissionEarned: 2400,
    currency: 'africa',
    date: '10 Juin 2026',
    status: 'valid'
  },
  {
    id: 'conv-2',
    affiliateId: 'aff-marc',
    referredStudioName: 'Kreativ Agency',
    plan: 'starter',
    amountPaid: 48000, // Annual starter
    commissionEarned: 9600,
    currency: 'africa',
    date: '12 Juin 2026',
    status: 'valid'
  },
  {
    id: 'conv-3',
    affiliateId: 'aff-marc',
    referredStudioName: 'Abidjan Wedding',
    plan: 'studio',
    amountPaid: 240000, // Annual studio
    commissionEarned: 48000,
    currency: 'africa',
    date: '15 Juin 2026',
    status: 'valid'
  }
];

// Seed a past payout on 16 June 2026 (useful to trigger 10 business days spacer alert)
const DEFAULT_PAYOUTS: AffiliatePayout[] = [
  {
    id: 'payout-1',
    affiliateId: 'aff-marc',
    amount: 15000,
    method: 'wave',
    accountDetails: '+225 0707070707',
    date: '16 Juin 2026',
    status: 'completed',
    createdAt: new Date('2026-06-16').getTime()
  }
];

// Seed list of mock photographers for the Founder portal
const DEFAULT_PHOTOGRAPHERS: SimulatedPhotographer[] = [
  { id: 'photo-1', studioName: 'Studio Lumière', email: 'lumiere@studio.com', plan: 'pro', dateJoined: '10 Juin 2026', referredBy: 'marc' },
  { id: 'photo-2', studioName: 'Kreativ Agency', email: 'contact@kreativ.ci', plan: 'starter', dateJoined: '12 Juin 2026', referredBy: 'marc' },
  { id: 'photo-3', studioName: 'Abidjan Wedding', email: 'photos@abidjanwedding.com', plan: 'studio', dateJoined: '15 Juin 2026', referredBy: 'marc' },
  { id: 'photo-4', studioName: 'Elegance Portrait', email: 'elegance@gmail.com', plan: 'free', dateJoined: '17 Juin 2026' },
  { id: 'photo-5', studioName: 'Douala Studio', email: 'douala@photo.cm', plan: 'pro', dateJoined: '18 Juin 2026' }
];

// Helper functions
export function getStoredAffiliates(): Affiliate[] {
  if (!isClient()) return DEFAULT_AFFILIATES;
  const stored = localStorage.getItem(STORAGE_KEYS.AFFILIATES);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.AFFILIATES, JSON.stringify(DEFAULT_AFFILIATES));
    return DEFAULT_AFFILIATES;
  }
  return JSON.parse(stored);
}

export function saveStoredAffiliates(affiliates: Affiliate[]) {
  if (!isClient()) return;
  localStorage.setItem(STORAGE_KEYS.AFFILIATES, JSON.stringify(affiliates));
}

export function getStoredConversions(): AffiliateConversion[] {
  if (!isClient()) return DEFAULT_CONVERSIONS;
  const stored = localStorage.getItem(STORAGE_KEYS.CONVERSIONS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.CONVERSIONS, JSON.stringify(DEFAULT_CONVERSIONS));
    return DEFAULT_CONVERSIONS;
  }
  return JSON.parse(stored);
}

export function saveStoredConversions(conversions: AffiliateConversion[]) {
  if (!isClient()) return;
  localStorage.setItem(STORAGE_KEYS.CONVERSIONS, JSON.stringify(conversions));
}

export function getStoredPayouts(): AffiliatePayout[] {
  if (!isClient()) return DEFAULT_PAYOUTS;
  const stored = localStorage.getItem(STORAGE_KEYS.PAYOUTS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.PAYOUTS, JSON.stringify(DEFAULT_PAYOUTS));
    return DEFAULT_PAYOUTS;
  }
  return JSON.parse(stored);
}

export function saveStoredPayouts(payouts: AffiliatePayout[]) {
  if (!isClient()) return;
  localStorage.setItem(STORAGE_KEYS.PAYOUTS, JSON.stringify(payouts));
}

export function getStoredPhotographers(): SimulatedPhotographer[] {
  if (!isClient()) return DEFAULT_PHOTOGRAPHERS;
  const stored = localStorage.getItem(STORAGE_KEYS.PHOTOGRAPHERS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.PHOTOGRAPHERS, JSON.stringify(DEFAULT_PHOTOGRAPHERS));
    return DEFAULT_PHOTOGRAPHERS;
  }
  return JSON.parse(stored);
}

export function saveStoredPhotographers(photographers: SimulatedPhotographer[]) {
  if (!isClient()) return;
  localStorage.setItem(STORAGE_KEYS.PHOTOGRAPHERS, JSON.stringify(photographers));
}

// Add photographer signup to mock database
export function addPhotographerToMockList(studioName: string, email: string, plan: 'free' | 'starter' | 'pro' | 'studio', refCode?: string) {
  if (!isClient()) return;
  const photographers = getStoredPhotographers();
  
  // Prevent duplicate
  if (photographers.some(p => p.email.toLowerCase() === email.toLowerCase())) return;

  const newPhotographer: SimulatedPhotographer = {
    id: `photo-${Date.now()}`,
    studioName,
    email,
    plan,
    dateJoined: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    referredBy: refCode || undefined
  };

  saveStoredPhotographers([newPhotographer, ...photographers]);
}

// Session Management
export function getCurrentAffiliate(): Affiliate | null {
  if (!isClient()) return null;
  const affiliateId = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
  if (!affiliateId) return null;
  const affiliates = getStoredAffiliates();
  return affiliates.find(a => a.id === affiliateId) || null;
}

export function logoutAffiliate() {
  if (!isClient()) return;
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
}

// Authentication
export function registerAffiliate(name: string, email: string, refCode: string): { success: boolean; error?: string } {
  const affiliates = getStoredAffiliates();
  
  // Normalization
  const cleanRef = refCode.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!cleanRef) return { success: false, error: 'Le code parrain doit contenir des caractères alphanumériques.' };

  // Verification
  if (affiliates.some(a => a.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: 'Cette adresse e-mail est déjà inscrite.' };
  }
  if (affiliates.some(a => a.refCode.toLowerCase() === cleanRef)) {
    return { success: false, error: 'Ce code de parrainage est déjà pris.' };
  }

  const newAff: Affiliate = {
    id: `aff-${Date.now().toString()}`,
    name,
    email,
    refCode: cleanRef,
    promoCode: cleanRef.toUpperCase() + '20',
    balance: 0,
    totalEarned: 0,
    clicks: 0,
    signups: 0,
    conversionsCount: 0
  };

  saveStoredAffiliates([...affiliates, newAff]);
  localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, newAff.id);
  return { success: true };
}

export function loginAffiliate(email: string): { success: boolean; error?: string } {
  const affiliates = getStoredAffiliates();
  const affiliate = affiliates.find(a => a.email.toLowerCase() === email.toLowerCase());
  
  if (!affiliate) {
    if (email.toLowerCase() === 'affiliate@fotodesk.com') {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, 'aff-marc');
      return { success: true };
    }
    return { success: false, error: 'Identifiants incorrects.' };
  }

  localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, affiliate.id);
  return { success: true };
}

// Referral Action Functions
export function recordClick(refCode: string) {
  if (!isClient()) return;
  const affiliates = getStoredAffiliates();
  const index = affiliates.findIndex(a => a.refCode.toLowerCase() === refCode.toLowerCase());
  if (index !== -1) {
    affiliates[index].clicks += 1;
    saveStoredAffiliates(affiliates);
  }
}

export function recordSignup(refCode: string) {
  if (!isClient()) return;
  const affiliates = getStoredAffiliates();
  const index = affiliates.findIndex(a => a.refCode.toLowerCase() === refCode.toLowerCase());
  if (index !== -1) {
    affiliates[index].signups += 1;
    saveStoredAffiliates(affiliates);
  }
}

export function recordConversion(
  refCodeOrPromo: string, 
  referredStudioName: string, 
  plan: 'starter' | 'pro' | 'studio',
  amountPaid: number,
  currency: 'africa' | 'europe' | 'usa' = 'africa'
) {
  if (!isClient()) return;
  const affiliates = getStoredAffiliates();
  const cleanCode = refCodeOrPromo.trim().toLowerCase();

  const affiliate = affiliates.find(a => 
    a.refCode.toLowerCase() === cleanCode || 
    a.promoCode.toLowerCase() === cleanCode
  );

  if (!affiliate) return;

  const commission = Math.round(amountPaid * 0.2); // 20% commission

  const conversions = getStoredConversions();
  const newConversion: AffiliateConversion = {
    id: `conv-${Date.now()}`,
    affiliateId: affiliate.id,
    referredStudioName,
    plan,
    amountPaid,
    commissionEarned: commission,
    currency,
    date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    status: 'valid'
  };

  saveStoredConversions([newConversion, ...conversions]);

  // Update affiliate stats
  const index = affiliates.findIndex(a => a.id === affiliate.id);
  if (index !== -1) {
    affiliates[index].balance += commission;
    affiliates[index].totalEarned += commission;
    affiliates[index].conversionsCount += 1;
    saveStoredAffiliates(affiliates);
  }
}

// Constraints: Max 2 payouts per month, spaced by 10 business days (14 calendar days)
export function canRequestPayout(affiliateId: string): { can: boolean; reason?: string } {
  if (!isClient()) return { can: true };
  const payouts = getStoredPayouts().filter(p => p.affiliateId === affiliateId);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // 1. Max 2 payouts per calendar month
  const thisMonthPayouts = payouts.filter(p => {
    const pDate = new Date(p.createdAt || Date.now());
    return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
  });

  if (thisMonthPayouts.length >= 2) {
    return {
      can: false,
      reason: "Limite mensuelle atteinte. Vous avez déjà demandé 2 versements ce mois-ci (maximum autorisé)."
    };
  }

  // 2. Space of 10 business days (approx. 14 calendar days) between requests
  if (payouts.length > 0) {
    const sorted = [...payouts].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const lastPayout = sorted[0];
    const lastPayoutTime = lastPayout.createdAt || Date.now();
    const diffMs = Date.now() - lastPayoutTime;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 14) {
      const remainingDays = Math.ceil(14 - diffDays);
      return {
        can: false,
        reason: `Délai de 10 jours ouvrés requis. Veuillez patienter encore ${remainingDays} jour(s) avant votre prochaine demande.`
      };
    }
  }

  return { can: true };
}

export function requestPayout(affiliateId: string, method: AffiliatePayout['method'], accountDetails: string, amount: number): { success: boolean; error?: string } {
  if (!isClient()) return { success: false };
  
  // Double-check rules
  const ruleCheck = canRequestPayout(affiliateId);
  if (!ruleCheck.can) {
    return { success: false, error: ruleCheck.reason };
  }

  const affiliates = getStoredAffiliates();
  const idx = affiliates.findIndex(a => a.id === affiliateId);
  if (idx === -1) return { success: false, error: 'Affilié introuvable.' };

  const aff = affiliates[idx];
  if (amount > aff.balance) {
    return { success: false, error: 'Solde disponible insuffisant.' };
  }
  if (amount <= 0) {
    return { success: false, error: 'Montant invalide.' };
  }

  // Deduct from balance
  affiliates[idx].balance -= amount;
  saveStoredAffiliates(affiliates);

  // Record payout request
  const payouts = getStoredPayouts();
  const newPayout: AffiliatePayout = {
    id: `payout-${Date.now()}`,
    affiliateId,
    amount,
    method,
    accountDetails,
    date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    status: 'pending',
    createdAt: Date.now()
  };

  saveStoredPayouts([newPayout, ...payouts]);
  
  // Dispatch event so dashboards sync
  window.dispatchEvent(new CustomEvent('fotodesk-db-updated'));
  return { success: true };
}
