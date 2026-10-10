"use client";

import * as React from "react";
import { useState, useId, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff, ShieldCheck, ArrowLeft } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAdminAuth } from "../../contexts";

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
      <span className="animate-pulse text-[#5C8762] ml-0.5">{cursor}</span>
    </span>
  );
}

const labelVariants = cva(
  "text-xs font-medium text-neutral-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef<
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

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C8762] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0C] disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#5C8762] text-white hover:bg-[#4E7554] active:bg-[#416246] shadow-[0_4px_16px_rgba(92,135,98,0.3)] hover:shadow-[0_6px_22px_rgba(92,135,98,0.45)]",
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        outline: "border border-white/[0.1] bg-[#13161C] text-neutral-200 hover:bg-[#1A1E26] hover:text-white hover:border-white/[0.18]",
        secondary: "bg-[#181C24] text-neutral-200 hover:bg-[#202530] hover:text-white",
        ghost: "hover:bg-white/[0.06] text-neutral-300 hover:text-white",
        link: "text-[#7FA685] underline-offset-4 hover:underline hover:text-[#9BBF9F]",
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

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-white/[0.1] bg-[#13161C] px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-500 shadow-inner transition-all hover:border-white/[0.18] focus-visible:outline-none focus-visible:border-[#5C8762] focus-visible:ring-2 focus-visible:ring-[#5C8762]/30 disabled:cursor-not-allowed disabled:opacity-50",
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

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, ...props }, ref) => {
    const id = useId();
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
            className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-neutral-400 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
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
  const [email, setEmail] = useState("founder@fotodesk.com");
  const [password, setPassword] = useState("admin2026");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success("Connexion réussie !");
        navigate("/admin/dashboard");
      } else {
        toast.error(result.error || "Échec de connexion. Vérifiez vos identifiants.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Erreur de connexion au serveur FotoDesk");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignIn} autoComplete="on" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <a href="/" className="mb-1 inline-flex items-center gap-2 transition-transform hover:scale-105">
          <img src="/logo.png" alt="FotoDesk" className="h-9 w-auto object-contain drop-shadow-[0_2px_12px_rgba(92,135,98,0.25)]" />
        </a>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#5C8762]/15 text-[#8CB492] border border-[#5C8762]/30 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5C8762] animate-pulse" />
          Espace Studio & Photographe
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Connexion à FotoDesk</h1>
        <p className="text-balance text-sm text-neutral-400">Accédez à votre tableau de bord, galeries et gestion client</p>
      </div>

      <div className="grid gap-4">
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
          <label className="flex items-center gap-2 text-neutral-400 cursor-pointer select-none">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-white/10 bg-[#13161C] text-[#5C8762] focus:ring-[#5C8762] focus:ring-offset-0" />
            Se souvenir de moi
          </label>
          <a href="/forgot-password" className="text-[#7FA685] hover:text-[#9BBF9F] transition-colors">
            Mot de passe oublié ?
          </a>
        </div>

        <Button type="submit" variant="default" className="mt-2 w-full h-11 text-base font-semibold" disabled={isLoading}>
          {isLoading ? "Connexion en cours..." : "Se connecter"}
        </Button>
      </div>
    </form>
  );
}

function SignUpForm() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Compte FotoDesk créé avec succès !");
      navigate("/admin/dashboard");
    }, 700);
  };

  return (
    <form onSubmit={handleSignUp} autoComplete="on" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <a href="/" className="mb-1 inline-flex items-center gap-2 transition-transform hover:scale-105">
          <img src="/logo.png" alt="FotoDesk" className="h-9 w-auto object-contain drop-shadow-[0_2px_12px_rgba(92,135,98,0.25)]" />
        </a>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#5C8762]/15 text-[#8CB492] border border-[#5C8762]/30 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5C8762] animate-pulse" />
          Essai gratuit 14 jours
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Créer un compte FotoDesk</h1>
        <p className="text-balance text-sm text-neutral-400">Rejoignez FotoDesk et offrez des galeries d'exception à vos clients</p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="name">Nom complet ou Studio</Label>
          <Input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Studio Lumina"
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
            placeholder="contact@exemple.com"
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
          autoComplete="new-password"
          placeholder="Créer un mot de passe sécurisé"
        />

        <Button type="submit" variant="default" className="mt-2 w-full h-11 text-base font-semibold" disabled={isLoading}>
          {isLoading ? "Création en cours..." : "Créer mon compte"}
        </Button>
      </div>
    </form>
  );
}

