import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Format Studio', description: 'A focused workspace for your files.' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return <html lang="en"><body>{children}</body></html>;
}
