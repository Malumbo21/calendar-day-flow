import { createPortal } from 'preact/compat';
import { useMemo, useState } from 'preact/hooks';

import { useLocale } from '@/locale';
import type { Event } from '@/types';
import type { EventRecurrence, RecurrenceFrequency } from '@/utils/recurrence';
import { isPlainDate } from '@/utils/temporal';

import { FormSelect } from './FormSelect';

interface CustomRepeatDialogProps {
  event: Event;
  initialRecurrence: EventRecurrence;
  startOfWeek?: number;
  onCancel: () => void;
  onConfirm: (recurrence: EventRecurrence) => void;
}

const DAY_CODES = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const;
const DAY_CODES_BY_WEEK_START = ['SU', ...DAY_CODES.slice(0, 6)] as const;

const getByDayCodes = (recurrence: EventRecurrence): string[] => {
  const byDay = recurrence.extraParts.find(part =>
    part.toUpperCase().startsWith('BYDAY=')
  );
  if (!byDay) return [];
  return byDay
    .slice(byDay.indexOf('=') + 1)
    .toUpperCase()
    .split(',')
    .filter(code => DAY_CODES.includes(code as (typeof DAY_CODES)[number]));
};

const withoutByDay = (parts: string[]): string[] =>
  parts.filter(part => !part.toUpperCase().startsWith('BYDAY='));

export const CustomRepeatDialog = ({
  event,
  initialRecurrence,
  startOfWeek = 1,
  onCancel,
  onConfirm,
}: CustomRepeatDialogProps) => {
  const { locale, t, getWeekDaysLabels } = useLocale();
  const eventDate = isPlainDate(event.start)
    ? event.start
    : event.start.toPlainDate();
  const eventDayCode = DAY_CODES[eventDate.dayOfWeek - 1];
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    initialRecurrence.frequency
  );
  const [interval, setInterval] = useState(initialRecurrence.interval);
  const [selectedDays, setSelectedDays] = useState<string[]>(() => {
    const configuredDays = getByDayCodes(initialRecurrence);
    return configuredDays.length > 0 ? configuredDays : [eventDayCode];
  });

  const normalizedStartOfWeek = ((startOfWeek % 7) + 7) % 7;
  const weekdayCodes = useMemo(
    () => [
      ...DAY_CODES_BY_WEEK_START.slice(normalizedStartOfWeek),
      ...DAY_CODES_BY_WEEK_START.slice(0, normalizedStartOfWeek),
    ],
    [normalizedStartOfWeek]
  );
  const weekdayLabels = useMemo(
    () => getWeekDaysLabels(locale, 'short', normalizedStartOfWeek),
    [getWeekDaysLabels, locale, normalizedStartOfWeek]
  );

  const unitKey =
    frequency === 'DAILY'
      ? 'day'
      : frequency === 'WEEKLY'
        ? 'week'
        : frequency === 'MONTHLY'
          ? 'month'
          : 'year';

  const handleFrequencyChange = (nextFrequency: RecurrenceFrequency) => {
    setFrequency(nextFrequency);
    if (nextFrequency === 'WEEKLY' && selectedDays.length === 0) {
      setSelectedDays([eventDayCode]);
    }
  };

  const handleConfirm = () => {
    const managesByDay =
      frequency === 'WEEKLY' || initialRecurrence.frequency === 'WEEKLY';
    const extraParts = managesByDay
      ? withoutByDay(initialRecurrence.extraParts)
      : [...initialRecurrence.extraParts];
    if (frequency === 'WEEKLY') {
      const orderedDays = DAY_CODES.filter(code => selectedDays.includes(code));
      extraParts.push(`BYDAY=${orderedDays.join(',')}`);
    }
    onConfirm({
      ...initialRecurrence,
      frequency,
      interval,
      extraParts,
    });
  };

  return createPortal(
    <div
      className='df-repeat-dialog-backdrop'
      data-event-detail-dialog='true'
      onMouseDown={e => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <section
        className='df-repeat-dialog'
        role='dialog'
        aria-modal='true'
        aria-labelledby={`custom-repeat-title-${event.id}`}
      >
        <h2
          className='df-repeat-dialog-title'
          id={`custom-repeat-title-${event.id}`}
        >
          {t('customRepeat')}
        </h2>

        <div className='df-repeat-dialog-row'>
          <label className='df-repeat-dialog-label'>{t('frequency')}:</label>
          <FormSelect
            value={frequency}
            ariaLabel={t('frequency')}
            options={[
              { value: 'DAILY', label: t('daily') },
              { value: 'WEEKLY', label: t('weekly') },
              { value: 'MONTHLY', label: t('monthly') },
              { value: 'YEARLY', label: t('yearly') },
            ]}
            onChange={handleFrequencyChange}
          />
        </div>

        <div className='df-repeat-dialog-row'>
          <label
            className='df-repeat-dialog-label'
            htmlFor={`custom-repeat-interval-${event.id}`}
          >
            {t('every')}
          </label>
          <div className='df-repeat-dialog-interval'>
            <input
              id={`custom-repeat-interval-${event.id}`}
              className='df-form-number-input'
              type='number'
              min={1}
              max={999}
              value={interval}
              aria-label={t('every')}
              onChange={e =>
                setInterval(
                  Math.min(
                    999,
                    Math.max(
                      1,
                      Number.parseInt(
                        (e.currentTarget as HTMLInputElement).value,
                        10
                      ) || 1
                    )
                  )
                )
              }
            />
            <span>{t(unitKey)}</span>
            {frequency === 'WEEKLY' && <span>{t('on')}:</span>}
          </div>
        </div>

        {frequency === 'WEEKLY' && (
          <div className='df-repeat-dialog-weekdays' role='group'>
            {weekdayCodes.map((code, index) => {
              const selected = selectedDays.includes(code);
              return (
                <button
                  key={code}
                  type='button'
                  className='df-repeat-dialog-weekday'
                  data-selected={selected ? 'true' : 'false'}
                  aria-pressed={selected}
                  onClick={() => {
                    if (selected && selectedDays.length === 1) return;
                    setSelectedDays(days =>
                      selected
                        ? days.filter(day => day !== code)
                        : [...days, code]
                    );
                  }}
                >
                  {weekdayLabels[index]}
                </button>
              );
            })}
          </div>
        )}

        <div className='df-repeat-dialog-actions'>
          <button
            type='button'
            className='df-repeat-dialog-action df-repeat-dialog-cancel'
            onClick={onCancel}
          >
            {t('cancel')}
          </button>
          <button
            type='button'
            className='df-repeat-dialog-action df-repeat-dialog-confirm'
            onClick={handleConfirm}
          >
            {t('ok')}
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
};

export default CustomRepeatDialog;
