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

  useEffect(() => {
    timerRef.current = initialTime;
    onTick(initialTime);
  }, [initialTime]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      intervalRef.current = setInterval(() => {
        timerRef.current -= 1;
        onTick(timerRef.current);

        if (timerRef.current <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onTimeUp();
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
