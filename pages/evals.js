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

export default function BrowseEvals() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);

  // Sync searchTerm with query param
  useEffect(() => {
    if (router.isReady) {
      const search = router.query.search || "";
      setSearchTerm(typeof search === 'string' ? search : "");
    }
  }, [router.query.search, router.isReady]);

  useEffect(() => {
    async function fetchEvals() {
      let query = supabase.from('evals').select('*').eq('is_public', true);
      if (searchTerm) {
        query = query.textSearch('prompt', searchTerm).eq('is_public', true);
      }
      const { data: evals, error } = await query;
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
  }, [searchTerm]);

  const filteredResults = results;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans flex flex-col pb-32">
      <Head>
        <title>LMEvals</title>
      </Head>
      <CustomNavbar />
      
      <div className="flex-1 flex flex-col items-center py-16 mt-28">
        <div className="w-full max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 px-6">Browse evals</h1>
          <p className="text-base text-gray-500 mb-8 px-6">{filteredResults.length} results</p>

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
                        <span
                          role="button"
                          tabIndex={0}
                          className="text-xl sm:text-2xl font-medium text-gray-900 group-hover:underline cursor-pointer"
                          onClick={() => router.push(`/configure?eval_id=${row.id}`)}
                          onKeyPress={e => { if (e.key === 'Enter') router.push(`/configure?eval_id=${row.id}`); }}
                        >
                          {evalName}
                        </span>
                        <span className="ml-2 text-xs text-gray-400 bg-gray-100 rounded px-2 py-0.5">by {createdBy}</span>
                      </div>
                      {/* Prompt */}
                      <div className="text-gray-700 text-base sm:text-lg mt-0.5">
                        <span className="font-mono bg-gray-50 rounded px-2 py-1 text-gray-700 shadow-inner">{row.prompt}</span>
                      </div>
                      {/* Best, Worst, Trials */}
                      <div className="flex flex-wrap items-center gap-6 mt-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Best:</span>
                          <img src={winnerIcon} alt={winner} className="w-7 h-7 rounded border border-gray-200 shadow-sm object-contain bg-white" />
                          <span className="font-semibold text-gray-800">{winner}</span>
                          <span className="ml-2 text-green-700 font-bold">{topPct}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Worst:</span>
                          <img src={loserIcon} alt={loser} className="w-7 h-7 rounded border border-gray-200 shadow-sm object-contain bg-white" />
                          <span className="font-semibold text-gray-800">{loser}</span>
                          <span className="ml-2 text-red-700 font-bold">{lowPct}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Trials:</span>
                          <span className="font-semibold text-gray-800">{row.trials}</span>
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
    </div>
  );
}