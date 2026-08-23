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
}

export function TVButton({
  label,
  icon,
  variant = "default",
  onClick,
  onClickSound,
  ariaLabel,
  hideLabel = false,
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

  return (
    <div className={buttonStyles.buttonWrap}>
      <button
        type="button"
        className={`${buttonStyles.button} ${variantClass} ${pressed ? buttonStyles.buttonPressed : ""}`}
        onClick={handleClick}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        aria-label={ariaLabel}
      >
        {variant === "power" && (
          <span className={buttonStyles.powerIcon} aria-hidden="true">
            ⏻
          </span>
        )}
        {icon && (
          <span className={buttonStyles.buttonIcon} aria-hidden="true">
            {icon}
          </span>
        )}
      </button>
      {!hideLabel && label && (
        <span className={buttonStyles.label}>{label}</span>
      )}
    </div>
  );
}
