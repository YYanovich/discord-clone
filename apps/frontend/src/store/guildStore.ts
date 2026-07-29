import { create } from "zustand";

export interface IChannel {
  id: string;
  name: string;
  type: "TEXT" | "VOICE";
  categoryId: string | null;
  position: number;
}

export interface ICategory {
  id: string;
  name: string;
  position: number;
}

export interface IGuild {
  id: string;
  name: string;
  ownerId: string;
  iconUrl: string | null;
  channels: IChannel[];
  categories: ICategory[];
}

export interface IMessage {
  id: string;
  content: string;
  channelId: string;
  authorId: string;
  createdAt: string;
}

export interface IMember {
  id: string;
  userId: string;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

type PresenceMap = Record<string, "online" | "offline">;
type MessageMap = Record<string, IMessage[]>;
type MemberMap = Record<string, IMember[]>;

const MESSAGE_CACHE_LIMIT = 50;

interface FullCache {
  activeGuildId: string | null;
  activeChannelId: string | null;
  guilds: IGuild[];
  messagesByChannel: MessageMap;
  membersByGuild: MemberMap;
}

const CACHE_KEY = "discord-clone:cache-v1";

const normalizeId = (value: string) => value.trim().toLowerCase();

const pickInitialChannelId = (guild: IGuild | undefined): string | null => {
  if (!guild) return null;
  const sorted = [...(guild.channels ?? [])].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return a.name.localeCompare(b.name);
  });
  return sorted.find((ch) => ch.type === "TEXT")?.id ?? sorted[0]?.id ?? null;
};

const mergeGuild = (
  existing: IGuild | undefined,
  incoming: IGuild,
): IGuild => ({
  ...incoming,
  channels:
    incoming.channels?.length > 0
      ? incoming.channels
      : (existing?.channels ?? []),
  categories:
    incoming.categories?.length > 0
      ? incoming.categories
      : (existing?.categories ?? []),
});

const trimMessages = (messages: IMessage[]): IMessage[] =>
  messages.filter((m) => !m.id.startsWith("temp-")).slice(-MESSAGE_CACHE_LIMIT);

const readCache = (): FullCache | null => {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FullCache;
  } catch {
    return null;
  }
};

