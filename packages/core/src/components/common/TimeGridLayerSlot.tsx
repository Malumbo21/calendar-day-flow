import { Fragment } from 'preact';
import { Temporal } from 'temporal-polyfill';

import type { TimeGridLayerContext } from '@/types';

export function buildTimeGridVisibleDates(start: Date, count: number) {
  const first = Temporal.PlainDate.from({
    year: start.getFullYear(),
    month: start.getMonth() + 1,
    day: start.getDate(),
  });
  return Array.from({ length: count }, (_, index) =>
    first.add({ days: index })
  );
}

/**
 * The slot itself creates no DOM. Plugin content stays in CalendarRenderer's
 * internal Preact tree, so adapters all share the
 * same lifecycle and positioning behaviour.
 */
export function TimeGridLayerSlot(context: TimeGridLayerContext) {
  return (
    <>
      {Array.from(context.app.state.plugins.values()).map(plugin => {
        const render = plugin.renderTimeGridLayer;
        if (!render) return null;
        return <Fragment key={plugin.name}>{render(context)}</Fragment>;
      })}
    </>
  );
}
