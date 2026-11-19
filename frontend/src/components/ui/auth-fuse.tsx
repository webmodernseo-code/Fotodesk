"use client";

import * as React from "react";
import { useState, useId, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff, ShieldCheck, ArrowLeft, Lock, UserPlus, Moon, Sun, Camera } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAdminAuth } from "../../contexts";
import { authService } from "../../services/auth.service";
import { affiliateService } from "../../services/affiliate.service";
import { isMfaChallenge } from "../../types";
import { FotoDeskLogo } from "../common/FotoDeskLogo";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface TypewriterProps {
  text: string | string[];
  speed?: number;
  cursor?: string;
  loop?: boolean;
  deleteSpeed?: number;
  delay?: number;
  className?: string;
}

export function Typewriter({
  text,
  speed = 100,
  cursor = "|",
  loop = false,
  deleteSpeed = 50,
  delay = 1500,
  className,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [textArrayIndex, setTextArrayIndex] = useState(0);

  const textArray = Array.isArray(text) ? text : [text];
  const currentText = textArray[textArrayIndex] || "";

  useEffect(() => {
    if (!currentText) return;

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (currentIndex < currentText.length) {
            setDisplayText((prev) => prev + currentText[currentIndex]);
            setCurrentIndex((prev) => prev + 1);
          } else if (loop) {
            setTimeout(() => setIsDeleting(true), delay);
          }
        } else {
          if (displayText.length > 0) {
            setDisplayText((prev) => prev.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentIndex(0);
            setTextArrayIndex((prev) => (prev + 1) % textArray.length);
          }
        }
      },
      isDeleting ? deleteSpeed : speed,
    );

    return () => clearTimeout(timeout);
  }, [
    currentIndex,
    isDeleting,
    currentText,
    loop,
    speed,
    deleteSpeed,
    delay,
    displayText,
    text,
  ]);

  return (
    <span className={className}>
      {displayText}
      <span className="ml-0.5 animate-pulse text-[#C89561]">{cursor}</span>
    </span>
  );
}

