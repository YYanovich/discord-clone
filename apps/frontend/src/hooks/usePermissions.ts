import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useGuildStore } from "../store/guildStore";
import api from "../api/axios";

//same logic as in backend with permission system created by bits
export const PermissionFlag = {
  VIEW_CHANNEL:    1 << 0,  // 1
  SEND_MESSAGES:   1 << 1,  // 2
  MANAGE_MESSAGES: 1 << 2,  // 4
  MANAGE_CHANNELS: 1 << 3,  // 8
  MANAGE_ROLES:    1 << 4,  // 16
  KICK_MEMBERS:    1 << 5,  // 32
  BAN_MEMBERS:     1 << 6,  // 64
  ADMINISTRATOR:   1 << 7,  // 128
} as const;

function hasFlag(permissions: number, flag: number): boolean {
  return (permissions & flag) === flag;
}

interface UsePermissionsResult {
  permissions: number;
  can: (flag: number) => boolean;
  isOwner: boolean;
  isLoading: boolean;
}

export function usePermissions(
  guildId?: string | null,
  channelId?: string | null,
): UsePermissionsResult {
  const { user } = useAuthStore();
  const { guilds } = useGuildStore();
  const [permissions, setPermissions] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const activeGuild = guilds.find((g) => g.id === guildId);
  const isOwner = activeGuild?.ownerId === user?.id;

  useEffect(() => {
    if (!guildId || !user) return;

    if (isOwner) {
      setPermissions(~0);
      return;
    }

    setIsLoading(true);
    api.get(`/guilds/${guildId}/my-permissions`, {
      params: channelId ? { channelId } : undefined,
    })
      .then(({ data }) => setPermissions(data.permissions))
      .catch(() => setPermissions(0))
      .finally(() => setIsLoading(false));
  }, [guildId, channelId, user?.id, isOwner]);

  return {
    permissions,
    can: (flag: number) => isOwner || hasFlag(permissions, flag),
    isOwner,
    isLoading,
  };
}