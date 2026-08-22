import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGuildStore } from "../store/guildStore";
import { useSocketStore } from "../store/socketStore";
import api from "../api/axios";

export function useAppBootstrap(
  urlGuildId: string | undefined,
  urlChannelId: string | undefined,
  socketRef: any
) {
  const navigate = useNavigate();
  const { setGuilds, activeGuildId, setActiveGuild, setActiveChannel, setMembers, hydrateFromCache, guilds } = useGuildStore();
  const isSocketConnected = useSocketStore((s) => s.isConnected);

  useEffect(() => {
    hydrateFromCache();
  }, [hydrateFromCache]);

  useEffect(() => {
    const controller = new AbortController();
    api.get("/guilds", { signal: controller.signal })
      .then(async ({ data }) => {
        if (!data.length) return;
        const fullGuilds = await Promise.all(
          (data as { id: string }[]).map((g) =>
            api.get(`/guilds/${g.id}`, { signal: controller.signal }).then((r) => r.data)
          )
        );
        setGuilds(fullGuilds);

        const targetGuildId = urlGuildId && fullGuilds.some((g: { id: string }) => g.id === urlGuildId)
          ? urlGuildId
          : fullGuilds[0]?.id;

        if (targetGuildId) {
          setActiveGuild(targetGuildId);
          if (!urlGuildId) {
            navigate(`/app/guild/${targetGuildId}`, { replace: true });
          }
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [urlGuildId, navigate, setGuilds, setActiveGuild]);

  useEffect(() => {
    if (!activeGuildId) return;
    const controller = new AbortController();

    api.get(`/guilds/${activeGuildId}/members`, { signal: controller.signal })
      .then(({ data }) => setMembers(activeGuildId, data))
      .catch(() => {});

    const currentGuild = guilds.find((g) => g.id === activeGuildId);
    if (!currentGuild?.channels?.length) {
      api.get(`/guilds/${activeGuildId}`, { signal: controller.signal })
        .then(({ data }) => setGuilds([data]))
        .catch(() => {});
    }
    return () => controller.abort();
  }, [activeGuildId, guilds, setMembers, setGuilds]);

  useEffect(() => {
    if (urlChannelId) {
      setActiveChannel(urlChannelId);
    }
  }, [urlChannelId, setActiveChannel]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !isSocketConnected || !activeGuildId) return;
    
    socket.emit("guild:join", { guildId: activeGuildId });
    
    return () => {
      socket.emit("guild:leave", { guildId: activeGuildId });
    };
  }, [activeGuildId, isSocketConnected, socketRef]);
}