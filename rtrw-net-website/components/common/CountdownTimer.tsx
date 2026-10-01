"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  targetDate: string | Date;
  prefix?: string;
  className?: string;
}

export function CountdownTimer({ targetDate, prefix = "Berakhir dalam", className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft("Berakhir");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      let timeString = "";
      if (days > 0) timeString += `${days}h `;
      if (hours > 0 || days > 0) timeString += `${hours}j `;
      timeString += `${minutes}m ${seconds}s`;

      setTimeLeft(timeString);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter ${className}`}>
      <Clock size={10} className="animate-pulse" />
      <span>{prefix}: {timeLeft}</span>
    </div>
  );
}
