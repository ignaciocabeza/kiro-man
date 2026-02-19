import { useEffect, useRef } from 'react';
import { GameStatus } from '../types';

export function useTimer(
  initialTime: number,
  status: GameStatus,
  onTimeUp: () => void,
  onTick: (time: number) => void
) {
  const timerRef = useRef(initialTime);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Store callbacks in refs so the interval doesn't need to be recreated when they change
  const onTimeUpRef = useRef(onTimeUp);
  const onTickRef = useRef(onTick);
  onTimeUpRef.current = onTimeUp;
  onTickRef.current = onTick;

  useEffect(() => {
    timerRef.current = initialTime;
    onTickRef.current(initialTime);
  }, [initialTime]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      intervalRef.current = setInterval(() => {
        timerRef.current -= 1;
        onTickRef.current(timerRef.current);

        if (timerRef.current <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onTimeUpRef.current();
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status]);

  return timerRef;
}
