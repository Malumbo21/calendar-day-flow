import type {
  CalDAVEventSyncState,
  CalDAVStorage,
} from '@caldav/types/storage';

/**
 * Create an in-memory CalDAV storage adapter.
 *
 * Useful for quick starts and tests. Production apps should provide a durable
 * implementation backed by IndexedDB, localStorage, or their server/database.
 */
export function createMemoryCalDAVStorage(): CalDAVStorage {
  const syncTokens = new Map<string, string>();
  const ctags = new Map<string, string>();
  const etags = new Map<string, string>();
  const eventStates = new Map<string, CalDAVEventSyncState>();

  return {
    getSyncToken: calendarId =>
      Promise.resolve(syncTokens.get(calendarId) ?? null),
    setSyncToken: (calendarId, token) => {
      if (token) {
        syncTokens.set(calendarId, token);
      } else {
        syncTokens.delete(calendarId);
      }
      return Promise.resolve();
    },

    getCtag: calendarId => Promise.resolve(ctags.get(calendarId) ?? null),
    setCtag: (calendarId, ctag) => {
      ctags.set(calendarId, ctag);
      return Promise.resolve();
    },

    getEtag: href => Promise.resolve(etags.get(href) ?? null),
    setEtag: (href, etag) => {
      etags.set(href, etag);
      return Promise.resolve();
    },
    deleteEtag: href => {
      etags.delete(href);
      return Promise.resolve();
    },

    getEventState: eventId => Promise.resolve(eventStates.get(eventId) ?? null),
    setEventState: (eventId, state) => {
      eventStates.set(eventId, state);
      return Promise.resolve();
    },
    deleteEventState: eventId => {
      eventStates.delete(eventId);
      return Promise.resolve();
    },

    clearCalendar: calendarId => {
      syncTokens.delete(calendarId);
      ctags.delete(calendarId);

      for (const [eventId, state] of eventStates) {
        if (state.calendarId === calendarId) {
          eventStates.delete(eventId);
          if (state.etag) {
            etags.delete(state.href);
          }
        }
      }
      return Promise.resolve();
    },
  };
}
