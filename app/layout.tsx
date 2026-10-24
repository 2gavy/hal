import type { Metadata, Viewport } from 'next';
import AppViewport from './components/app-viewport';
import './globals.css';
export const metadata: Metadata = {
  title: 'Hal — A little help, every day',
  description: 'Your everyday assistant. Local to you, in your language.',
  appleWebApp: { title: 'Hal', capable: true, statusBarStyle: 'default' },
};
export const viewport: Viewport = {width:'device-width',initialScale:1,viewportFit:'cover',interactiveWidget:'resizes-content',themeColor:'#ffffff'};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:`try{if(JSON.parse(localStorage.getItem('hal-demo-v1')||'null')?.upgraded===true)document.documentElement.dataset.halPremium='true';}catch{}`}}/></head><body><AppViewport/>{children}</body></html>; }
