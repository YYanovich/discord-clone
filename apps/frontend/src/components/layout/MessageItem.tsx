import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { Socket } from "socket.io-client";
import type { IMessage, IMember } from "../../store/guildStore";
import { useGuildStore } from "../../store/guildStore";
import { MessageTime } from "./MessageTime";
import api from "../../api/axios";
import { toast } from "sonner";
import { DeleteMessageModal } from "../modals/DeleteMessageModal";

interface IMessageItem {
  message: IMessage;
  members: IMember[];
  currentUserId: string;
  socketRef: RefObject<Socket | null>;
  activeGuildId: string;
}

export function MessageItem({ message, members, currentUserId }: IMessageItem) {
  const { updateMessage, removeMessage, activeGuildId } = useGuildStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const member = members.find(
    (m) => m.userId === message.authorId || m.user?.id === message.authorId,
  );
  const username = member?.user.username ?? "User";
  const isOwn = message.authorId === currentUserId;
  const isTemp = message.id.startsWith("temp-");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editContent, isEditing]);

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === message.content) {
      setIsEditing(false);
      setEditContent(message.content);
      return;
    }
    try {
      await api.patch(`/messages/${message.id}`, {
        content: editContent.trim(),
        guildId: activeGuildId,
      });
      updateMessage(message.id, {
        content: editContent.trim(),
        editedAt: new Date().toISOString(),
      });
      setIsEditing(false);
      toast.success("Message edited");
    } catch {
      setIsEditing(false);
      setEditContent(message.content);
      toast.error("Error during editing");
    }
  };

  const handleDeleteConfirm = async () => {
    setShowConfirm(false);
    try {
      await api.delete(`/messages/${message.id}`, {
        data: { guildId: activeGuildId },
      });
      removeMessage(message.id);
      toast.success("Message deleted");
    } catch {
      toast.error("Error during editing");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setEditContent(message.content);
    }
  };

  if (message.isDeleted) {
    return (
      <div className="flex items-start gap-3 py-1.5 px-4 opacity-40">
        <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-zinc-500 text-xs font-bold">?</span>
        </div>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-zinc-500 text-sm">{username}</span>
            <MessageTime createdAt={message.createdAt} />
          </div>
          <p className="text-zinc-600 text-sm italic">Message deleted</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`
          flex items-start gap-3 py-1.5 px-4 rounded-lg group relative
          hover:bg-zinc-800/30 transition-colors
          ${isTemp ? "opacity-50" : ""}
        `}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
          {username[0]?.toUpperCase() ?? "?"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-zinc-200 text-sm font-medium">
              {username}
            </span>
            <MessageTime createdAt={message.createdAt} />
            {message.editedAt && (
              <span className="text-zinc-600 text-[11px] italic">(edited)</span>
            )}
            {isTemp && (
              <span className="text-zinc-600 text-[11px] italic">
                sending...
              </span>
            )}
          </div>

          {isEditing ? (
            <div className="mt-1">
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-zinc-700 text-zinc-100 text-sm rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-15 scrollbar-none [&::-webkit-scrollbar]:hidden"
                autoFocus
                onFocus={(e) => {
                  const val = e.currentTarget.value;
                  e.currentTarget.setSelectionRange(val.length, val.length);
                }}
              />
              <p className="text-zinc-600 text-[11px] mt-1">
                Enter — save · Escape — cancel
              </p>
            </div>
          ) : (
            <p className="text-zinc-300 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">
              {message.content}
            </p>
          )}
        </div>

        {isOwn && !isTemp && showActions && !isEditing && (
          <div className="absolute right-4 top-1.5 flex items-center gap-1 bg-zinc-800 border border-zinc-700/80 rounded-lg px-1 py-0.5 shadow-xl">
            <button
              onClick={() => setIsEditing(true)}
              title="Edit"
              className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded transition-colors text-xs"
            >
              ✏️
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              title="Delete"
              className="p-1.5 text-zinc-400 hover:text-red-400 rounded transition-colors text-xs"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {showConfirm && (
        <DeleteMessageModal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleDeleteConfirm}
          messageContent={message.content} // Передаємо текст повідомлення для прев'ю!
        />
      )}
    </>
  );
}
