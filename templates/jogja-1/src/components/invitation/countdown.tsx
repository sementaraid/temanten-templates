import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

export type CountdownTime = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  completed: boolean;
};

type CountdownProps = {
  targetDate: Date;
  onComplete?: () => void;
  children: (time: CountdownTime) => React.ReactNode;
};

const computeTime = (targetDate: Date, now: number): CountdownTime => {
  const diff = dayjs(targetDate).diff(dayjs(now));
  if (diff <= 0) {
    return { days: '00', hours: '00', minutes: '00', seconds: '00', completed: true };
  }
  const d = dayjs.duration(diff);
  return {
    days: String(Math.floor(d.asDays())).padStart(2, '0'),
    hours: String(d.hours()).padStart(2, '0'),
    minutes: String(d.minutes()).padStart(2, '0'),
    seconds: String(d.seconds()).padStart(2, '0'),
    completed: false,
  };
};

export const Countdown = ({ targetDate, onComplete, children }: CountdownProps) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = computeTime(targetDate, now);

  useEffect(() => {
    if (time.completed) onComplete?.();
  }, [time.completed, onComplete]);

  return <>{children(time)}</>;
};
