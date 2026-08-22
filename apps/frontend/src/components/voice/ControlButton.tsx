import React from "react";

export interface IControlButtonProps {
  onClick: () => void;
  active: boolean;
  activeColor: string;
  inactiveColor: string;
  title: string;
  icon: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function ControlButton({
  onClick,
  active,
  activeColor,
  inactiveColor,
  title,
  icon,
  disabled,
  className = "",
}: IControlButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
        active ? activeColor : inactiveColor
      } ${className}`}
    >
      {icon}
    </button>
  );
}