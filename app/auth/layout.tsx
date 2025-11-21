import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication - DanceFit',
  description: 'Sign in to your DanceFit account',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
