interface IChannelHeader {
  channelName: string;
  onSearchOpen: () => void;
}

export function ChannelHeader({ channelName, onSearchOpen }: IChannelHeader) {
  return (
    <div className="px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-zinc-500 text-sm">#</span>
        <h3 className="text-zinc-100 font-semibold text-sm">{channelName}</h3>
      </div>

      <button
        onClick={onSearchOpen}
        title="Search messages"
        className="p-1.5 text-zinc-500 hover:text-zinc-200
                   hover:bg-zinc-700/50 rounded-lg transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}