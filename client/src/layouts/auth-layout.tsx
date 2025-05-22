import React from 'react';
import { AuthHeader } from '@/components/layout/auth-header';
import { AuthFooter } from '@/components/layout/auth-footer';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AuthHeader />
      <main className="flex-1">
        {children}
      </main>
      <AuthFooter />
    </div>
  );
}