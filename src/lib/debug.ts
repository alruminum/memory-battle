export const dbg = import.meta.env.DEV
  ? (...args: unknown[]) => console.log(...args)
  : () => {}

export const dbgWarn = import.meta.env.DEV
  ? (...args: unknown[]) => console.warn(...args)
  : () => {}
