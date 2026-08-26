import { useMemo, useState } from 'preact/hooks';

import { useLocale } from '@/locale';
import type { Event } from '@/types';
import {
  EventRecurrence,
  parseEventRecurrence,
  RecurrenceFrequency,
  setEventRecurrence,
} from '@/utils/recurrence';
import { isPlainDate } from '@/utils/temporal';

import { CustomRepeatDialog } from './CustomRepeatDialog';
import { FormSelect } from './FormSelect';

interface EventRepeatEditorProps {
  event: Event;
  startOfWeek?: number;
  disabled?: boolean;
  onChange: (event: Event) => void;
}

type RepeatValue =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'custom';

const FREQUENCY_BY_VALUE: Partial<Record<RepeatValue, RecurrenceFrequency>> = {
  daily: 'DAILY',
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
  yearly: 'YEARLY',
};

const getEventStartDate = (event: Event): string => {
  const date = isPlainDate(event.start)
    ? event.start
    : event.start.toPlainDate();
  return date.toString();
};

const getDefaultEndDate = (event: Event): string => {
  const date = isPlainDate(event.start)
    ? event.start
    : event.start.toPlainDate();
  return date.add({ months: 1 }).toString();
};

const getRepeatValue = (recurrence: EventRecurrence | null): RepeatValue => {
  if (!recurrence) return 'none';
  if (recurrence.interval !== 1 || recurrence.extraParts.length > 0) {
    return 'custom';
  }
  return recurrence.frequency.toLowerCase() as RepeatValue;
};

export const EventRepeatEditor = ({
  event,
  startOfWeek = 1,
  disabled = false,
  onChange,
}: EventRepeatEditorProps) => {
  const { t } = useLocale();
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const recurrence = useMemo(() => parseEventRecurrence(event), [event]);
  const repeatValue = getRepeatValue(recurrence);
  const eventStartDate = getEventStartDate(event);
  const repeatOptions = [
    { value: 'none' as const, label: t('doesNotRepeat') },
    { value: 'daily' as const, label: t('everyDay') },
    { value: 'weekly' as const, label: t('everyWeek') },
    { value: 'monthly' as const, label: t('everyMonth') },
    { value: 'yearly' as const, label: t('everyYear') },
    { value: 'custom' as const, label: t('custom') },
  ];

  const updateRecurrence = (next: EventRecurrence | null) => {
    onChange(setEventRecurrence(event, next));
  };

  const handleRepeatChange = (value: RepeatValue) => {
    if (value === 'none') {
      updateRecurrence(null);
      return;
    }

    if (value === 'custom') {
      setIsCustomOpen(true);
      return;
    }

    updateRecurrence({
      frequency: FREQUENCY_BY_VALUE[value] ?? 'DAILY',
      interval: 1,
      end: recurrence?.end ?? { type: 'never' },
      extraParts: [],
    });
  };

  const handleEndChange = (value: 'never' | 'on-date' | 'after') => {
    if (!recurrence) return;

    const end =
      value === 'on-date'
        ? { type: 'on-date' as const, date: getDefaultEndDate(event) }
        : value === 'after'
          ? { type: 'after' as const, occurrences: 10 }
          : { type: 'never' as const };

    updateRecurrence({ ...recurrence, end });
  };

  return (
    <div className='df-event-repeat-editor'>
      <div className='df-event-repeat-field'>
        <label className='df-form-label' htmlFor={`event-repeat-${event.id}`}>
          {t('repeat')}
        </label>
        <FormSelect
          id={`event-repeat-${event.id}`}
          value={repeatValue}
          disabled={disabled}
          options={repeatOptions}
          onChange={handleRepeatChange}
        />
      </div>

      {recurrence && (
        <div className='df-event-repeat-field'>
          <label
            className='df-form-label'
            htmlFor={`event-repeat-end-${event.id}`}
          >
            {t('endRepeat')}
          </label>
          <div className='df-event-repeat-end'>
            <FormSelect
              id={`event-repeat-end-${event.id}`}
              value={recurrence.end.type}
              disabled={disabled}
              options={[
                { value: 'never', label: t('never') },
                { value: 'on-date', label: t('onDate') },
                { value: 'after', label: t('after') },
              ]}
              onChange={handleEndChange}
            />

            {recurrence.end.type === 'on-date' && (
              <input
                className='df-form-date-input'
                type='date'
                min={eventStartDate}
                value={recurrence.end.date}
                disabled={disabled}
                aria-label={t('onDate')}
                onChange={e => {
                  const date = (e.currentTarget as HTMLInputElement).value;
                  if (!date) return;
                  updateRecurrence({
                    ...recurrence,
                    end: { type: 'on-date', date },
                  });
                }}
              />
            )}

            {recurrence.end.type === 'after' && (
              <>
                <input
                  className='df-form-number-input'
                  type='number'
                  min={1}
                  max={999}
                  value={recurrence.end.occurrences}
                  disabled={disabled}
                  aria-label={t('occurrences')}
                  onChange={e =>
                    updateRecurrence({
                      ...recurrence,
                      end: {
                        type: 'after',
                        occurrences: Math.min(
                          999,
                          Math.max(
                            1,
                            Number.parseInt(
                              (e.currentTarget as HTMLInputElement).value,
                              10
                            ) || 1
                          )
                        ),
                      },
                    })
                  }
                />
                <span className='df-event-repeat-suffix'>
                  {t('occurrences')}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {isCustomOpen && !disabled && (
        <CustomRepeatDialog
          event={event}
          startOfWeek={startOfWeek}
          initialRecurrence={
            recurrence ?? {
              frequency: 'WEEKLY',
              interval: 1,
              end: { type: 'never' },
              extraParts: [],
            }
          }
          onCancel={() => setIsCustomOpen(false)}
          onConfirm={nextRecurrence => {
            updateRecurrence(nextRecurrence);
            setIsCustomOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default EventRepeatEditor;
