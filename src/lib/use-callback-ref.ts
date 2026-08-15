import { useCallback, useEffect, useRef } from "react";

/** Returns a stable function identity that always invokes the latest callback. */
export function useCallbackRef<T extends (...args: never[]) => unknown>(callback: T): T {
  const ref = useRef(callback);
  useEffect(() => {
    ref.current = callback;
  });
  return useCallback((...args: never[]) => ref.current(...args), []) as T;
}
