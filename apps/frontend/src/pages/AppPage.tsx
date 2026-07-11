import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useGuildStore } from "../store/guildStore";
import { useSocket } from "../hooks/useSocket";
import { useSocketStore } from "../store/socketStore";
import api from "../api/axios";
import GuildSidebar from "../components/layout/GuildSidebar";
import ChannelSidebar from "../components/layout/ChannelSidebar";
import ChatArea from "../components/layout/ChatArea";
import MemberList from "../components/layout/MemberList";

export default function AppPage() {
  const currentUser = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const {
    setGuilds,
    activeGuildId,
    setActiveGuild,
    setMembers,
    activeChannelId,
    hydrateFromCache,
  } = useGuildStore();

  const socketRef = useSocket();
  const isSocketConnected = useSocketStore((state) => state.isConnected);

  useEffect(() => {
    hydrateFromCache();
  }, []);

  useEffect(() => {
    if (isAuthLoading || !accessToken) return;

    let cancelled = false;
    const cachedActiveGuildId = useGuildStore.getState().activeGuildId;

    api.get("/guilds").then(async ({ data }) => {
      if (cancelled || !data.length) return;

      const fullGuilds = await Promise.all(
        (data as { id: string }[]).map((g) =>
          api.get(`/guilds/${g.id}`).then((r) => r.data),
        ),
      );

      if (cancelled) return;

      setGuilds(fullGuilds);

      const targetGuildId =
        cachedActiveGuildId &&
        fullGuilds.some((g: { id: string }) => g.id === cachedActiveGuildId)
          ? cachedActiveGuildId
          : fullGuilds[0]?.id;

      if (targetGuildId) {
        setActiveGuild(targetGuildId);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [accessToken, isAuthLoading]);

  useEffect(() => {
    if (!activeGuildId || isAuthLoading || !accessToken) return;
    let cancelled = false;

    api.get(`/guilds/${activeGuildId}/members`).then(({ data }) => {
      if (cancelled) return;
      setMembers(activeGuildId, data);
    });

    const currentGuild = useGuildStore
      .getState()
      .guilds.find((g) => g.id === activeGuildId);
    if (!currentGuild?.channels?.length) {
      api.get(`/guilds/${activeGuildId}`).then(({ data }) => {
        if (cancelled) return;
        setGuilds([data]);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [activeGuildId, accessToken, isAuthLoading]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !isSocketConnected || !activeGuildId) return;

    socket.emit("guild:join", { guildId: activeGuildId });

    if (activeChannelId) {
      socket.emit("channel:join", {
        channelId: activeChannelId,
        guildId: activeGuildId,
        userId: currentUser?.id,
      });
    }
  }, [activeGuildId, activeChannelId, currentUser?.id, isSocketConnected]);

  return (
    <div className="h-screen bg-zinc-950 flex overflow-hidden">
      <GuildSidebar socketRef={socketRef} />
      <ChannelSidebar socketRef={socketRef} />
      <ChatArea socketRef={socketRef} />
      <MemberList />
    </div>
  );
}
