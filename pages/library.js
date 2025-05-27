import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import CustomNavbar from "../components/CustomNavbar";
import Head from "next/head";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/router';
import { useUser } from "../context/UserContext";
import { ChevronUp } from 'lucide-react';

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

function OpenRouterTokenField({ user }) {
  const [input, setInput] = useState(user?.user_metadata?.openrouter_token || "");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setInput(user?.user_metadata?.openrouter_token || "");
  }, [user]);

  const saveToken = async () => {
    setSaving(true);
    setStatus("");
    const { error } = await supabase.auth.updateUser({
      data: { ...user.user_metadata, openrouter_token: input }
    });
    setSaving(false);
    setStatus(error ? "Failed to save token." : "Token saved!");
    if (!error) window.location.reload();
  };

  const removeToken = async () => {
    setSaving(true);
    setStatus("");
    const { error } = await supabase.auth.updateUser({
      data: { ...user.user_metadata, openrouter_token: null }
    });
    setSaving(false);
    setStatus(error ? "Failed to remove token." : "Token removed!");
    if (!error) window.location.reload();
  };

  return (
    <div className="flex flex-col gap-2 mt-2">
      <label className="text-sm font-medium text-gray-700">
        OpenRouter API Key (for unlimited credits):
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          className="border rounded px-2 py-1 flex-1"
          placeholder="sk-or-..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={saving}
        />
        <button
          className="px-3 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          onClick={saveToken}
          disabled={saving || !input}
        >
          Save
        </button>
        {user?.user_metadata?.openrouter_token && (
          <button
            className="px-3 py-1 rounded bg-gray-300 text-gray-700 font-semibold hover:bg-gray-400 transition"
            onClick={removeToken}
            disabled={saving}
          >
            Remove
          </button>
        )}
      </div>
      {status && <span className="text-xs text-gray-500">{status}</span>}
    </div>
  );
}

