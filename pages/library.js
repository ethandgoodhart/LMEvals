import { useState } from "react";
import { motion } from "framer-motion";
import CustomNavbar from "../components/CustomNavbar";
import Head from "next/head";

export default function Library() {
  const [results] = useState([]);

  const filteredResults = [
    {
      evalName: "Test",
      createdBy: "alice",
      prompt: "How many r's in Strawberry?",
      trials: 10,
      winner: "gpt-4o",
      winnerIcon: "https://static.vecteezy.com/system/resources/previews/021/059/827/non_2x/chatgpt-logo-chat-gpt-icon-on-white-background-free-vector.jpg",
      topPct: 0.8,
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans flex flex-col pb-32">
      <Head>
        <title>LMEval</title>
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
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
                title="Create new eval"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Eval
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
                  const createdBy = row.createdBy;
                  const winner = row.winner;
                  const winnerIcon = row.winnerIcon;
                  const topPct = (row.topPct * 100).toFixed(0);

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
                        <a
                          href="#"
                          className="text-xl sm:text-2xl font-medium text-gray-900 group-hover:underline"
                        >
                          {evalName}
                        </a>
                        <span className="ml-2 text-xs text-gray-400 bg-gray-100 rounded px-2 py-0.5">by {createdBy}</span>
                      </div>
                      {/* Prompt */}
                      <div className="text-gray-700 text-base sm:text-lg mt-0.5">
                        <span className="font-mono bg-gray-50 rounded px-2 py-1 text-gray-700 shadow-inner">{row.prompt}</span>
                      </div>
                      {/* Winner, Score, Trials */}
                      <div className="flex flex-wrap items-center gap-6 mt-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Winner:</span>
                          <img
                            src={winnerIcon}
                            alt={winner}
                            className="w-7 h-7 rounded border border-gray-200 shadow-sm object-contain bg-white"
                          />
                          <span className="font-semibold text-gray-800">{winner}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Score:</span>
                          <span
                            className={`font-bold ${
                              row.score >= 0.7
                                ? "text-green-600"
                                : row.score >= 0.4
                                ? "text-yellow-600"
                                : "text-red-500"
                            }`}
                          >
                            {topPct}%
                          </span>
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