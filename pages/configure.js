import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Plus } from "lucide-react";
import CustomNavbar from "../components/CustomNavbar";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Configure() {
  const router = useRouter();

  const [prompt, setPrompt] = useState('');
  const [evalPrompt, setEvalPrompt] = useState('');
  const promptRef = useRef(null);
  const evalPromptRef = useRef(null);

  const [results, setResults] = useState([
    {
      model: "gpt-4o",
      icon: "https://static.vecteezy.com/system/resources/previews/021/059/827/non_2x/chatgpt-logo-chat-gpt-icon-on-white-background-free-vector.jpg",
      prompt: "How many r's in Strawberry?",
      trials: 0,
      score: 0
    },
    {
      model: "gemini-2.0-flash",
      icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Google_Favicon_2025.svg/330px-Google_Favicon_2025.svg.png",
      prompt: "How many r's in Strawberry?",
      trials: 0,
      score: 0
    },
    {
      model: "claude-3.5-sonnet",
      icon: "https://openrouter.ai/images/icons/Anthropic.svg",
      prompt: "How many r's in Strawberry?",
      trials: 0,
      score: 0
    },
    {
      model: "grok-3",
      icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcROcXRdeEoeB-Kl449XzrchCvGwxDaTRltKSg&s",
      prompt: "How many r's in Strawberry?",
      trials: 0,
      score: 0
    },
    {
      model: "llama-3.1-8b-instruct",
      icon: "https://res.cloudinary.com/apideck/image/upload/w_196,f_auto/v1677940393/marketplaces/ckhg56iu1mkpc0b66vj7fsj3o/listings/meta_nnmll6.webp",
      prompt: "How many r's in Strawberry?",
      trials: 0,
      score: 0
    },
    {
      model: "deepseek-r1",
      icon: "https://logosandtypes.com/wp-content/uploads/2025/02/Deepseek.png",
      prompt: "How many r's in Strawberry?",
      trials: 0,
      score: 0
    },
  ]);

  useEffect(() => {
    const prompt = router.query.prompt;
    if (prompt) {
      setPrompt(prompt);
    }

    if (!prompt) {
      promptRef.current.focus();
    } else {
      evalPromptRef.current.focus();
    }
  }, [router.query.prompt]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans flex flex-col pb-80">
      <Head>
        <title>LMEval</title>
      </Head>
      <CustomNavbar />

      <div className="flex-1 flex items-center justify-center" style={{ minHeight: '95vh' }}>
        <div className="max-w-xl w-full">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Create an eval</h1>
          {/* <p className="text-base text-gray-500 mb-10">Describe what to evaluate</p> */}

          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Models</label>
              <div className="flex">
                <img src="https://static.vecteezy.com/system/resources/previews/021/059/827/non_2x/chatgpt-logo-chat-gpt-icon-on-white-background-free-vector.jpg" className="w-7 h-7 border rounded-lg object-contain" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Google_Favicon_2025.svg/330px-Google_Favicon_2025.svg.png" className="w-7 h-7 border rounded-lg object-contain p-1" />
                <img src="https://openrouter.ai/images/icons/Anthropic.svg" className="w-7 h-7 border rounded-lg object-contain" />
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcROcXRdeEoeB-Kl449XzrchCvGwxDaTRltKSg&s" className="w-7 h-7 border rounded-lg object-contain" />
                <img src="https://res.cloudinary.com/apideck/image/upload/w_196,f_auto/v1677940393/marketplaces/ckhg56iu1mkpc0b66vj7fsj3o/listings/meta_nnmll6.webp" className="w-7 h-7 border rounded-lg object-contain" />
                <img src="https://logosandtypes.com/wp-content/uploads/2025/02/Deepseek.png" className="w-7 h-7 border rounded-lg object-contain" />
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
                className="w-full h-24 px-4 py-3 text-base rounded-lg border border-gray-300 focus:border-none focus:ring-2 focus:ring-blue-100 bg-white text-gray-900 placeholder-gray-400 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Evaluation</label>
              <textarea
                ref={evalPromptRef}
                value={evalPrompt}
                onChange={(e) => setEvalPrompt(e.target.value)}
                placeholder="eg. (three r's = 1, else = 0)"
                className="w-full h-24 px-4 py-3 text-base rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white text-gray-900 placeholder-gray-400 transition"
              />
            </div>
          </div>

          <div className="mt-8">
            <button
              disabled={!prompt || !evalPrompt}
              className={`w-full py-3 rounded-lg text-lg font-semibold transition-colors duration-200
                ${!prompt || !evalPrompt ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              Run
            </button>
          </div>
        </div>
      </div>

      {/* <div className="w-3/4 mx-auto overflow-hidden mt-12 mb-4">
        <h1 className="text-xl font-normal text-gray-500">Results</h1>
      </div> */}
      <div className="w-3/4 mx-auto border rounded-xl border-gray-200 overflow-hidden mt-12">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-8 py-5 text-left text-sm font-normal text-gray-500">Model</th> 
                <th className="px-8 py-5 text-left text-sm font-normal text-gray-500">Prompt</th>
                <th className="px-8 py-5 text-left text-sm font-normal text-gray-500">Trials</th>
                <th className="px-8 py-5 text-left text-sm font-normal text-gray-500">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center bg-white">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-200 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      </svg>
                      <p className="text-xl text-gray-400 font-medium">No results yet</p>
                      <p className="text-sm text-gray-300 mt-1">Run an evaluation to see results here.</p>
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
                    <td className="px-8 py-5 flex items-center gap-3">
                      <img
                        src={row.icon}
                        alt={row.model}
                        className="w-9 h-9 rounded-lg border border-gray-200 shadow-sm object-contain bg-white"
                      />
                      <span className="font-semibold text-gray-800 text-base">{row.model}</span>
                    </td>
                    <td className="px-8 py-5 text-gray-700 whitespace-pre-line text-base max-w-xs">
                      <span className="block bg-gray-50 rounded-lg px-3 py-2 text-gray-700 font-mono text-sm shadow-inner">{row.prompt}</span>
                    </td>
                    <td className="px-8 py-5">
                        {row.trials}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`ml-2 mr-1 font-bold text-base ${
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
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex flex-col md:flex-row gap-3 p-2">
          {/* Save as Draft */}
          <button
            type="button"
            disabled={!prompt || !evalPrompt}
            onClick={() => {
              // Save draft logic here
              alert("Your evaluation has been saved as a draft.");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-lg font-semibold transition-all duration-200 shadow-sm
              ${!prompt || !evalPrompt
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white text-blue-700 border border-blue-600 hover:bg-blue-50'}`}
          >
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Save to library
          </button>

          {/* Publish & Run */}
          <button
            type="button"
            disabled={!prompt || !evalPrompt}
            onClick={() => {
              // Publish logic here
              alert("Your evaluation has been published and is running!");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-lg font-semibold transition-all duration-200 shadow-sm
              ${!prompt || !evalPrompt
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600'}`}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l7-7 7 7" />
            </svg>
            Publish on LMEval
          </button>

          {/* Share to Twitter */}
          <button
            type="button"
            disabled={!prompt || !evalPrompt}
            onClick={() => {
              const text = encodeURIComponent(
                `Check out my new LLM evaluation: "${prompt}" on LMEval!`
              );
              const url = encodeURIComponent(window.location.href);
              window.open(
                `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
                "_blank"
              );
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-lg font-semibold transition-all duration-200 shadow-sm
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
    </div>
  );
}