export default function Library() {
  const router = useRouter();
  const { user } = useUser();
  const [results, setResults] = useState([]);
  const [credits, setCredits] = useState(3);
  const [deletingId, setDeletingId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [toggleLoading, setToggleLoading] = useState({});
  const [showTokenField, setShowTokenField] = useState(false);
  const [upvotes, setUpvotes] = useState({}); // { [evalId]: { count, hasUpvoted, loading } }

  // Fetch upvotes for all evals
  async function fetchUpvotes(evalIds) {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const upvoteData = {};
    await Promise.all(evalIds.map(async (evalId) => {
      const res = await fetch(`/api/eval-upvote?eval_id=${evalId}`, { headers });
      const data = await res.json();
      upvoteData[evalId] = { count: data.count || 0, hasUpvoted: !!data.hasUpvoted, loading: false };
    }));
    setUpvotes(prev => ({ ...prev, ...upvoteData }));
  }

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/signup');
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
        setResults(evalsWithResults.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        fetchUpvotes(evals.map(e => e.id));
      }
    }
    fetchEvals();
    // eslint-disable-next-line
  }, [user]);

  // Upvote toggle handler
  const handleUpvote = async (evalId) => {
    setUpvotes(prev => ({ ...prev, [evalId]: { ...prev[evalId], loading: true } }));
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const hasUpvoted = upvotes[evalId]?.hasUpvoted;
    if (!user) return;
    if (hasUpvoted) {
      // Remove upvote
      await fetch(`/api/eval-upvote?eval_id=${evalId}`, { method: 'DELETE', headers });
      setUpvotes(prev => ({ ...prev, [evalId]: { ...prev[evalId], count: Math.max(0, prev[evalId].count - 1), hasUpvoted: false, loading: false } }));
    } else {
      // Add upvote
      await fetch(`/api/eval-upvote`, { method: 'POST', headers, body: JSON.stringify({ eval_id: evalId }) });
      setUpvotes(prev => ({ ...prev, [evalId]: { ...prev[evalId], count: (prev[evalId].count || 0) + 1, hasUpvoted: true, loading: false } }));
    }
  };

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
      {/* User Info Card Header */}
      <div className="w-full flex justify-center mt-32 px-2">
        <div className="w-full max-w-7xl rounded-2xl  flex flex-col sm:flex-row items-center gap-6 px-8 py-7 relative">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {user && (user.user_metadata?.avatar_url || user.email) ? (
              <img
                src={user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.email?.[0] || "U")}`}
                className="w-20 h-20 rounded-full border-0 border-white shadow-lg object-cover bg-gray-100"
                alt={user.user_metadata?.full_name || user.email || "User"}
                onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.email?.[0] || "U")}`; }}
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-600">
                {user && user.email ? user.email[0].toUpperCase() : "U"}
              </div>
            )}
            <span className="absolute bottom-2 right-2 w-5 h-5 bg-green-400 border-2 border-white rounded-full shadow" title="Online"></span>
          </div>
          {/* User Info & Credits */}
          <div className="flex-1 flex flex-col items-center sm:items-start gap-1">
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                {user && (user.user_metadata?.full_name || user.email) ? (user.user_metadata?.full_name || user.email) : "User"}
              </span>
              {user && user.email && (
                <span className="text-sm text-gray-400 font-medium mt-0.5">{user.email}</span>
              )}
            </div>
            {/* Credits Badge */}
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold shadow-sm border transition-colors duration-200 ${user?.user_metadata?.openrouter_token ? 'bg-green-50 text-green-700 border-green-200' : credits > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-600 border-red-200'}`}
                title={user?.user_metadata?.openrouter_token ? 'Using your own OpenRouter token for unlimited credits' : 'You have limited free credits'}
              >
                {user?.user_metadata?.openrouter_token ? (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    ∞ credits
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
                    {`${credits}/3 credits`}
                  </>
                )}
              </span>
              {/* Manage API Key Button */}
              <button
                className="ml-2 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200 hover:bg-gray-200 transition"
                onClick={() => setShowTokenField(v => !v)}
                type="button"
              >
                {showTokenField ? 'Hide API Key' : 'Add key for unlimited credits'}
              </button>
            </div>
            {/* Collapsible OpenRouter Token Field */}
            {showTokenField && (
              <div className="w-full mt-4 animate-fade-in">
                <OpenRouterTokenField user={user} />
              </div>
            )}
          </div>
          {/* Action Buttons */}
          <div className="flex sm:flex-col gap-3 sm:gap-4 sm:ml-8 items-center sm:items-end mt-6 sm:mt-0">
            <button
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition text-base"
              title="Create new eval"
              onClick={() => router.push('/configure')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="inline">New Eval</span>
            </button>
            <button
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-50 text-red-700 font-semibold border border-red-200 hover:bg-red-100 transition text-base"
              title="Logout"
              onClick={() => {
                supabase.auth.signOut();
                router.push('/');
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
      {/* End User Info Card Header */}
      <div className="flex-1 flex flex-col items-center px-4">
        <div className="w-full max-w-7xl mx-auto">
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
                  const upvote = upvotes[row.id] || { count: 0, hasUpvoted: false, loading: false };

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.08 }}
                      className="group hover:bg-blue-50/40 transition-colors duration-200 px-6 py-7 sm:py-6 flex flex-row gap-4 items-stretch"
                    >
                      {/* Upvote column */}
                      <div className="flex flex-col items-center justify-center mr-4 select-none">
                        <button
                          className={`flex flex-col items-center group/upvote focus:outline-none ${upvote.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          style={{ minWidth: 36 }}
                          disabled={upvote.loading || !user}
                          onClick={e => { e.stopPropagation(); handleUpvote(row.id); }}
                          title={user ? (upvote.hasUpvoted ? 'Remove upvote' : 'Upvote') : 'Login to upvote'}
                          aria-label={user ? (upvote.hasUpvoted ? 'Remove upvote' : 'Upvote') : 'Login to upvote'}
                        >
                          <ChevronUp
                            size={28}
                            strokeWidth={2.5}
                            className={`transition-colors duration-150 ${upvote.hasUpvoted ? 'text-blue-600 fill-blue-100' : 'text-gray-400 group-hover/upvote:text-blue-400'} ${upvote.loading ? 'opacity-50' : ''}`}
                            fill={upvote.hasUpvoted ? '#2563eb' : 'none'}
                          />
                          <span className={`text-lg font-semibold mt-0 ${upvote.hasUpvoted ? 'text-blue-700' : 'text-gray-500'}`}>{upvote.count}</span>
                        </button>
                      </div>
                      {/* Main content */}
                      <div className="flex-1 flex flex-col gap-2">
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