interface RestoreTimedDragOptions {
  wasOriginallyAllDay: boolean;
  mouseHour: number;
  hourOffset: number | null | undefined;
  duration: number;
  originalStartHour: number;
  originalEndHour: number;
  firstHour: number;
  lastHour: number;
  minDuration: number;
  roundToTimeStep: (hour: number) => number;
}

interface RestoredTimedDragState {
  startHour: number;
  endHour: number;
  duration: number;
  hourOffset: number;
}

export const restoreTimedDragFromAllDayTransition = ({
  wasOriginallyAllDay,
  mouseHour,
  hourOffset,
  duration,
  originalStartHour,
  originalEndHour,
  firstHour,
  lastHour,
  minDuration,
  roundToTimeStep,
}: RestoreTimedDragOptions): RestoredTimedDragState => {
  const restoredDuration = wasOriginallyAllDay
    ? 1
    : Math.max(
        minDuration,
        duration || originalEndHour - originalStartHour || 1
      );

  let restoredStartHour = wasOriginallyAllDay
    ? roundToTimeStep(mouseHour)
    : roundToTimeStep(mouseHour + (hourOffset ?? 0));

  restoredStartHour = Math.max(
    firstHour,
    Math.min(lastHour - restoredDuration, restoredStartHour)
  );

  return {
    startHour: restoredStartHour,
    endHour: restoredStartHour + restoredDuration,
    duration: restoredDuration,
    hourOffset: wasOriginallyAllDay ? 0 : (hourOffset ?? 0),
  };
};
