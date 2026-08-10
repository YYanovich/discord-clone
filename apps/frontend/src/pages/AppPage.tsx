import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGuildStore } from "../store/guildStore";
import { useSocket } from "../hooks/useSocket";
import { useSocketStore } from "../store/socketStore";
import api from "../api/axios";
import GuildSidebar from "../components/layout/GuildSidebar";
import ChannelSidebar from "../components/layout/ChannelSidebar";
import ChatArea from "../components/layout/ChatArea";
import MemberList from "../components/layout/MemberList";

export default function AppPage() {
  const { guildId: urlGuildId, channelId: urlChannelId } = useParams<{
    guildId?: string;
    channelId?: string;
  }>();
  const navigate = useNavigate();
  const {
    setGuilds,
    activeGuildId,
    setActiveGuild,
    setActiveChannel,
    setMembers,
    hydrateFromCache,
    guilds,
  } = useGuildStore();

  const socketRef = useSocket();
  const isSocketConnected = useSocketStore((s) => s.isConnected);

  //hydrate cache during first mounting
  useEffect(() => {
    hydrateFromCache();
  }, []);
//loading guild from backend and select target which is active
  useEffect(() => {
    const controller = new AbortController();

    api
      .get("/guilds", { signal: controller.signal })
      .then(async ({ data }) => {
        if (!data.length) return;

        const fullGuilds = await Promise.all(
          (data as { id: string }[]).map((g) =>
            api
              .get(`/guilds/${g.id}`, { signal: controller.signal })
              .then((r) => r.data)
          )
        );

        setGuilds(fullGuilds);

        const targetGuildId =
          urlGuildId &&
          fullGuilds.some((g: { id: string }) => g.id === urlGuildId)
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
  }, []); 

//load members after guild loaded
  useEffect(() => {
    if (!activeGuildId) return;
    const controller = new AbortController();

    api
      .get(`/guilds/${activeGuildId}/members`, { signal: controller.signal })
      .then(({ data }) => setMembers(activeGuildId, data))
      .catch(() => {});

    //update guild if channel data is empty
    const currentGuild = guilds.find((g) => g.id === activeGuildId);
    if (!currentGuild?.channels?.length) {
      api
        .get(`/guilds/${activeGuildId}`, { signal: controller.signal })
        .then(({ data }) => setGuilds([data]))
        .catch(() => {});
    }

    return () => controller.abort();
  }, [activeGuildId]);

//get channel url
  useEffect(() => {
    if (urlChannelId) {
      setActiveChannel(urlChannelId);
    }
  }, [urlChannelId]);

  //join to guild when socket will be connected
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !isSocketConnected || !activeGuildId) return;
    socket.emit("guild:join", { guildId: activeGuildId });
  }, [activeGuildId, isSocketConnected]);

  return (
    <div className="h-screen bg-zinc-950 flex overflow-hidden">
      <GuildSidebar socketRef={socketRef} />
      <ChannelSidebar socketRef={socketRef} />
      <ChatArea socketRef={socketRef} />
      <MemberList />
    </div>
  );
}