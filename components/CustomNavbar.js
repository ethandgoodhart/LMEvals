import Link from "next/link";
import { SiStudyverse } from "react-icons/si";
import { Search, UserCircle } from "lucide-react";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/router';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CustomNavbar = () => {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const router = useRouter();
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="w-[90%] mx-auto px-6">
          <div className="flex justify-between h-24 items-center">
            <div className="flex items-center hover:opacity-70 transition-opacity duration-200">
              {/* <SiStudyverse className="w-6 h-6 fill-black" /> */}
              <img src="/logo2.png" alt="LMEvals" className="w-5 h-5 -mt-0.5" />
              <Link href="/" className="text-black text-2xl -mt-0.5 ml-1 tracking-tighter font-medium">
                LMEvals
              </Link>
              <div className="hidden w-72 md:flex items-center bg-gray-100 rounded-xl px-4 py-2 ml-8 border border-gray-200 focus-within:ring-2 focus-within:ring-black/10 transition-all">
                <Search className="w-4 h-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search evals"
                  className="bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 w-32"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && search.trim()) {
                      router.push(`/evals?search=${encodeURIComponent(search.trim())}`);
                    }
                  }}
                />
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-12">
              <Link href="/evals" className="text-black/80 hover:text-black transition-colors duration-200">
                Explore
              </Link>
              {!user && (
                <Link href="/login" className="text-black/80 hover:text-black transition-colors duration-200">
                  Login
                </Link>
              )}
              {!user && (
                <Link href="/signup">
                  <button className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-black/90 transition-all duration-300 ease-[easeInOut]">
                    Get Started
                  </button>
                </Link>
              )}
              {user && (
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-blue-500 shadow-md group-hover:ring-2 group-hover:ring-blue-400 transition-all duration-200">
                      <Link href="/library">
                        <img
                          src={user.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/identicon/svg?seed=" + encodeURIComponent(user.email)}
                          alt="User Avatar"
                          className="w-full h-full object-cover"
                        />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
    </nav>
  );
};

export default CustomNavbar;