export const resolveDragSourceElement = (
  element: HTMLElement | null
): HTMLElement => {
  if (!element) {
    return document.body;
  }

  return (
    element.closest<HTMLElement>('[data-segment-days]') ??
    element.closest<HTMLElement>('[data-event-id]') ??
    element
  );
};