const writeCache = (state: GuildState) => {
  try {
    const trimmedMessages: MessageMap = {};
    for (const [channelId, msgs] of Object.entries(state.messagesByChannel)) {
      trimmedMessages[channelId] = trimMessages(msgs);
    }

    const cache: FullCache = {
      activeGuildId: state.activeGuildId,
      activeChannelId: state.activeChannelId,
      guilds: state.guilds,
      messagesByChannel: trimmedMessages,
      membersByGuild: state.membersByGuild,
    };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
};

interface GuildState {
  guilds: IGuild[];
  activeGuildId: string | null;
  activeChannelId: string | null;
  messagesByChannel: MessageMap;
  membersByGuild: MemberMap;
  messages: IMessage[];
  members: IMember[];
  presence: PresenceMap;
  typingUsers: string[];

  setGuilds: (guilds: IGuild[]) => void;
  addGuild: (guild: IGuild) => void;
  setActiveGuild: (guildId: string) => void;
  setActiveChannel: (channelId: string) => void;
  setMessages: (channelId: string, messages: IMessage[]) => void;
  addMessage: (message: IMessage) => void;
  setMembers: (guildId: string, members: IMember[]) => void;
  hydrateFromCache: () => FullCache | null;
  resetSessionState: () => void;
  updatePresence: (userId: string, status: "online" | "offline") => void;
  setTyping: (userId: string, isTyping: boolean) => void;
}

export const useGuildStore = create<GuildState>((set) => ({
  guilds: [],
  activeGuildId: null,
  activeChannelId: null,
  messagesByChannel: {},
  membersByGuild: {},
  messages: [],
  members: [],
  presence: {},
  typingUsers: [],

  setGuilds: (newGuilds) =>
    set((state) => {
      const incoming = newGuilds ?? [];
      const merged = [
        ...state.guilds.map((existing) => {
          const found = incoming.find((g) => g.id === existing.id);
          return found ? mergeGuild(existing, found) : existing;
        }),
        ...incoming
          .filter((g) => !state.guilds.some((e) => e.id === g.id))
          .map((g) => mergeGuild(undefined, g)),
      ];

      const activeGuild = state.activeGuildId
        ? merged.find((g) => g.id === state.activeGuildId)
        : undefined;
      const channelStillExists =
        state.activeChannelId && activeGuild?.channels
          ? activeGuild.channels.some((ch) => ch.id === state.activeChannelId)
          : false;
      const nextChannelId = channelStillExists
        ? state.activeChannelId
        : pickInitialChannelId(activeGuild);

      const next = {
        guilds: merged,
        activeChannelId: nextChannelId,
        messages: nextChannelId
          ? (state.messagesByChannel[nextChannelId] ?? [])
          : [],
      };

      writeCache({ ...state, ...next, activeGuildId: state.activeGuildId });
      return next;
    }),

  addGuild: (guild) =>
    set((state) => {
      const safe = mergeGuild(undefined, guild);
      const nextGuildId = state.activeGuildId ?? safe.id;
      const nextChannelId =
        nextGuildId === safe.id
          ? pickInitialChannelId(safe)
          : state.activeChannelId;

      const next = {
        guilds: [...state.guilds, safe],
        activeGuildId: nextGuildId,
        activeChannelId: nextChannelId,
        messages: nextChannelId
          ? (state.messagesByChannel[nextChannelId] ?? [])
          : state.messages,
        members:
          nextGuildId === safe.id
            ? (state.membersByGuild[safe.id] ?? [])
            : state.members,
      };

      writeCache({ ...state, ...next });
      return next;
    }),

  setActiveGuild: (guildId) =>
    set((state) => {
      const guild = state.guilds.find((g) => g.id === guildId);
      const nextChannelId = pickInitialChannelId(guild);

      const next = {
        activeGuildId: guildId,
        activeChannelId: nextChannelId,
        messages: nextChannelId
          ? (state.messagesByChannel[nextChannelId] ?? [])
          : [],
        members: state.membersByGuild[guildId] ?? [],
        typingUsers: [],
      };

      writeCache({ ...state, ...next });
      return next;
    }),

  setActiveChannel: (channelId) =>
    set((state) => {
      const next = {
        activeChannelId: channelId,
        messages: state.messagesByChannel[channelId] ?? [],
      };
      writeCache({ ...state, ...next });
      return next;
    }),

  setMessages: (channelId, messages) =>
    set((state) => {
      const safe = messages ?? [];
      const existing = state.messagesByChannel[channelId] ?? [];

      const tempMessages = existing.filter((m) => m.id.startsWith("temp-"));
      const incomingIds = new Set(safe.map((m) => m.id));
      const preservedTemp = tempMessages.filter((m) => !incomingIds.has(m.id));

      const merged = [...safe, ...preservedTemp];

      const next = {
        messagesByChannel: { ...state.messagesByChannel, [channelId]: merged },
        messages: state.activeChannelId === channelId ? merged : state.messages,
      };

      writeCache({ ...state, ...next });
      return next;
    }),

  addMessage: (message) =>
    set((state) => {
      const current = state.messagesByChannel[message.channelId] ?? [];
      const authorNorm = normalizeId(message.authorId);

      let next: IMessage[];
      if (message.id.startsWith("temp-")) {
        next = current.some((m) => m.id === message.id)
          ? current
          : [...current, message];
      } else {
        const filtered = current.filter(
          (m) =>
            !(
              m.id.startsWith("temp-") && normalizeId(m.authorId) === authorNorm
            ),
        );
        next = filtered.some((m) => m.id === message.id)
          ? filtered
          : [...filtered, message];
      }

      const nextState = {
        messagesByChannel: {
          ...state.messagesByChannel,
          [message.channelId]: next,
        },
        messages:
          state.activeChannelId === message.channelId ? next : state.messages,
      };

      writeCache({ ...state, ...nextState });
      return nextState;
    }),

  setMembers: (guildId, members) =>
    set((state) => {
      const safe = members ?? [];
      const next = {
        membersByGuild: { ...state.membersByGuild, [guildId]: safe },
        members: state.activeGuildId === guildId ? safe : state.members,
      };
      writeCache({ ...state, ...next });
      return next;
    }),

  hydrateFromCache: () => {
    const cached = readCache();
    if (!cached) return null;

    const activeGuild = cached.activeGuildId
      ? cached.guilds.find((g) => g.id === cached.activeGuildId)
      : undefined;

    const channelValid =
      cached.activeChannelId &&
      activeGuild?.channels.some((ch) => ch.id === cached.activeChannelId);

    const nextChannelId = channelValid
      ? cached.activeChannelId
      : pickInitialChannelId(activeGuild);

    set({
      guilds: cached.guilds ?? [],
      activeGuildId: cached.activeGuildId,
      activeChannelId: nextChannelId,
      messagesByChannel: cached.messagesByChannel ?? {},
      membersByGuild: cached.membersByGuild ?? {},
      messages: nextChannelId
        ? (cached.messagesByChannel[nextChannelId] ?? [])
        : [],
      members: cached.activeGuildId
        ? (cached.membersByGuild[cached.activeGuildId] ?? [])
        : [],
    });

    return cached;
  },

  resetSessionState: () => {
    try {
      window.localStorage.removeItem(CACHE_KEY);
    } catch {}
    set({
      guilds: [],
      activeGuildId: null,
      activeChannelId: null,
      messages: [],
      messagesByChannel: {},
      members: [],
      membersByGuild: {},
      presence: {},
      typingUsers: [],
    });
  },

  updatePresence: (userId, status) =>
    set((state) => ({
      presence: { ...state.presence, [normalizeId(userId)]: status },
    })),

  setTyping: (userId, isTyping) =>
    set((state) => ({
      typingUsers: isTyping
        ? [...new Set([...state.typingUsers, userId])]
        : state.typingUsers.filter((id) => id !== userId),
    })),
}));
