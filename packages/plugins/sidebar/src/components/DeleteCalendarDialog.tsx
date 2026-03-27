import {
  createPortal,
  CalendarType,
  cancelButton,
  useLocale,
  LoadingButton,
} from '@dayflow/core';
import { useState } from 'preact/hooks';

import { CalendarChip } from './CalendarChip';

const CAL_SENTINEL = '\u0001C\u0001';

function renderWithChip(template: string, name: string, color: string) {
  return template
    .split(CAL_SENTINEL)
    .flatMap((part, i) =>
      i === 0
        ? [part]
        : [<CalendarChip key={i} name={name} color={color} />, part]
    );
}

interface DeleteCalendarDialogProps {
  calendarId: string;
  calendarName: string;
  calendars: CalendarType[];
  step: 'initial' | 'confirm_delete';
  onStepChange: (step: 'initial' | 'confirm_delete') => void;
  onConfirmDelete: () => void | Promise<void>;
  onCancel: () => void;
  onMergeSelect: (targetId: string) => void | Promise<void>;
}

export const DeleteCalendarDialog = ({
  calendarId,
  calendarName,
  calendars,
  step,
  onStepChange,
  onConfirmDelete,
  onCancel,
  onMergeSelect,
}: DeleteCalendarDialogProps) => {
  const [showMergeDropdown, setShowMergeDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLocale();
  const calendarColor =
    calendars.find(c => c.id === calendarId)?.colors.lineColor ?? '#6b7280';

  const handleMergeSelect = async (id: string) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onMergeSelect(id);
      setShowMergeDropdown(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onConfirmDelete();
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className='df-portal fixed inset-0 z-[9999] flex items-center justify-center bg-black/50'>
      <div className='w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800'>
        {step === 'initial' ? (
          <>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
              {t('deleteCalendar', { calendarName })}
            </h2>
            <p className='mt-3 flex flex-wrap items-center gap-y-0.5 text-sm text-gray-600 dark:text-gray-300'>
              {renderWithChip(
                t('deleteCalendarMessage', { calendarName: CAL_SENTINEL }),
                calendarName,
                calendarColor
              )}
            </p>
            <div className='mt-6 flex items-center justify-between'>
              <div className='relative'>
                <button
                  type='button'
                  disabled={isLoading}
                  onClick={() => setShowMergeDropdown(!showMergeDropdown)}
                  className='flex items-center gap-1 rounded-md border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-slate-700'
                >
                  {t('merge')}
                </button>
                {showMergeDropdown && (
                  <div className='absolute top-full left-0 z-10 mt-1 max-h-60 w-max min-w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-gray-800'>
                    {calendars
                      .filter(c => c.id !== calendarId)
                      .map(calendar => (
                        <div
                          key={calendar.id}
                          className='flex cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700'
                          onClick={() => {
                            handleMergeSelect(calendar.id);
                          }}
                        >
                          <div
                            className='mr-2 h-3 w-3 shrink-0 rounded-sm'
                            style={{
                              backgroundColor: calendar.colors.lineColor,
                            }}
                          />
                          <span className='whitespace-nowrap'>
                            {calendar.name || calendar.id}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <div className='flex gap-3'>
                <button
                  type='button'
                  onClick={onCancel}
                  disabled={isLoading}
                  className={`${cancelButton} disabled:opacity-50`}
                >
                  {t('cancel')}
                </button>
                <button
                  type='button'
                  onClick={() => onStepChange('confirm_delete')}
                  disabled={isLoading}
                  className='df-fill-destructive df-hover-destructive rounded-md px-4 py-2 text-xs font-medium disabled:opacity-50'
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
              {t('confirmDeleteTitle', { calendarName })}
            </h2>
            <p className='mt-3 text-sm text-gray-600 dark:text-gray-300'>
              {t('confirmDeleteMessage')}
            </p>
            <div className='mt-6 flex justify-end gap-3'>
              <button
                type='button'
                onClick={onCancel}
                disabled={isLoading}
                className='rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-slate-700'
              >
                {t('cancel')}
              </button>
              <LoadingButton
                type='button'
                onClick={handleConfirmDelete}
                loading={isLoading}
                className='df-fill-destructive df-hover-destructive rounded-md px-3 py-2 text-xs font-medium'
              >
                {t('delete')}
              </LoadingButton>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};
