import Link from "next/link";
import { SiStudyverse } from "react-icons/si";
import { Search } from "lucide-react";

const CustomNavbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between h-24 items-center">
            <div className="flex items-center gap-4 hover:opacity-70 transition-opacity duration-200">
              {/* <SiStudyverse className="w-6 h-6 fill-black" /> */}
              <Link href="/" className="text-black text-2xl -mt-1 tracking-tighter font-medium">
                LMEval
              </Link>
              <div className="hidden w-72 md:flex items-center bg-gray-100 rounded-xl px-4 py-2 ml-2 border border-gray-200 focus-within:ring-2 focus-within:ring-black/10 transition-all">
                <Search className="w-4 h-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search evals"
                  className="bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 w-32"
                />
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-12">
              <Link href="/evals" className="text-black/80 hover:text-black transition-colors duration-200">
                Evals
              </Link>
              <Link href="/library" className="text-black/80 hover:text-black transition-colors duration-200">
                Library
              </Link>
              <Link href="/login" className="text-black/80 hover:text-black transition-colors duration-200">
                Login
              </Link>
              <Link href="/signup">
                <button className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-black/90 transition-all duration-300 ease-[easeInOut]">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
    </nav>
  );
};

export default CustomNavbar;