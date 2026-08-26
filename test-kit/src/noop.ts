/** Shared do-nothing implementations, so stand-ins need no empty function bodies. */
export const noop = (): void => undefined;

export const emptyArray = (): unknown[] => [];

export const emptyObject = (): Record<string, unknown> => ({});

export const returnsNull = (): unknown => null;

export const returnsTrue = (): boolean => true;
