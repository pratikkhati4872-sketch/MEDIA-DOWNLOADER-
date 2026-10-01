import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'CyberVault OSINT & Utility Suite',
    description: 'CyberVault media and PDF utilities.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return <html lang="en"><body>{children}</body></html>;
}
