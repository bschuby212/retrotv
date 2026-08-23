"use client";

import { useCallback, useState } from "react";
import buttonStyles from "@/styles/tv/tv-button.module.css";

interface TVButtonProps {
  label: string;
  icon?: string;
  variant?: "default" | "power" | "channelUp" | "channelDown";
  onClick?: () => void;
  onClickSound?: () => void;
}

export function TVButton({
  label,
  icon,
  variant = "default",
  onClick,
  onClickSound,
}: TVButtonProps) {
  const [pressed, setPressed] = useState(false);

  const handleClick = useCallback(() => {
    onClickSound?.();
    onClick?.();
  }, [onClick, onClickSound]);

  const handlePointerDown = useCallback(() => {
    setPressed(true);
  }, []);

  const handlePointerUp = useCallback(() => {
    setPressed(false);
  }, []);

  const variantClass =
    variant === "power"
      ? buttonStyles.power
      : variant === "channelUp"
        ? buttonStyles.channelUp
        : variant === "channelDown"
          ? buttonStyles.channelDown
          : "";

  return (
    <div className={buttonStyles.buttonWrap}>
      <button
        type="button"
        className={`${buttonStyles.button} ${variantClass} ${pressed ? buttonStyles.buttonPressed : ""}`}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        aria-label={label}
      >
        {icon && (
          <span className={buttonStyles.buttonIcon} aria-hidden="true">
            {icon}
          </span>
        )}
        {variant === "power" && (
          <span className={buttonStyles.powerIcon} aria-hidden="true">
            ⏻
          </span>
        )}
      </button>
      <span className={buttonStyles.label}>{label}</span>
    </div>
  );
}
