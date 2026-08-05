import React from "react";

interface IDeleteMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  messageContent?: string;
}

export const DeleteMessageModal: React.FC<IDeleteMessageModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  messageContent,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="flex w-full max-w-110 flex-col rounded-2xl bg-[#1e1f22] p-6 shadow-2xl border border-zinc-800/80 text-white animate-in fade-in zoom-in-95 duration-150">
        
        <h3 className="text-xl font-bold text-white tracking-tight">Delete Message</h3>
        
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
          Are you sure you want to delete this message? This action cannot be undone.
        </p>

        {messageContent && (
          <div className="mt-4 max-h-24 overflow-y-auto rounded-xl bg-[#2b2d31] p-3 text-sm text-zinc-300 wrap-break-word border border-zinc-700/30 scrollbar-none [&::-webkit-scrollbar]:hidden">
            {messageContent}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#2b2d31] px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-[#35373c] hover:text-white transition-all active:scale-95 outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-all active:scale-95 outline-none shadow-sm"
          >
            Delete
          </button>
        </div>

      </div>
    </div>
  );
};