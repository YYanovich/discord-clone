import { useState, useEffect, useRef } from "react";
import { useGuildStore } from "../../store/guildStore";
import { HighlightedText } from "../search/HighLightedText";
import { MessageTime } from "../layout/MessageTime";
import api from "../../api/axios";

interface ISearchResult {
  messageId: string;
  content: string;
  channelId: string;
  authorId: string;
  createdAt: string;
  highlight?: string;
}

interface ISearchModal {
  guildId: string;
  onClose: () => void;
}

export default function SearchModal({ guildId, onClose }: ISearchModal) {
  const { members } = useGuildStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ISearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setTotal(0);
      setSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async (p = 1) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.get("/search/messages", {
        params: { q: query.trim(), guildId, page: p, limit: 20 },
      });
      setResults(p === 1 ? data.hits : [...results, ...data.hits]);
      setTotal(data.total);
      setPage(p);
      setSearched(true);
    } catch {
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const getMemberName = (authorId: string) =>
    members.find((m) => m.userId === authorId || m.user?.id === authorId)?.user
      .username ?? "User";

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 pt-20 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[70vh] overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/80">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4 text-zinc-400 shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages..."
            className="flex-1 bg-transparent text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none"
          />
          
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded"
              title="Clear text"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}

          <div className="h-4 w-px bg-zinc-800" />

          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 transition-colors p-1"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {searched && (
          <div className="px-4 py-2 border-b border-zinc-800/40 bg-zinc-900/50 flex items-center justify-between">
            <span className="text-zinc-400 text-xs font-medium">
              {loading ? "Searching..." : total === 0 ? "No results found" : `Found ${total} ${total === 1 ? "result" : "results"}`}
            </span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-600">
          {results.map((result) => (
            <div
              key={result.messageId}
              className="px-4 py-3 border-b border-zinc-800/30 hover:bg-zinc-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                  {getMemberName(result.authorId)[0]?.toUpperCase()}
                </div>
                <span className="text-zinc-300 text-xs font-semibold">
                  {getMemberName(result.authorId)}
                </span>
                <MessageTime createdAt={result.createdAt} />
              </div>
              <div className="text-sm text-zinc-300 pl-7">
                <HighlightedText
                  highlight={result.highlight}
                  fallback={result.content}
                />
              </div>
            </div>
          ))}

          {results.length > 0 && results.length < total && (
            <div className="p-3 text-center">
              <button
                onClick={() => handleSearch(page + 1)}
                disabled={loading}
                className="text-indigo-400 hover:text-indigo-300 text-xs font-medium disabled:opacity-50 transition-colors py-1 px-3 rounded-lg hover:bg-indigo-500/10"
              >
                {loading ? "Loading..." : "Load more results"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}