import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { AppLayout } from '@/components/layout/AppLayout';
import { ClientProviders } from '@/components/ClientProviders';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Controle de Inadimplências',
  description: 'Gestão de parcelas e contratos dos clientes da Caixa.',
};

import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${jakarta.variable} font-sans antialiased`}>
        <ClientProviders>
          <AppLayout>{children}</AppLayout>
          <Toaster position="top-right" richColors toastOptions={{ style: { zIndex: 99999 } }} />
        </ClientProviders>
      </body>
    </html>
  );
}
