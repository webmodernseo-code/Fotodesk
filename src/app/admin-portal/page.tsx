import type { Metadata } from 'next';
import FounderPortalClient from '@/components/FounderPortalClient';

export const metadata: Metadata = {
  title: "FotoDesk — Administration",
  description: "Espace Fondateur Privé",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPortalPage() {
  return <FounderPortalClient />;
}
