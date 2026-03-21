import { roundToTimeStep } from '@/utils';
import { restoreTimedDragFromAllDayTransition } from '@/utils/crossRegionDrag';

describe('restoreTimedDragFromAllDayTransition', () => {
  it('preserves the original timed duration when returning from all-day area before drop', () => {
    const restored = restoreTimedDragFromAllDayTransition({
      wasOriginallyAllDay: false,
      mouseHour: 9.75,
      hourOffset: 0,
      duration: 2,
      originalStartHour: 12,
      originalEndHour: 14,
      firstHour: 0,
      lastHour: 24,
      minDuration: 0.25,
      roundToTimeStep,
    });

    expect(restored.duration).toBe(2);
    expect(restored.startHour).toBe(9.75);
    expect(restored.endHour).toBe(11.75);
  });

  it('uses a one-hour default duration only for events that were originally all-day', () => {
    const restored = restoreTimedDragFromAllDayTransition({
      wasOriginallyAllDay: true,
      mouseHour: 13.1,
      hourOffset: 0.5,
      duration: 3,
      originalStartHour: 0,
      originalEndHour: 0,
      firstHour: 0,
      lastHour: 24,
      minDuration: 0.25,
      roundToTimeStep,
    });

    expect(restored.duration).toBe(1);
    expect(restored.startHour).toBe(roundToTimeStep(13.1));
    expect(restored.endHour).toBe(restored.startHour + 1);
    expect(restored.hourOffset).toBe(0);
  });
});
