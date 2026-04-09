import React, { useEffect } from 'react';
import { useTrainingStore } from '../store/trainingStore';

/**
 * Keeps elapsedSeconds ticking whenever there is an active session and the timer is not paused.
 * Lives under MainTabs (always mounted) so the banner keeps updating after leaving EntrenamientoEnVivo.
 */
export const WorkoutLiveTimer: React.FC = () => {
  const activeSession = useTrainingStore((s) => s.activeSession);
  const isWorkoutTimerPaused = useTrainingStore((s) => s.isWorkoutTimerPaused);

  useEffect(() => {
    if (!activeSession || isWorkoutTimerPaused) return;

    const id = setInterval(() => {
      const s = useTrainingStore.getState();
      if (!s.activeSession || s.isWorkoutTimerPaused) return;
      s.setElapsed(s.elapsedSeconds + 1);
    }, 1000);

    return () => clearInterval(id);
  }, [activeSession, isWorkoutTimerPaused]);

  return null;
};

export default WorkoutLiveTimer;