function AuthFormContainer({ isSignIn, onToggle }: { isSignIn: boolean; onToggle: () => void; }) {
  return (
    <div className="mx-auto grid w-full max-w-[390px] gap-5">
      {isSignIn ? <SignInForm /> : <SignUpForm />}

      <div className="text-center text-sm text-neutral-400">
        {isSignIn ? "Vous n'avez pas encore de compte ?" : "Vous avez déjà un compte ?"}{" "}
        <button
          type="button"
          className="font-medium text-[#7FA685] hover:text-[#9BBF9F] transition-colors cursor-pointer ml-1"
          onClick={onToggle}
        >
          {isSignIn ? "Créer un compte" : "Se connecter"}
        </button>
      </div>

      <div className="relative text-center text-xs after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-white/[0.08]">
        <span className="relative z-10 bg-[#090A0C] px-3 text-neutral-500 font-medium">Ou continuer avec</span>
      </div>

      <Button
        variant="outline"
        type="button"
        className="h-11 w-full"
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

      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs text-neutral-400">
        <a href="/" className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Accueil FotoDesk
        </a>
        <div className="flex items-center gap-1.5 text-neutral-400">
          <ShieldCheck className="w-3.5 h-3.5 text-[#5C8762]" />
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
  signInContent?: AuthContentProps;
  signUpContent?: AuthContentProps;
}

const defaultSignInContent = {
  image: {
    src: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1600&q=80",
    alt: "Photographie professionnelle de studio FotoDesk"
  },
  quote: {
    text: "Bienvenue sur FotoDesk. Vos galeries et vos clients au même endroit.",
    author: "FotoDesk Studio"
  }
};

const defaultSignUpContent = {
  image: {
    src: "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&w=1600&q=80",
    alt: "Espace moderne de création pour photographes FotoDesk"
  },
  quote: {
    text: "Donnez vie à vos projets photographiques en toute simplicité.",
    author: "FotoDesk Pro"
  }
};

export function AuthUI({ signInContent = {}, signUpContent = {} }: AuthUIProps) {
  const [isSignIn, setIsSignIn] = useState(true);
  const toggleForm = () => setIsSignIn((prev) => !prev);

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
    <div className="w-full min-h-screen md:grid md:grid-cols-2 bg-[#090A0C] text-white selection:bg-[#5C8762] selection:text-white">
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
      `}</style>
      
      {/* Colonne Formulaire gauche */}
      <div className="flex min-h-screen items-center justify-center p-6 md:p-12 bg-[#090A0C] border-r border-white/[0.06]">
        <AuthFormContainer isSignIn={isSignIn} onToggle={toggleForm} />
      </div>

      {/* Colonne Hero droite */}
      <div
        className="hidden md:block relative bg-cover bg-center transition-all duration-700 ease-in-out"
        style={{ backgroundImage: `url(${currentContent.image.src})` }}
        key={currentContent.image.src}
      >
        {/* Voiles sombres progressifs pour un rendu cinématique */}
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090A0C] via-[#090A0C]/35 to-black/30" />
        
        {/* Badge supérieur FotoDesk */}
        <div className="absolute top-8 right-8 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-medium text-neutral-300">
          <span className="w-2 h-2 rounded-full bg-[#5C8762] shadow-[0_0_8px_#5C8762]" />
          FotoDesk Pro Engine
        </div>

        {/* Citation machine à écrire avec touche kaki */}
        <div className="relative z-10 flex h-full flex-col items-center justify-end p-8 pb-14">
          <blockquote className="space-y-3.5 text-center text-white max-w-lg px-4">
            <p className="text-xl lg:text-2xl font-medium drop-shadow-md leading-relaxed text-neutral-100">
              “<Typewriter
                key={currentContent.quote.text}
                text={currentContent.quote.text}
                speed={50}
              />”
            </p>
            <cite className="block text-sm font-light text-[#8CB492] not-italic tracking-wide">
              — {currentContent.quote.author}
            </cite>
          </blockquote>
        </div>
      </div>
    </div>
  );
}

export default AuthUI;
