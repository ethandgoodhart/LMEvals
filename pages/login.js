import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { FcGoogle } from 'react-icons/fc';
import CustomNavbar from '../components/CustomNavbar';
import Cookies from 'js-cookie';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.push('/library');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    // In your login callback (client-side)
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: 'https://lmevals.org/library' } });
    if (data?.session) {
      Cookies.set('sb-access-token', data.session.access_token, { path: '/' });
      Cookies.set('sb-refresh-token', data.session.refresh_token, { path: '/' });
    }
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-sans">
      <Head>
        <title>Login | LMEvals</title>
      </Head>
      <CustomNavbar />
      <div className="w-full max-w-md rounded-3xl p-10">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-2">
            <img
              src="/logo2.png"
              alt="LMEvals"
              className="w-16 h-16 p-2"
            />
          </div>
          <h1 className="text-5xl font-semibold text-black tracking-tight mb-1">
            LMEvals
          </h1>
          <span className="text-gray-500 text-base font-medium tracking-wide">
            Sign in to your account
          </span>
        </div>
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="flex items-center justify-center w-full py-3 mb-6 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition text-lg font-medium shadow-sm"
        >
          <FcGoogle className="mr-3 text-2xl" />
          Continue with Google
        </button>
        <div className="flex items-center my-4">
          <div className="flex-grow h-px bg-gray-200" />
          <span className="mx-4 text-gray-400 font-light">or</span>
          <div className="flex-grow h-px bg-gray-200" />
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white text-gray-900 placeholder-gray-400 transition"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white text-gray-900 placeholder-gray-400 transition"
              placeholder="Your password"
            />
          </div>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg text-lg font-semibold transition-colors duration-200 ${loading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="text-center mt-6 text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="text-blue-600 hover:underline">Sign up</a>
        </div>
      </div>
    </div>
  );
} 