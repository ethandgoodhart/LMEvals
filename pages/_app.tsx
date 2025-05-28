import type { AppProps } from 'next/app';
import '../app/globals.css';
import { Geist, Geist_Mono } from "next/font/google";
import { UserProvider } from "../context/UserContext";
import Head from 'next/head';

const geistSans = Geist({
  variable: "--font-geist-sans", 
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <Head>
        <meta property="og:title" content="LMEvals" />
        <meta property="og:description" content="LMEvals" />
        <meta property="og:image" content="/logocard.png" />
      </Head>
      <main className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Component {...pageProps} />
      </main>
    </UserProvider>
  );
}
