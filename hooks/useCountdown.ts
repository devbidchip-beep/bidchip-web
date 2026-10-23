'use client';

import { useState, useEffect } from 'react';

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export function useCountdown(isoDatetime: string | null | undefined): CountdownResult {
  const getTimeLeft = (): CountdownResult => {
    if (!isoDatetime) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }
    const diff = new Date(isoDatetime).getTime() - Date.now();
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds, isExpired: false };
  };

  const [timeLeft, setTimeLeft] = useState<CountdownResult>(getTimeLeft);

  useEffect(() => {
    if (!isoDatetime) return;

    const tick = () => setTimeLeft(getTimeLeft());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isoDatetime]);

  return timeLeft;
}
