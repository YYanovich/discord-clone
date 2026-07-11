import { useState } from "react";
import api from "../../api/axios";
import { useGuildStore } from "../../store/guildStore";

interface Props {
  onClose: () => void;
}

export default function CreateGuildModal({ onClose }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const addGuild = useGuildStore((s) => s.addGuild);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post("/guilds", { name });
      const { data: full } = await api.get(`/guilds/${data.id}`);
      addGuild(full);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-6 w-full max-w-sm shadow-2xl shadow-black/50 backdrop-blur-xl">
        <h2 className="text-white font-semibold text-lg mb-4 tracking-wide">
          Create server
        </h2>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Server name"
          className="w-full bg-zinc-900/60 text-white rounded-xl px-3.5 py-2.5 text-sm border border-zinc-800/80 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-300 mb-5 placeholder-zinc-600"
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-600/10 disabled:opacity-30 disabled:shadow-none transition-all duration-200"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
