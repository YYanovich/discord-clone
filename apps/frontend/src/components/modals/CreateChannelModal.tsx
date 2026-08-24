import { useState } from "react";
import api from "../../api/axios";
import { useGuildStore } from "../../store/guildStore";
import type { IChannel } from "../../store/guildStore";

interface Props {
  guildId: string;
  onClose: () => void;
}

export default function CreateChannelModal({ guildId, onClose }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"TEXT" | "VOICE">("TEXT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { guilds, setGuilds } = useGuildStore();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    try {
      const { data } = await api.post<IChannel>(`/guilds/${guildId}/channels`, {
        name: name.trim(),
        type,
      });

      const updated = guilds.map((g) => {
        if (g.id === guildId) {
          return { ...g, channels: [...(g.channels || []), data] };
        }
        return g;
      });
      
      setGuilds(updated);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to create channel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-zinc-100 font-semibold text-lg mb-1">
          Create Channel
        </h2>
        <p className="text-zinc-500 text-sm mb-5">
          Add a new channel to your server
        </p>

        {error && (
          <p className="text-red-400 text-xs mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setType("TEXT")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              type === "TEXT"
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "bg-zinc-800/60 border-zinc-700/50 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Text
          </button>
          <button
            onClick={() => setType("VOICE")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              type === "VOICE"
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "bg-zinc-800/60 border-zinc-700/50 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Voice
          </button>
        </div>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="channel name"
          className="w-full bg-zinc-800/60 border border-zinc-700/50 text-zinc-100 placeholder-zinc-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 mb-5 transition-colors"
        />

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 bg-zinc-800/60 border border-zinc-700/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm text-white font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
