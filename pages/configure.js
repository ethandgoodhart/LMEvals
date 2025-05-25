import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Plus } from "lucide-react";
import CustomNavbar from "../components/CustomNavbar";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Configure() {
  const router = useRouter();

  const [prompt, setPrompt] = useState('');
  const [evalPrompt, setEvalPrompt] = useState('');
  const promptRef = useRef(null);
  const evalPromptRef = useRef(null);
  const resultsRef = useRef(null);
  const hasScrolledRef = useRef(false);
  const [title, setTitle] = useState('');
  const titleInputRef = useRef(null);
  const [evalId, setEvalId] = useState(null);
  const [titleUpdateStatus, setTitleUpdateStatus] = useState(null); // 'success' | 'error' | null
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCompletions, setModalCompletions] = useState([]);
  const [modalModel, setModalModel] = useState("");
  const [credits, setCredits] = useState(3);
  const [creditError, setCreditError] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const [results, setResults] = useState([
    {
      model: "openai/gpt-4o-mini",
      icon: "https://static.vecteezy.com/system/resources/previews/021/059/827/non_2x/chatgpt-logo-chat-gpt-icon-on-white-background-free-vector.jpg",
      trials: 0,
      score: 0
    },
    {
      model: "google/gemini-2.5-flash-preview-05-20",
      icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Google_Favicon_2025.svg/330px-Google_Favicon_2025.svg.png",
      trials: 0,
      score: 0
    },
    {
      model: "anthropic/claude-3.5-haiku",
      icon: "https://openrouter.ai/images/icons/Anthropic.svg",
      trials: 0,
      score: 0
    },
    {
      model: "x-ai/grok-3-mini-beta",
      icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcROcXRdeEoeB-Kl449XzrchCvGwxDaTRltKSg&s",
      trials: 0,
      score: 0
    },
    {
      model: "meta-llama/llama-3.3-70b-instruct",
      icon: "https://res.cloudinary.com/apideck/image/upload/w_196,f_auto/v1677940393/marketplaces/ckhg56iu1mkpc0b66vj7fsj3o/listings/meta_nnmll6.webp",
      trials: 0,
      score: 0
    }
  ]);

  useEffect(() => {
    async function maybeLoadEval() {
      const evalIdParam = router.query.eval_id;
      if (evalIdParam) {
        setEvalId(evalIdParam);
        // Fetch eval row
        const { data: evalRow, error: evalError } = await supabase.from('evals').select('*').eq('id', evalIdParam).single();
        if (!evalError && evalRow) {
          setPrompt(evalRow.prompt || '');
          setEvalPrompt(evalRow.eval_prompt || '');
          setTitle(evalRow.title || '');
          setIsPublic(!!evalRow.is_public);
          // Fetch results
          const { data: evalResults, error: resultsError } = await supabase.from('eval_results').select('*').eq('eval_id', evalIdParam);
          if (!resultsError && evalResults) {
            // Map results to the right format for the table
            const modelIconsMap = {
              'openai/gpt-4o-mini': 'https://static.vecteezy.com/system/resources/previews/021/059/827/non_2x/chatgpt-logo-chat-gpt-icon-on-white-background-free-vector.jpg',
              'google/gemini-2.5-flash-preview-05-20': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Google_Favicon_2025.svg/330px-Google_Favicon_2025.svg.png',
              'anthropic/claude-3.5-haiku': 'https://openrouter.ai/images/icons/Anthropic.svg',
              'x-ai/grok-3-mini-beta': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcROcXRdeEoeB-Kl449XzrchCvGwxDaTRltKSg&s',
              'meta-llama/llama-3.3-70b-instruct': 'https://res.cloudinary.com/apideck/image/upload/w_196,f_auto/v1677940393/marketplaces/ckhg56iu1mkpc0b66vj7fsj3o/listings/meta_nnmll6.webp',
            };
            const mappedResults = (evalRow.models || []).map(model => {
              const found = evalResults.find(r => r.model === model);
              return {
                model,
                icon: modelIconsMap[model] || '',
                prompt: prompt,
                trials: found ? found.trials : 0,
                score: found ? found.score : 0
              };
            });
            setResults(mappedResults);
          }
        }
      } else if (router.query.prompt) {
        setPrompt(router.query.prompt);
      }
      if (!router.query.prompt && !router.query.eval_id) {
        promptRef.current && promptRef.current.focus();
      } else {
        evalPromptRef.current && evalPromptRef.current.focus();
      }
    }
    maybeLoadEval();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.eval_id, router.query.prompt]);

  useEffect(() => {
    async function fetchCredits() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata && typeof user.user_metadata.credits === 'number') {
        setCredits(user.user_metadata.credits);
      } else {
        setCredits(3);
      }
    }
    fetchCredits();
  }, []);

  // Autoselect title input when scrolled into view
  useEffect(() => {
    const handleScroll = () => {
      if (titleInputRef.current) {
        const rect = titleInputRef.current.getBoundingClientRect();
        if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
          titleInputRef.current.select();
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update title in Supabase
  const updateTitle = async (newTitle) => {
    if (!evalId || !newTitle) return;
    try {
      const response = await fetch('/api/eval-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ eval_id: evalId, title: newTitle })
      });
      const data = await response.json();
      if (data.success) {
        setTitleUpdateStatus('success');
        setTimeout(() => setTitleUpdateStatus(null), 1200);
      } else {
        setTitleUpdateStatus('error');
        setTimeout(() => setTitleUpdateStatus(null), 1200);
      }
    } catch {
      setTitleUpdateStatus('error');
      setTimeout(() => setTitleUpdateStatus(null), 1200);
    }
  };

  const handleTitleBlur = (e) => {
    updateTitle(e.target.value);
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    // Optionally debounce updateTitle here for live updates
  };

  const handleRun = async (customTitle) => {
    if (credits <= 0) {
      setCreditError("You are out of credits. Please contact support or wait for more.");
      return;
    } else {
      setCreditError("");
    }
    setResults(results.map(r => ({ ...r, trials: 0, score: 0 })));
    hasScrolledRef.current = false;
    setEvalId(null); // Reset before new run
    const response = await fetch('/api/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({
        models: results.map(r => r.model),
        prompt,
        evalPrompt,
        title: customTitle || title
      })
    });
    if (!response.body) return;
    const reader = response.body.getReader();
    let decoder = new TextDecoder();
    let done = false;
    let newResults = [...results];
    let firstLine = true;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        const lines = decoder.decode(value).split('\n').filter(Boolean);
        for (const line of lines) {
          const result = JSON.parse(line);
          if (firstLine && result.eval_id) {
            setEvalId(result.eval_id);
            firstLine = false;
            continue;
          }
          const idx = newResults.findIndex(r => r.model === result.model);
          if (idx !== -1) {
            newResults[idx] = { ...newResults[idx], ...result };
          }
        }
        setResults([...newResults]);
        if (resultsRef.current && !hasScrolledRef.current) {
          resultsRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
          hasScrolledRef.current = true;
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans flex flex-col pb-20 sm:pb-40">
      <Head>
        <title>LMEvals</title>
      </Head>
      <CustomNavbar />

      <div className="flex-1 flex items-center justify-center px-12 sm:px-0" style={{ minHeight: '95vh' }}>
        <div className="w-full max-w-xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Create an eval</h1>
          {/* <p className="text-base text-gray-500 mb-10">Describe what to evaluate</p> */}

          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Models</label>
              <div className="flex flex-wrap gap-2">
                <img src="https://static.vecteezy.com/system/resources/previews/021/059/827/non_2x/chatgpt-logo-chat-gpt-icon-on-white-background-free-vector.jpg" className="w-7 h-7 border rounded-lg object-contain" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Google_Favicon_2025.svg/330px-Google_Favicon_2025.svg.png" className="w-7 h-7 border rounded-lg object-contain p-1" />
                <img src="https://openrouter.ai/images/icons/Anthropic.svg" className="w-7 h-7 border rounded-lg object-contain" />
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcROcXRdeEoeB-Kl449XzrchCvGwxDaTRltKSg&s" className="w-7 h-7 border rounded-lg object-contain" />
                <img src="https://res.cloudinary.com/apideck/image/upload/w_196,f_auto/v1677940393/marketplaces/ckhg56iu1mkpc0b66vj7fsj3o/listings/meta_nnmll6.webp" className="w-7 h-7 border rounded-lg object-contain" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prompt</label>
              <textarea
                ref={promptRef}
                value={prompt}
                autoFocus={true}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter a prompt eg. (How many r's in Strawberry?)"
                className="w-full h-24 px-3 sm:px-4 py-3 text-base rounded-lg border border-gray-300 focus:border-none focus:ring-2 focus:ring-blue-100 bg-white text-gray-900 placeholder-gray-400 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Evaluation</label>
              <textarea
                ref={evalPromptRef}
                value={evalPrompt}
                onChange={(e) => setEvalPrompt(e.target.value)}
                placeholder="eg. (three r's = 1, else = 0)"
                className="w-full h-24 px-3 sm:px-4 py-3 text-base rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white text-gray-900 placeholder-gray-400 transition"
              />
            </div>
          </div>

          <div className="mt-8">
            {creditError && (
              <div className="mb-2 text-red-600 font-semibold text-center">{creditError}</div>
            )}
            <button
              disabled={!prompt || !evalPrompt || credits <= 0}
              onClick={() => handleRun(title)}
              className={`w-full py-3 rounded-lg text-lg font-semibold transition-colors duration-200
                ${!prompt || !evalPrompt || credits <= 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              Run
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto flex flex-col px-12 sm:px-0 overflow-visible mt-8 sm:mt-12 mb-0">
        <input
          ref={titleInputRef}
          type="text"
          className="w-full border text-2xl sm:text-3xl border-none bg-transparent focus:outline-none focus:ring-0 rounded-lg px-3 sm:px-4 py-2 mb-4"
          placeholder="Untitled eval"
          value={title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          style={{
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
            borderRadius: '10px',
            padding: '10px',
            backgroundColor: 'rgba(0, 155, 255, 0.1)',
            width: 'fit-content',
            maxWidth: '100%',
          }}
          autoFocus
        />
        <div className="mb-2">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${isPublic ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 text-gray-500 border border-gray-300'}`}>
            {isPublic ? 'Public on LMEvals' : 'Private (only you can see)'}
          </span>
        </div>
      </div>
      <div
        ref={resultsRef}
        className="w-5/6 sm:w-full max-w-5xl border rounded-xl border-gray-200 mt-0 mx-auto bg-white"
      >
        {/* Desktop Table */}
        <div className="hidden sm:block">
          <table className="w-full min-w-[600px] text-sm sm:text-base">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-2 sm:px-8 py-3 sm:py-5 text-left text-xs sm:text-sm font-normal text-gray-500">Model</th>
                <th className="px-2 sm:px-8 py-3 sm:py-5 text-left text-xs sm:text-sm font-normal text-gray-500">Prompt</th>
                <th className="px-2 sm:px-8 py-3 sm:py-5 text-left text-xs sm:text-sm font-normal text-gray-500">Trials</th>
                <th className="px-2 sm:px-8 py-3 sm:py-5 text-left text-xs sm:text-sm font-normal text-gray-500">Score</th>
                <th className="px-2 sm:px-8 py-3 sm:py-5 text-left text-xs sm:text-sm font-normal text-gray-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 sm:px-6 py-10 sm:py-16 text-center bg-white">
                    <div className="flex flex-col items-center">
                      <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-200 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      </svg>
                      <p className="text-lg sm:text-xl text-gray-400 font-medium">No results yet</p>
                      <p className="text-xs sm:text-sm text-gray-300 mt-1">Run an evaluation to see results here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                results.map((row, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    className="hover:bg-blue-50/40 transition-colors duration-200"
                  >
                    <td className="px-2 sm:px-8 py-3 sm:py-5 flex items-center gap-2 sm:gap-3">
                      <img
                        src={row.icon}
                        alt={row.model}
                        className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg border border-gray-200 shadow-sm object-contain bg-white"
                      />
                      <span className="font-semibold text-gray-800 text-xs sm:text-base break-all">{row.model}</span>
                    </td>
                    <td className="px-2 sm:px-8 py-3 sm:py-5 text-gray-700 whitespace-pre-line text-xs sm:text-base max-w-[120px] sm:max-w-xs">
                      <span className="block bg-gray-50 rounded-lg px-2 sm:px-3 py-2 text-gray-700 font-mono text-xs sm:text-sm shadow-inner break-words">{prompt}</span>
                    </td>
                    <td className="px-2 sm:px-8 py-3 sm:py-5">
                      <span className="flex items-center gap-1 sm:gap-2">
                        {row.trials}
                        {row.trials < 5 && (
                          <svg className="animate-spin ml-1 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                          </svg>
                        )}
                      </span>
                    </td>
                    <td className="px-2 sm:px-8 py-3 sm:py-5">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span
                          className={`ml-1 mr-1 font-bold text-xs sm:text-base ${
                            row.score >= 0.7
                              ? "text-green-600"
                              : row.score >= 0.4
                              ? "text-yellow-600"
                              : "text-red-500"
                          }`}
                        >
                          {(row.score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-2 sm:px-8 py-3 sm:py-5">
                      <button
                        className={`bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-2 sm:py-3 w-24 sm:w-32 text-xs sm:text-sm rounded disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed`}
                        onClick={async () => {
                          if (!evalId || !row.model) return;
                          setModalModel(row.model);
                          setModalOpen(true);
                          // Use completions from state if trials < 5, else fetch from Supabase
                          if (row.trials < 5 && row.completions) {
                            setModalCompletions(row.completions);
                          } else {
                            // Fetch completions from Supabase
                            const { data: evalResults, error } = await supabase
                              .from('eval_results')
                              .select('completions')
                              .eq('eval_id', evalId)
                              .eq('model', row.model)
                              .single();
                            setModalCompletions((evalResults && evalResults.completions) || []);
                          }
                        }}
                        disabled={!evalId || !row.model || row.trials === 0}
                      >
                        View results
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Mobile Card List */}
        <div className="block sm:hidden">
          {results.length === 0 ? (
            <div className="flex flex-col items-center py-10 bg-white">
              <svg className="w-10 h-10 text-gray-200 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
              <p className="text-lg text-gray-400 font-medium">No results yet</p>
              <p className="text-xs text-gray-300 mt-1">Run an evaluation to see results here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 py-2">
              {results.map((row, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="rounded-lg border border-gray-100 bg-white shadow-sm px-3 py-2 flex items-center gap-3"
                  style={{ minHeight: 64 }}
                >
                  <img
                    src={row.icon}
                    alt={row.model}
                    className="w-8 h-8 rounded-lg border border-gray-200 object-contain bg-white flex-shrink-0"
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800 text-xs truncate">{row.model}</span>
                      <span
                        className={`font-bold text-xs ${
                          row.trials === 0
                            ? "text-gray-400"
                            : row.score >= 0.7
                            ? "text-green-600"
                            : row.score >= 0.4
                            ? "text-yellow-600"
                            : "text-red-500"
                        }`}
                      >
                        {row.trials === 0 ? "--" : `${(row.score * 100).toFixed(0)}%`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span
                        className="text-[10px] text-gray-500 font-mono bg-gray-50 rounded px-1 py-0.5 grow overflow-hidden whitespace-nowrap text-ellipsis"
                        style={{ minWidth: 0 }}
                        title={prompt}
                      >
                        {prompt}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-gray-500 font-medium ml-2">
                        <span className="bg-gray-100 rounded px-1 py-0.5">
                          {row.trials}/5
                        </span>
                        {row.trials < 5 && row.trials > 0 && (
                          <svg className="animate-spin ml-1 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                          </svg>
                        )}
                      </span>
                    </div>
                  </div>
                  <button
                    className={`ml-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold px-2 py-1 text-xs rounded disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed`}
                    style={{ minWidth: 0, width: 70 }}
                    onClick={async () => {
                      if (!evalId || !row.model) return;
                      setModalModel(row.model);
                      setModalOpen(true);
                      // Use completions from state if trials < 5, else fetch from Supabase
                      if (row.trials < 5 && row.completions) {
                        setModalCompletions(row.completions);
                      } else {
                        // Fetch completions from Supabase
                        const { data: evalResults, error } = await supabase
                          .from('eval_results')
                          .select('completions')
                          .eq('eval_id', evalId)
                          .eq('model', row.model)
                          .single();
                        setModalCompletions((evalResults && evalResults.completions) || []);
                      }
                    }}
                    disabled={!evalId || !row.model || row.trials === 0}
                  >
                    View
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col md:flex-row gap-3 p-2">
          <button
            type="button"
            disabled={!prompt || !evalPrompt}
            onClick={async () => {
              if (!evalId) return;
              await fetch('/api/eval-title', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                },
                body: JSON.stringify({ eval_id: evalId, title, is_public: true })
              });
              setIsPublic(true);
              alert('Your evaluation has been published and is now public on LMEvals!');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-base sm:text-lg font-semibold transition-all duration-200 shadow-sm
              ${!prompt || !evalPrompt ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600'}`}
          >
            <ArrowRight className="w-5 h-5" /> Publish on LMEvals
          </button>
          <button
            type="button"
            disabled={!prompt || !evalPrompt}
            onClick={() => {
              const text = encodeURIComponent(
                `Check out my new LLM evaluation: "${prompt}" on LMEvals!`
              );
              const url = encodeURIComponent(window.location.href);
              window.open(
                `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
                "_blank"
              );
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-base sm:text-lg font-semibold transition-all duration-200 shadow-sm
              ${!prompt || !evalPrompt
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#1DA1F2] text-white hover:bg-[#1A8CD8]'}`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <g>
                <path d="M22.46 5.924c-.793.352-1.645.59-2.54.698a4.48 4.48 0 001.963-2.475 8.94 8.94 0 01-2.828 1.082 4.48 4.48 0 00-7.635 4.086A12.72 12.72 0 013.11 4.86a4.48 4.48 0 001.388 5.976 4.44 4.44 0 01-2.03-.561v.057a4.48 4.48 0 003.593 4.393 4.48 4.48 0 01-2.025.077 4.48 4.48 0 004.184 3.11A8.98 8.98 0 012 19.54a12.68 12.68 0 006.88 2.018c8.26 0 12.78-6.84 12.78-12.78 0-.195-.004-.39-.013-.583A9.14 9.14 0 0024 4.59a8.93 8.93 0 01-2.54.698z"/>
              </g>
            </svg>
            Tweet
          </button>
        </div>
      </div>

      {/* Modal for completions */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-2 sm:px-0">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg sm:max-w-3xl p-3 sm:p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl font-bold"
              onClick={() => setModalOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-lg sm:text-xl font-bold mb-4">Answers for {modalModel}</h2>
            <ul className="space-y-2 sm:space-y-3 max-h-[50vh] overflow-y-auto">
              {modalCompletions.length === 0 ? (
                <li className="text-gray-500">No answers available.</li>
              ) : (
                modalCompletions.map((c, i) => (
                  <li key={i} className="bg-gray-50 rounded p-2 sm:p-3 border flex flex-col relative">
                    <div className="flex items-center mb-2">
                      <span
                        className={`text-base sm:text-lg font-bold px-2 sm:px-3 py-1 rounded-full mr-2 sm:mr-3
                          ${typeof c.score === 'number'
                            ? c.score >= 0.8
                              ? 'bg-green-100 text-green-700 border border-green-300'
                              : c.score >= 0.5
                                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                : 'bg-red-100 text-red-700 border border-red-300'
                            : 'bg-gray-200 text-gray-500 border border-gray-300'
                        }`}
                        title="Score"
                      >
                        {typeof c.score === 'number' ? (c.score * 100).toFixed(0) + '%' : c.score}
                      </span>
                    </div>
                    <span className="font-mono text-xs sm:text-sm text-gray-800 break-words">{c.answer}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}