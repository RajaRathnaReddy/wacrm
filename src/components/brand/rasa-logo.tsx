"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface RasaLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitle?: string;
  variant?: "icon" | "full";
}

export function RasaBrandMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 select-none group",
        sizeClasses[size],
        className
      )}
    >
      <div className="relative w-full h-full transition-transform duration-300 group-hover:scale-110">
        <Image
          src="/logos/logo-icon.webp"
          alt="Rasa Productions Logo"
          fill
          sizes="80px"
          priority
          className="object-contain drop-shadow-[0_0_12px_rgba(212,160,23,0.55)] transition-all duration-300 group-hover:drop-shadow-[0_0_20px_rgba(255,42,133,0.7)]"
        />
      </div>
    </div>
  );
}

export function RasaLogo({
  className,
  size = "md",
  showText = true,
  subtitle = "PRODUCTIONS",
  variant = "icon",
}: RasaLogoProps) {
  if (variant === "full") {
    const fullSizes = {
      sm: "w-32 h-14",
      md: "w-48 h-20",
      lg: "w-64 h-28",
      xl: "w-80 h-36",
    };
    return (
      <div className={cn("relative select-none", fullSizes[size], className)}>
        <Image
          src="/logos/logo.webp"
          alt="Rasa Productions"
          fill
          sizes="320px"
          priority
          className="object-contain drop-shadow-[0_0_35px_rgba(212,160,23,0.45)]"
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 select-none group", className)}>
      <RasaBrandMark size={size} />

      {showText && (
        <div className="flex flex-col min-w-0">
          <div
            className="flex items-center gap-1.5 leading-none font-bold tracking-widest uppercase"
            style={{ fontFamily: "var(--font-heading), var(--font-rajdhani), sans-serif" }}
          >
            <span
              className={cn(
                "text-white font-extrabold tracking-widest",
                size === "sm" && "text-base",
                size === "md" && "text-lg",
                size === "lg" && "text-2xl",
                size === "xl" && "text-3xl"
              )}
            >
              RASA
            </span>
            <span
              className={cn(
                "bg-gradient-to-r from-[#ff2a85] to-[#ff7eb3] bg-clip-text text-transparent font-bold tracking-widest",
                size === "sm" && "text-sm",
                size === "md" && "text-base",
                size === "lg" && "text-xl",
                size === "xl" && "text-2xl"
              )}
            >
              {subtitle}
            </span>
          </div>
          <span className="text-[9px] tracking-[0.22em] uppercase font-semibold text-cyan-400/90 mt-1">
            WhatsApp CRM
          </span>
        </div>
      )}
    </div>
  );
}
