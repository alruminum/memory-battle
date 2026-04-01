// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dbg = import.meta.env.DEV
  ? (...args: any[]) => console.log(...args)
  : () => {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dbgWarn = import.meta.env.DEV
  ? (...args: any[]) => console.warn(...args)
  : () => {}
