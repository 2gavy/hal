import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Hal — A little help, every day',
  description: 'Your everyday assistant. Local to you, in your language.',
  appleWebApp: { title: 'Hal', capable: true, statusBarStyle: 'default' },
};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:`try{if(JSON.parse(localStorage.getItem('hal-demo-v1')||'null')?.upgraded===true)document.documentElement.dataset.halPremium='true';}catch{}`}}/></head><body>{children}</body></html>; }