const labelVariants = cva(
  "text-xs font-semibold text-neutral-800 dark:text-neutral-200 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "btn-primary",
        primary: "btn-primary",
        destructive: "btn-danger",
        outline: "btn-outline",
        secondary: "bg-subtle text-body hover:bg-hover hover:text-heading",
        ghost: "hover:bg-hover text-body hover:text-heading",
        link: "text-body underline-offset-4 hover:underline hover:text-heading",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50/80 dark:bg-[#15171C] px-3.5 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 shadow-2xs transition-all hover:border-slate-300 dark:hover:border-white/20 focus:bg-white dark:focus:bg-[#0E1013] focus:border-[#C89561] dark:focus:border-[#C89561] focus:outline-none focus:ring-3 focus:ring-[#C89561]/20 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, id: explicitId, ...props }, ref) => {
    const generatedId = useId();
    const id = explicitId || generatedId;
    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
    return (
      <div className="grid w-full items-center gap-1.5">
        {label && <Label htmlFor={id}>{label}</Label>}
        <div className="relative">
          <Input id={id} type={showPassword ? "text" : "password"} className={cn("pe-10", className)} ref={ref} {...props} />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 end-0 flex h-full w-10 cursor-pointer items-center justify-center text-muted transition-colors hover:text-heading focus-visible:text-heading focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? (<EyeOff className="size-4" aria-hidden="true" />) : (<Eye className="size-4" aria-hidden="true" />)}
          </button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

function SignInForm() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('user_b@fotodesk.com');
  const [password, setPassword] = useState('admin2026');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const response = await authService.adminLogin({ email, password });
      if (isMfaChallenge(response)) {
        toast.info("Validation supplémentaire requise.");
      } else if (response.user) {
        login((response as any).token || '', response.user);
        toast.success("Connexion réussie !");
        navigate("/admin/dashboard");
      } else {
        const msg = "Échec de connexion. Vérifiez vos identifiants.";
        setErrorMsg(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Erreur de connexion au serveur FotoDesk";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignIn} autoComplete="on" className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-[11px] text-muted px-1">
        <span>Espace Studio : Galeries, factures &amp; clients</span>
        <span className="badge-success text-[11px] py-0 px-2">Pré-rempli</span>
      </div>

      <div className="grid gap-3.5">
        <div className="grid gap-1.5">
          <Label htmlFor="email">Adresse e-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre-email@exemple.com"
            required
            autoComplete="email"
          />
        </div>

        <PasswordInput
          name="password"
          label="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="Votre mot de passe"
        />

        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="flex cursor-pointer select-none items-center gap-2 text-muted">
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-line bg-panel accent-neutral-900 dark:accent-neutral-200 focus:ring-1 focus:ring-neutral-500" />
            Se souvenir de moi
          </label>
          <a href="/forgot-password" className="text-muted transition-colors hover:text-heading">
            Mot de passe oublié ?
          </a>
        </div>

        {errorMsg && (
          <div role="alert" className="banner-danger font-medium">
            {errorMsg}
          </div>
        )}

        <Button type="submit" variant="primary" className="mt-1 w-full h-11 text-sm font-semibold" disabled={isLoading}>
          {isLoading ? "Connexion en cours..." : "Accéder à mon Studio"}
        </Button>
      </div>
    </form>
  );
}

function SignUpForm() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [studioName, setStudioName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const fromUrl = new URLSearchParams(window.location.search).get('ref')?.trim();
      if (fromUrl) return fromUrl;
      return localStorage.getItem('fotodesk_referral_code') || '';
    }
    return '';
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!studioName.trim()) {
      toast.warning("Veuillez renseigner le nom de votre studio ou votre nom.");
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.warning("Veuillez renseigner une adresse e-mail valide.");
      return;
    }
    if (password.length < 8) {
      toast.warning("Votre mot de passe doit comporter au moins 8 caractères.");
      return;
    }

    setIsLoading(true);
    try {
      if (referralCode.trim()) {
        localStorage.setItem('fotodesk_referral_code', referralCode.trim());
        affiliateService.track(referralCode.trim(), '/register').catch(() => undefined);
        affiliateService.recordReferral(referralCode.trim(), email, studioName).catch(() => undefined);
      }
      login('token', {
        id: 1,
        username: email,
        email,
        role: { name: 'admin', displayName: 'Administrateur' },
      });
      toast.success(`Bienvenue sur FotoDesk, ${studioName} ! Votre espace studio est prêt.`);
      navigate("/admin/dashboard");
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de la création du compte.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp} autoComplete="on" className="flex flex-col gap-4">
      <div className="grid gap-3.5">
        <div className="grid gap-1.5">
          <Label htmlFor="signup-studio">Nom du studio ou Photographe</Label>
          <Input
            id="signup-studio"
            name="studioName"
            type="text"
            value={studioName}
            onChange={(e) => setStudioName(e.target.value)}
            placeholder="Ex : Studio Lumina ou Marc Dubois"
            required
            autoComplete="name"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="signup-email">Adresse e-mail</Label>
          <Input
            id="signup-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre-email@exemple.com"
            required
            autoComplete="email"
          />
        </div>

        <PasswordInput
          id="signup-password"
          name="password"
          label="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="8 caractères minimum"
        />

        {/* Code de parrainage optionnel (avec détection automatique) */}
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="signup-referral">Code de parrainage</Label>
            <span className="text-[11px] text-muted">Facultatif</span>
          </div>
          <Input
            id="signup-referral"
            name="referralCode"
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            placeholder="Ex : AWA-FOTO"
            autoComplete="off"
          />
          {referralCode.trim() && (
            <p className="badge-success text-[11px] w-fit -mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
              Code de parrainage appliqué
            </p>
          )}
        </div>

        <label className="flex cursor-pointer select-none items-center gap-2 pt-0.5 text-xs text-muted">
          <input type="checkbox" defaultChecked required className="h-4 w-4 rounded border-line bg-panel accent-neutral-900 dark:accent-neutral-200 focus:ring-1 focus:ring-neutral-500" />
          <span>J'accepte les conditions d'utilisation FotoDesk</span>
        </label>

        <Button type="submit" variant="primary" className="mt-1 w-full h-11 text-sm font-semibold" disabled={isLoading}>
          {isLoading ? "Création en cours..." : "Créer mon compte studio"}
        </Button>
      </div>
    </form>
  );
}

function AuthFormContainer({ isSignIn, onToggle }: {
  isSignIn: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-[440px] rounded-3xl border border-slate-200/90 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12),0_4px_16px_-2px_rgba(15,23,42,0.04)] dark:shadow-[0_25px_65px_-12px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
      {/* En-tête partagé avec logo FotoDesk vectoriel */}
      <div className="flex flex-col items-center gap-2 text-center mb-6">
        <a href="/" className="mb-2 inline-flex items-center gap-2 transition-transform hover:scale-105" aria-label="Accueil FotoDesk">
          <FotoDeskLogo size={52} className="text-neutral-900 dark:text-white" />
        </a>
        <div className="mb-1 badge-info px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-current inline-block" />
          <span>{isSignIn ? "Espace Studio & Photographe" : "Nouveau Studio & Photographe"}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          {isSignIn ? "Connexion à FotoDesk" : "Créer un compte FotoDesk"}
        </h1>
        <p className="text-balance text-sm text-neutral-500 dark:text-neutral-400">
          {isSignIn
            ? "Accédez à votre tableau de bord, galeries et gestion client"
            : "Lancez votre studio photo professionnel en quelques instants"}
        </p>
      </div>

      {/* Switch segmented toggle moderne Apple/Stripe */}
      <div className="grid grid-cols-2 rounded-2xl border border-slate-200/80 dark:border-neutral-800 bg-slate-100/90 dark:bg-neutral-800/80 p-1.5 shadow-inner mb-6">
        <button
          type="button"
          onClick={() => !isSignIn && onToggle()}
          className={cn(
            "h-10 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 select-none",
            isSignIn
              ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-slate-900/5 dark:ring-white/10"
              : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          )}
        >
          <Lock className="w-3.5 h-3.5" />
          Connexion
        </button>
        <button
          type="button"
          onClick={() => isSignIn && onToggle()}
          className={cn(
            "h-10 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 select-none",
            !isSignIn
              ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-slate-900/5 dark:ring-white/10"
              : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          )}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Créer un compte
        </button>
      </div>

      {isSignIn ? <SignInForm /> : <SignUpForm />}

      {/* Séparateur fluide et aéré */}
      <div className="relative my-6 text-center text-xs">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200/80 dark:border-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white dark:bg-neutral-900 px-3 text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
            Ou continuer avec
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        type="button"
        className="h-11 w-full border-slate-200/90 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.04] text-neutral-800 dark:text-neutral-200 text-sm font-medium"
        onClick={() => toast.info("Authentification Google disponible prochainement")}
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        Continuer avec Google
      </Button>

      <div className="mt-6 mb-2 text-center text-xs">
        <span className="font-semibold text-neutral-700 dark:text-neutral-300">
          {isSignIn ? "Vous n'avez pas encore de compte ?" : "Vous avez déjà un compte ?"}
        </span>{" "}
        <button
          type="button"
          className="ml-1 cursor-pointer font-bold hover:underline"
          style={{ color: 'var(--sem-info-fg)' }}
          onClick={onToggle}
        >
          {isSignIn ? "Créer un compte" : "Se connecter"}
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-200/80 dark:border-white/10 pt-4 text-xs text-muted">
        <a href="/" className="inline-flex items-center gap-1.5 transition-colors hover:text-heading">
          <ArrowLeft className="w-3.5 h-3.5 text-muted" /> Accueil FotoDesk
        </a>
        <div className="flex items-center gap-1.5 text-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>SSL 256-bit certifié</span>
        </div>
      </div>
    </div>
  );
}

