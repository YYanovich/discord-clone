interface IMessageTime {
  createdAt: string | Date | null;
}

export function MessageTime({ createdAt }: IMessageTime) {
  if (!createdAt) {
    return <span className="text-zinc-600 text-[11px]">...</span>;
  }

  const date = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return <span className="text-zinc-600 text-[11px]">{time}</span>;
}