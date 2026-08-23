"use client";

import { useCallback, useState } from "react";
import buttonStyles from "@/styles/tv/tv-button.module.css";

interface TVButtonProps {
  label?: string;
  icon?: string;
  variant?: "default" | "power" | "narrow" | "transport";
  onClick?: () => void;
  onClickSound?: () => void;
  ariaLabel: string;
  hideLabel?: boolean;
  active?: boolean;
}

export function TVButton({
  label,
  icon,
  variant = "default",
  onClick,
  onClickSound,
  ariaLabel,
  hideLabel = false,
  active = false,
}: TVButtonProps) {
  const [pressed, setPressed] = useState(false);

  const handleClick = useCallback(() => {
    onClickSound?.();
    onClick?.();
  }, [onClick, onClickSound]);

  const variantClass =
    variant === "power"
      ? buttonStyles.power
      : variant === "narrow"
        ? buttonStyles.narrow
        : variant === "transport"
          ? buttonStyles.transport
          : "";

  const buttonEl = (
    <button
      type="button"
      className={`${buttonStyles.button} ${variantClass} ${pressed ? buttonStyles.buttonPressed : ""} ${active ? buttonStyles.buttonActive : ""}`}
      onClick={handleClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      aria-label={ariaLabel}
    >
      {variant === "power" && (
        <span className={buttonStyles.powerIcon} aria-hidden="true">
          <svg viewBox="0 0 16 16" width="100%" height="100%">
            <path
              d="M8 2.5v4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M5.2 4.1a4.2 4.2 0 1 0 5.6 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )}
      {icon && (
        <span className={buttonStyles.buttonIcon} aria-hidden="true">
          {icon}
        </span>
      )}
    </button>
  );

  return (
    <div className={buttonStyles.buttonWrap}>
      {buttonEl}
      {!hideLabel && label && (
        <span className={buttonStyles.label}>{label}</span>
      )}
    </div>
  );
}
