import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useGuildStore } from "../../store/guildStore";
import { toast } from "sonner";

interface Props {
  onClose: () => void;
}

export default function CreateGuildModal({ onClose }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { addGuild, setActiveGuild } = useGuildStore();
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post("/guilds", { name: name.trim() });
      addGuild(data);
      setActiveGuild(data.id);
      navigate(`/app/guild/${data.id}`);
      onClose();
      toast.success("Server created");
    } catch {
      toast.error("Failed to create server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-zinc-100 font-semibold text-lg mb-4">
          Create Server
        </h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="Server name"
          className="w-full bg-zinc-800/60 border border-zinc-700/50 text-zinc-100
                     placeholder-zinc-600 rounded-xl px-4 py-2.5 text-sm
                     focus:outline-none focus:border-indigo-500 mb-5 transition-colors"
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200
                       bg-zinc-800/60 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="px-4 py-2 text-sm text-white font-medium bg-indigo-600
                       hover:bg-indigo-500 disabled:opacity-50 rounded-lg transition-colors"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