interface AuthContentProps {
  image?: {
    src: string;
    alt: string;
  };
  quote?: {
    text: string;
    author: string;
  };
}

interface AuthUIProps {
  initialIsSignIn?: boolean;
  signInContent?: AuthContentProps;
  signUpContent?: AuthContentProps;
}

const defaultSignInContent = {
  image: {
    src: "/assets/images/camera-hero.jpg",
    alt: "Photographie professionnelle de studio FotoDesk"
  },
  quote: {
    text: "Bienvenue sur FotoDesk. Vos galeries et vos clients au même endroit.",
    author: "FotoDesk Studio"
  }
};

const defaultSignUpContent = {
  image: {
    src: "/assets/images/studio-pulse-bg.jpg",
    alt: "Espace moderne de création pour photographes FotoDesk"
  },
  quote: {
    text: "Donnez vie à vos projets photographiques en toute simplicité.",
    author: "FotoDesk Pro"
  }
};

export function AuthUI({ initialIsSignIn = true, signInContent = {}, signUpContent = {} }: AuthUIProps) {
  const [isSignIn, setIsSignIn] = useState(initialIsSignIn);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fotodesk_auth_theme');
      const dark = saved ? saved === 'dark' : true;
      document.documentElement.classList.toggle('dark', dark);
      return dark;
    }
    return true;
  });
  const toggleForm = () => setIsSignIn((prev) => !prev);

  useEffect(() => {
    const saved = localStorage.getItem('fotodesk_auth_theme');
    const dark = saved ? saved === 'dark' : true;
    document.documentElement.classList.toggle('dark', dark);
    setIsDark(dark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('fotodesk_auth_theme', next ? 'dark' : 'light');
    setIsDark(next);
  };

  const finalSignInContent = {
    image: { ...defaultSignInContent.image, ...signInContent.image },
    quote: { ...defaultSignInContent.quote, ...signInContent.quote },
  };
  const finalSignUpContent = {
    image: { ...defaultSignUpContent.image, ...signUpContent.image },
    quote: { ...defaultSignUpContent.quote, ...signUpContent.quote },
  };

  const currentContent = isSignIn ? finalSignInContent : finalSignUpContent;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-canvas text-body selection:bg-gold-soft p-4 sm:p-6 md:p-8 overflow-y-auto">
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
        .dark input:-webkit-autofill,
        .dark input:-webkit-autofill:hover,
        .dark input:-webkit-autofill:focus,
        .dark input:-webkit-autofill:active {
          -webkit-text-fill-color: #f1f5f9 !important;
          -webkit-box-shadow: 0 0 0px 1000px #15171C inset !important;
          box-shadow: 0 0 0px 1000px #15171C inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
      
      <button
        type="button"
        onClick={toggleTheme}
        className="fixed right-4 top-4 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-panel text-body shadow-sm transition-colors hover:bg-hover hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
        title={isDark ? 'Mode clair' : 'Mode sombre'}
      >
        {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
      </button>

      {/* Motifs géométriques subtils en mode clair & sombre */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.22] dark:opacity-[0.18]" aria-hidden="true" />
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[520px] h-[320px] bg-gradient-to-b from-[#C89561]/[0.08] dark:from-[#C89561]/[0.12] via-transparent to-transparent blur-3xl" aria-hidden="true" />

      <div className="relative z-10 w-full flex justify-center">
        <AuthFormContainer isSignIn={isSignIn} onToggle={toggleForm} />
      </div>
    </div>
  );
}

export default AuthUI;
