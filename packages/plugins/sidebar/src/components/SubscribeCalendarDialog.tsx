import { cancelButton, useLocale } from '@dayflow/core';
import { useState } from 'preact/hooks';

interface SubscribeCalendarDialogProps {
  onSubscribe: (url: string) => Promise<void>;
  onCancel: () => void;
}

export const SubscribeCalendarDialog = ({
  onSubscribe,
  onCancel,
}: SubscribeCalendarDialogProps) => {
  const { t } = useLocale();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setError(null);
    setLoading(true);
    try {
      await onSubscribe(trimmed);
    } catch (err: unknown) {
      if ((err as Error).message === 'DUPLICATE_URL') {
        setError(
          t('calendarAlreadySubscribed') || 'This URL is already subscribed'
        );
      } else {
        setError(t('subscribeError') || 'Failed to subscribe to calendar');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className='df-portal fixed inset-0 z-[9999] flex items-center justify-center bg-black/50'>
      <div className='w-full max-w-xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800'>
        <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
          {t('subscribeCalendarTitle')}
        </h2>

        <div className='mt-4'>
          <div className='flex items-center gap-3'>
            <label className='shrink-0 text-sm font-medium text-gray-700 dark:text-gray-300'>
              {t('calendarUrl')}
            </label>
            <input
              type='url'
              value={url}
              onInput={e => setUrl((e.target as HTMLInputElement).value)}
              onKeyDown={handleKeyDown}
              placeholder={t('calendarUrlPlaceholder')}
              disabled={loading}
              autoFocus
              className='flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400'
            />
          </div>
          {error && (
            <p className='mt-2 text-xs text-red-500 dark:text-red-400'>
              {error}
            </p>
          )}
        </div>

        <div className='mt-6 flex justify-end gap-3'>
          <button
            type='button'
            onClick={onCancel}
            disabled={loading}
            className={cancelButton}
          >
            {t('cancel')}
          </button>
          <button
            type='button'
            onClick={handleSubmit}
            disabled={loading || !url.trim()}
            className='rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {loading ? t('fetchingCalendar') : t('subscribe')}
          </button>
        </div>
      </div>
    </div>
  );
};
