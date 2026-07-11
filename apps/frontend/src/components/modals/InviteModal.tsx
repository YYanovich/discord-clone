import { useState } from "react";
import api from "../../api/axios";

interface Props {
  guildId: string;
  onClose: () => void;
}

interface IInvite {
  code: string;
  expiresAt: string | null;
  maxUses: number | null;
  uses: number;
}

export default function InviteModal({ guildId, onClose }: Props) {
  const [invite, setInvite] = useState<IInvite | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState<number | null>(24);
  const [maxUses, setMaxUses] = useState<number | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data } = await api.post<IInvite>(`/guilds/${guildId}/invite`, {
        expiresInHours,
        maxUses,
      });
      setInvite(data);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!invite) return;
    navigator.clipboard.writeText(invite.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-zinc-100 font-semibold text-lg mb-1">
          Invite People
        </h2>
        <p className="text-zinc-500 text-sm mb-5">
          Share an invite code to let others join
        </p>

        {!invite ? (
          <>
            <div className="mb-4">
              <label className="text-zinc-400 text-xs font-medium uppercase tracking-wide block mb-2">
                Expires after
              </label>
              <div className="flex gap-2 flex-wrap">
                {[null, 1, 12, 24, 168].map((hours) => (
                  <button
                    key={String(hours)}
                    onClick={() => setExpiresInHours(hours)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      expiresInHours === hours
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-zinc-800/60 border-zinc-700/50 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {hours === null
                      ? "Never"
                      : hours === 1
                        ? "1 hour"
                        : hours === 12
                          ? "12 hours"
                          : hours === 24
                            ? "1 day"
                            : "7 days"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="text-zinc-400 text-xs font-medium uppercase tracking-wide block mb-2">
                Max uses
              </label>
              <div className="flex gap-2 flex-wrap">
                {[null, 1, 5, 10, 25, 100].map((uses) => (
                  <button
                    key={String(uses)}
                    onClick={() => setMaxUses(uses)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      maxUses === uses
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-zinc-800/60 border-zinc-700/50 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {uses === null ? "Unlimited" : uses}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm text-zinc-400 bg-zinc-800/60 border border-zinc-700/50 transition-colors hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm text-white font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                {loading ? "Generating..." : "Generate Link"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-4 mb-4">
              <p className="text-zinc-500 text-xs mb-2">Invite code</p>
              <p className="text-zinc-100 font-mono text-lg font-bold tracking-widest">
                {invite.code}
              </p>
              {invite.expiresAt && (
                <p className="text-zinc-600 text-xs mt-2">
                  Expires: {new Date(invite.expiresAt).toLocaleString()}
                </p>
              )}
              {invite.maxUses && (
                <p className="text-zinc-600 text-xs">
                  Max uses: {invite.maxUses}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setInvite(null)}
                className="flex-1 py-2.5 rounded-xl text-sm text-zinc-400 bg-zinc-800/60 border border-zinc-700/50 transition-colors hover:text-zinc-200"
              >
                New Code
              </button>
              <button
                onClick={handleCopy}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  copied
                    ? "bg-green-600 text-white"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }`}
              >
                {copied ? "Copied!" : "Copy Code"}
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-2 py-2 text-zinc-500 text-sm hover:text-zinc-300 transition-colors"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
