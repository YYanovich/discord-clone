import { useAuthStore } from "../../store/authStore";
import { useGuildStore } from "../../store/guildStore";
import { useSocketStore } from "../../store/socketStore";

export default function MemberList() {
  const { members, presence } = useGuildStore();
  const currentUser = useAuthStore((state) => state.user);
  const isSocketConnected = useSocketStore((state) => state.isConnected);
  const currentUserId = currentUser?.id ?? null;
  const currentUserName = currentUser?.username ?? null;

  const isSelf = (member: {
    userId: string;
    user: { id: string; username: string };
  }) =>
    member.userId === currentUserId ||
    member.user.id === currentUserId ||
    member.user.username === currentUserName;

  const online = members.filter(
    (m) => presence[m.userId] === "online" || (isSocketConnected && isSelf(m)),
  );
  const offline = members.filter(
    (m) => presence[m.userId] !== "online" && !(isSocketConnected && isSelf(m)),
  );

  return (
    <div className="w-60 bg-zinc-950/60 border-l border-zinc-800/80 overflow-y-auto py-4 px-2 shrink-0 backdrop-blur-xl">
      <div className="px-3 mb-4">
        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
          Members — {members.length}
        </p>
      </div>

      {online.length > 0 && (
        <div className="mb-5">
          <p className="px-3 text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
            Online — {online.length}
          </p>
          <div className="space-y-0.5">
            {online.map((m) => (
              <div
                key={m.id}
                className="px-3 py-1.5 flex items-center gap-3 rounded-xl hover:bg-zinc-800/30 transition-all duration-200 group"
              >
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-full from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {m.user.username?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-zinc-950" />
                </div>
                <span className="text-zinc-300 group-hover:text-zinc-100 text-sm font-medium truncate">
                  {m.user.username}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {offline.length > 0 && (
        <div>
          <p className="px-3 text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
            Offline — {offline.length}
          </p>
          <div className="space-y-0.5">
            {offline.map((m) => (
              <div
                key={m.id}
                className="px-3 py-1.5 flex items-center gap-3 rounded-xl hover:bg-zinc-800/20 transition-all duration-200 opacity-60 hover:opacity-90 group"
              >
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-zinc-400 text-xs font-bold">
                    {m.user.username?.[0]?.toUpperCase() ?? "?"}
                  </div>
                </div>
                <span className="text-zinc-400 group-hover:text-zinc-300 text-sm font-medium truncate">
                  {m.user.username}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
