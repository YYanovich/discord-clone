import { useState, useEffect } from "react";

interface IMessageTime {
  createdAt: string | Date | null;
}

export function MessageTime({ createdAt }: IMessageTime) {
  const [formattedTime, setFormattedTime] = useState("");

  useEffect(() => {
    if (!createdAt) {
      setFormattedTime("...");
      return;
    }

    let dateStr =
      typeof createdAt === "string" ? createdAt : createdAt.toISOString();

    if (
      !dateStr.endsWith("Z") &&
      !dateStr.includes("+") &&
      !dateStr.match(/T\d{2}:\d{2}:\d{2}-/)
    ) {
      dateStr = `${dateStr}Z`;
    }

    setFormattedTime(
      new Date(dateStr).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
  }, [createdAt]);

  if (!formattedTime) {
    return <span className="opacity-0 text-[11px]">00:00</span>;
  }

  return <span className="text-zinc-600 text-[11px]">{formattedTime}</span>;
}
