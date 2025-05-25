import Link from "next/link";
import { ArrowUpRightFromSquare, ChevronRight, MoveRight } from "lucide-react";
import Head from "next/head";
import CustomNavbar from "../components/CustomNavbar";
import React, { useState, useEffect, useRef } from "react";

export default function Home() {
  const exampleQueries = [
    "How many r's in Strawberry?",
    "What's the area of a hallway that's 5m by 1m?",
  ];
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [placeholderOpacity, setPlaceholderOpacity] = useState(1);
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }

    const interval = setInterval(() => {
      setPlaceholderOpacity(0); // Start fade out
      setTimeout(() => {
        setPlaceholderIdx(idx => (idx + 1) % exampleQueries.length);
        setPlaceholderOpacity(1); // Fade in new text
      }, 200); // Fade duration
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans flex flex-col">
      <Head>
        <title>LMEvals</title>
      </Head>
      <CustomNavbar />

      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative mt-12">
          <span className="block text-center mb-6">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border-black/25 border text-black/70">
              Beta
            </span>
          </span>
          
          <h1 className="text-center text-7xl max-sm:text-5xl font-bold tracking-tight text-black mb-4 max-w-5xl">
            Create LLM evals.
          </h1>

          <p className="text-center text-2xl text-black/70 max-w-3xl mx-auto mb-12 leading-relaxed">
            Custom evaluations, benchmark, and browse.
          </p>

          <div className="flex items-center justify-center gap-6">
            <form
              className="relative w-full max-w-xl"
              onSubmit={e => {
                e.preventDefault();
                const prompt = e.target.elements.evalPrompt.value.trim();
                if (prompt) {
                  // Redirect to /configure with prompt as query param
                  window.location.href = `/configure?prompt=${encodeURIComponent(prompt)}`;
                }
              }}
            >
              <div className="relative w-full">
                <input
                  ref={inputRef}
                  type="text"
                  name="evalPrompt"
                  placeholder=""
                  value={inputValue}
                  autoFocus={true}
                  onChange={e => setInputValue(e.target.value)}
                  className="w-full pr-14 pl-6 py-4 max-sm:text-sm rounded-2xl border border-black/10 bg-white text-lg focus:outline-none duration-200 shadow-sm"
                  autoComplete="off"
                />
                {inputValue === "" && (
                  <span
                    className="absolute left-6 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none select-none text-lg max-sm:text-sm transition-opacity"
                    style={{ opacity: placeholderOpacity, transition: 'opacity 0.2s' }}
                  >
                    {exampleQueries[placeholderIdx]}
                  </span>
                )}
              </div>
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#2563EB] hover:bg-blue-500 text-white rounded-xl p-3 transition-all duration-200 flex items-center justify-center"
                aria-label="Create eval"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12h14m-6-6l6 6-6 6"
                  />
                </svg>
              </button>
            </form>
          </div>

          <div className="mt-20 flex flex-col items-center justify-center">
              <div className="flex gap-1">
                <img src="https://static.vecteezy.com/system/resources/previews/021/059/827/non_2x/chatgpt-logo-chat-gpt-icon-on-white-background-free-vector.jpg" className="w-10 h-10 border rounded-lg object-contain" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Google_Favicon_2025.svg/330px-Google_Favicon_2025.svg.png" className="w-10 h-10 border rounded-lg object-contain p-1" />
                <img src="https://openrouter.ai/images/icons/Anthropic.svg" className="w-10 h-10 border rounded-lg object-contain" />
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcROcXRdeEoeB-Kl449XzrchCvGwxDaTRltKSg&s" className="w-10 h-10 border rounded-lg object-contain" />
                <img src="https://res.cloudinary.com/apideck/image/upload/w_196,f_auto/v1677940393/marketplaces/ckhg56iu1mkpc0b66vj7fsj3o/listings/meta_nnmll6.webp" className="w-10 h-10 border rounded-lg object-contain" />
              </div>
            </div>
        </div>
      </main>

      <footer className="relative border-t border-black/5 bg-white">
        <div className="max-w-7xl mx-auto py-12 px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center">
              <span className="text-black/70 text-sm">© 2025 LMEvals. All rights reserved.</span>
            </div>
            <nav className="flex items-center space-x-8">
              <a href="#" className="text-black/70 hover:text-black text-sm transition-colors duration-200">About</a>
              <a href="#" className="text-black/70 hover:text-black text-sm transition-colors duration-200">Contact</a>
              <a href="#" className="text-black/70 hover:text-black text-sm transition-colors duration-200">Privacy</a>
              <a href="#" className="text-black/70 hover:text-black text-sm transition-colors duration-200">Terms</a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
