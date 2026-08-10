import { useState } from "react";
import type { RefObject } from "react";
import type { Socket } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useGuildStore } from "../../store/guildStore";
import api from "../../api/axios";
import CreateGuildModal from "../modals/CreateGuildModal";
import JoinGuildModal from "../modals/JoinGuildModal";

interface Props {
  socketRef: RefObject<Socket | null>;
}

export default function GuildSidebar({ socketRef }: Props) {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { guilds, activeGuildId, setActiveGuild } = useGuildStore();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      logout();
      navigate("/login");
    }
  };

  //navigate through URL
  const handleSelectGuild = (guildId: string) => {
    setActiveGuild(guildId);
    navigate(`/app/guild/${guildId}`);
    socketRef.current?.emit("guild:join", { guildId });
  };

  return (
    <>
      <div className="w-18 bg-zinc-950/60 backdrop-blur-xl border-r border-zinc-800/80 flex flex-col items-center py-3 gap-2 overflow-y-auto shrink-0">
        {guilds.map((guild) => {
          const isActive = activeGuildId === guild.id;
          return (
            <button
              key={guild.id}
              onClick={() => handleSelectGuild(guild.id)}
              title={guild.name}
              className={`relative w-12 h-12 flex items-center justify-center text-white font-bold text-sm overflow-hidden transition-all duration-300 cursor-pointer
                ${
                  isActive
                    ? "rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/30"
                    : "rounded-full bg-zinc-800 hover:rounded-2xl hover:bg-indigo-500"
                }
              `}
            >
              <span
                className={`absolute left-0 w-1 bg-white rounded-r-fulltransition-all duration-300 ${isActive ? "h-8" : "h-0"}`}
              />
              {guild.iconUrl ? (
                <img
                  src={guild.iconUrl}
                  alt={guild.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                guild.name[0].toUpperCase()
              )}
            </button>
          );
        })}

        <div className="w-8 h-px bg-zinc-700/80 my-1 shrink-0" />

        <button
          onClick={() => setShowCreate(true)}
          title="Create server"
          className="w-12 h-12 rounded-full bg-zinc-800 hover:rounded-2xl hover:bg-green-600 flex items-center justify-center text-green-400 hover:text-white text-xl font-light transition-all duration-300 cursor-pointer shrink-0"
        >
          +
        </button>

        <button
          onClick={() => setShowJoin(true)}
          title="Join by code"
          className="w-12 h-12 rounded-full bg-zinc-800 hover:rounded-2xl hover:bg-blue-600 flex items-center justify-center text-blue-400 hover:text-white text-sm font-bold transition-all duration-300 cursor-pointer shrink-0"
        >
          #
        </button>
        <div className="flex-1" />

        <button
          onClick={handleLogout}
          title="Logout"
          className="w-10 h-10 rounded-full bg-zinc-800/80 hover:bg-red-900/60 flex items-center justify-center text-zinc-500 hover:text-red-400 transition-all duration-200 cursor-pointer shrink-0 mb-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>

      {showCreate && <CreateGuildModal onClose={() => setShowCreate(false)} />}
      {showJoin && <JoinGuildModal onClose={() => setShowJoin(false)} />}
    </>
  );
}
