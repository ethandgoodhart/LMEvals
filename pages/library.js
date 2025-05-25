import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import CustomNavbar from "../components/CustomNavbar";
import Head from "next/head";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/router';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const modelIcons = {
  'openai/gpt-4o-mini': 'https://static.vecteezy.com/system/resources/previews/021/059/827/non_2x/chatgpt-logo-chat-gpt-icon-on-white-background-free-vector.jpg',
  'google/gemini-2.5-flash-preview-05-20': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Google_Favicon_2025.svg/330px-Google_Favicon_2025.svg.png',
  'anthropic/claude-3.5-haiku': 'https://openrouter.ai/images/icons/Anthropic.svg',
  'x-ai/grok-3-mini-beta': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcROcXRdeEoeB-Kl449XzrchCvGwxDaTRltKSg&s',
  'meta-llama/llama-3.3-70b-instruct': 'https://res.cloudinary.com/apideck/image/upload/w_196,f_auto/v1677940393/marketplaces/ckhg56iu1mkpc0b66vj7fsj3o/listings/meta_nnmll6.webp',
  'deepseek/deepseek-chat-v3-0324': 'https://logosandtypes.com/wp-content/uploads/2025/02/Deepseek.png'
};

export default function Library() {
  const router = useRouter();
  const [results, setResults] = useState([]);
  const [credits, setCredits] = useState(3);
  const [deletingId, setDeletingId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [toggleLoading, setToggleLoading] = useState({});

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      }
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    async function fetchEvals() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata && typeof user.user_metadata.credits === 'number') {
        setCredits(user.user_metadata.credits);
      } else {
        setCredits(3);
      }
      if (!user) return;
      const { data: evals, error } = await supabase.from('evals').select('*').eq('user_id', user.id);
      if (!error && evals) {
        // For each eval, fetch results
        const evalsWithResults = await Promise.all(evals.map(async (evalRow) => {
          const { data: results } = await supabase.from('eval_results').select('*').eq('eval_id', evalRow.id);
          let winner = null, winnerIcon = null, topPct = 0, trials = 0;
          let loser = null, loserIcon = null, lowPct = 0;
          if (results && results.length > 0) {
            // Find the model with the highest and lowest score
            const best = results.reduce((a, b) => (a.score > b.score ? a : b));
            const worst = results.reduce((a, b) => (a.score < b.score ? a : b));
            winner = best.model;
            winnerIcon = modelIcons[winner] || null;
            topPct = best.score;
            trials = best.trials;
            loser = worst.model;
            loserIcon = modelIcons[loser] || null;
            lowPct = worst.score;
          }
          return {
            ...evalRow,
            evalName: evalRow.title || 'Untitled',
            winner,
            winnerIcon,
            topPct,
            loser,
            loserIcon,
            lowPct,
            score: topPct,
            trials
          };
        }));
        setResults(evalsWithResults);
      }
    }
    fetchEvals();
  }, []);

  const handleDelete = async (evalId) => {
    setDeletingId(evalId);
    try {
      const session = await supabase.auth.getSession();
      await fetch(`/api/eval-title?eval_id=${evalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token}`
        }
      });
      setResults(results => results.filter(r => r.id !== evalId));
    } finally {
      setDeletingId(null);
      setShowConfirm(false);
      setToDelete(null);
    }
  };

  const filteredResults = results;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans flex flex-col pb-32">
      <Head>
        <title>LMEvals</title>
      </Head>
      <CustomNavbar />
      
      <div className="flex-1 flex flex-col items-center px-4 py-16 mt-28">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 px-2">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src="https://i.pinimg.com/736x/69/a5/60/69a5602fb6377d1fef9bb45e8db9e415.jpg"
                  className="w-14 h-14 rounded-full shadow-lg object-cover"
                  alt="Ethan Goodhart"
                />
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full shadow-sm" title="Online"></span>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight flex items-center gap-2">
                  Ethan Goodhart
                </h1>
                <div className={`mt-2 text-lg sm:text-xl font-bold ${credits > 0 ? 'text-blue-700' : 'text-red-600'}`}>
                  {credits}/3 credits
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
                title="Create new eval"
                onClick={() => router.push('/configure')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Eval
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold shadow hover:bg-red-700 transition"
                title="Logout"
                onClick={() => {
                  supabase.auth.signOut();
                  router.push('/');
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-8 px-2">
            <span className="text-base text-gray-500">{filteredResults.length} {filteredResults.length === 1 ? "eval" : "evals"}</span>
          </div>

          <div className="">
            {filteredResults.length === 0 ? (
              <div className="px-6 py-16 text-center bg-white rounded-md">
                <div className="flex flex-col items-center">
                  <svg className="w-12 h-12 text-gray-200 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  </svg>
                  <p className="text-xl text-gray-400 font-medium">No evals found</p>
                  <p className="text-sm text-gray-300 mt-1">Try a different search term.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredResults.map((row, index) => {
                  const evalName = row.evalName;
                  const createdBy = row.author || row.createdBy;
                  const winner = row.winner;
                  const winnerIcon = row.winnerIcon;
                  const topPct = (row.topPct * 100).toFixed(0);
                  const loser = row.loser;
                  const loserIcon = row.loserIcon;
                  const lowPct = (row.lowPct * 100).toFixed(0);

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.08 }}
                      className="group hover:bg-blue-50/40 transition-colors duration-200 px-6 py-7 sm:py-6 flex flex-col gap-2"
                    >
                      {/* Eval Name (like a search result title) */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`mr-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${row.is_public ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-500 border-gray-300'}`}>{row.is_public ? 'Public' : 'Private'}</span>
                        <span
                          role="button"
                          tabIndex={0}
                          className="text-xl sm:text-2xl font-medium text-gray-900 group-hover:underline cursor-pointer"
                          onClick={() => router.push(`/configure?eval_id=${row.id}`)}
                          onKeyPress={e => { if (e.key === 'Enter') router.push(`/configure?eval_id=${row.id}`); }}
                        >
                          {evalName}
                        </span>
                      </div>
                      {/* Prompt */}
                      <div className="text-gray-700 text-base sm:text-lg mt-0.5">
                        <span className="font-mono bg-gray-50 rounded px-2 py-1 text-gray-700 shadow-inner">{row.prompt}</span>
                      </div>
                      {/* Winner, Score, Trials */}
                      <div className="flex flex-wrap items-center gap-6 mt-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Best:</span>
                          <img
                            src={winnerIcon}
                            alt={winner}
                            className="w-7 h-7 rounded border border-gray-200 shadow-sm object-contain bg-white"
                          />
                          <span className="font-semibold text-gray-800">{winner}</span>
                          <span className="ml-2 text-green-700 font-bold">{topPct}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Worst:</span>
                          <img
                            src={loserIcon}
                            alt={loser}
                            className="w-7 h-7 rounded border border-gray-200 shadow-sm object-contain bg-white"
                          />
                          <span className="font-semibold text-gray-800">{loser}</span>
                          <span className="ml-2 text-red-700 font-bold">{lowPct}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Trials:</span>
                          <span className="font-semibold text-gray-800">{row.trials}</span>
                        </div>
                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            className={`ml-2 px-3 py-1 rounded text-xs font-semibold border transition-colors duration-200 ${row.is_public ? 'bg-gray-200 text-gray-600 border-gray-300 hover:bg-gray-300' : 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'} ${toggleLoading[row.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={!!toggleLoading[row.id]}
                            onClick={async (e) => {
                              e.stopPropagation();
                              setToggleLoading(prev => ({ ...prev, [row.id]: true }));
                              const session = await supabase.auth.getSession();
                              await fetch('/api/eval-title', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${session.data.session?.access_token}`
                                },
                                body: JSON.stringify({ eval_id: row.id, title: row.title, is_public: !row.is_public })
                              });
                              setResults(results => results.map(r => r.id === row.id ? { ...r, is_public: !row.is_public } : r));
                              setToggleLoading(prev => ({ ...prev, [row.id]: false }));
                            }}
                          >
                            {row.is_public ? 'Make private' : 'Publish'}
                          </button>
                          <button
                            className={`ml-auto px-3 py-1 rounded bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition disabled:opacity-50`}
                            disabled={deletingId === row.id}
                            onClick={() => { setShowConfirm(true); setToDelete(row.id); }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4">Are you sure you want to delete this eval?</h2>
            <div className="flex gap-4 justify-end">
              <button className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="px-4 py-2 rounded bg-red-600 text-white font-semibold" onClick={() => handleDelete(toDelete)} disabled={deletingId === toDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}