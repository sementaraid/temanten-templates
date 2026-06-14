import { useState, useEffect } from 'react';

export type CountdownTime = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  completed: boolean;
};

function compute(target: Date): CountdownTime {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) {
    return { days: '00', hours: '00', minutes: '00', seconds: '00', completed: true };
  }
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return { days: pad(days), hours: pad(hours), minutes: pad(minutes), seconds: pad(seconds), completed: false };
}

export function useCountdown(targetDate: Date, onComplete?: () => void): CountdownTime {
  const [time, setTime] = useState(() => compute(targetDate));

  useEffect(() => {
    if (time.completed) return;
    const id = setInterval(() => {
      const next = compute(targetDate);
      setTime(next);
      if (next.completed) onComplete?.();
    }, 1000);
    return () => clearInterval(id);
  }, [targetDate, time.completed, onComplete]);

  return time;
}
