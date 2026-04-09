import { resolveDragSourceElement } from '@drag/hooks/utils/resolveDragSourceElement';

describe('resolveDragSourceElement', () => {
  it('prefers the colored month multi-day segment over the outer event shell', () => {
    document.body.innerHTML = `
      <div data-event-id="event-1">
        <div data-segment-days="3">
          <span id="label">Event title</span>
        </div>
      </div>
    `;

    const label = document.querySelector('#label') as HTMLElement;
    const resolved = resolveDragSourceElement(label);

    expect(resolved.dataset.segmentDays).toBe('3');
    expect(resolved.dataset.eventId).toBeUndefined();
  });

  it('falls back to the event shell when no segment wrapper exists', () => {
    document.body.innerHTML = `
      <div data-event-id="event-2">
        <span id="content">Event title</span>
      </div>
    `;

    const content = document.querySelector('#content') as HTMLElement;
    const resolved = resolveDragSourceElement(content);

    expect(resolved.dataset.eventId).toBe('event-2');
  });
});
