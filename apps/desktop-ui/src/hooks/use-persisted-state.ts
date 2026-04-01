import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type PersistedStateOptions<T> = {
  version: number;
  serialize?: (value: T) => string;
  deserialize?: (raw: string) => T;
  throttleMs?: number;
};

type PersistedEnvelope<T> = {
  version: number;
  value: T;
};

const DEFAULT_THROTTLE_MS = 120;

function hasLocalStorageApi() {
  if (typeof window === "undefined") {
    return false;
  }
  const storage = window.localStorage as Storage | undefined;
  return Boolean(
    storage &&
      typeof storage.getItem === "function" &&
      typeof storage.setItem === "function" &&
      typeof storage.removeItem === "function",
  );
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function defaultSerialize<T>(value: PersistedEnvelope<T>) {
  return JSON.stringify(value);
}

function defaultDeserialize<T>(raw: string): PersistedEnvelope<T> {
  return JSON.parse(raw) as PersistedEnvelope<T>;
}

export function usePersistedState<T>(
  storageKey: string,
  initialValue: T,
  options: PersistedStateOptions<T>,
) {
  const {
    version,
    serialize = (value: T) => defaultSerialize({ version, value }),
    deserialize = (raw: string) => {
      const parsed = defaultDeserialize<T>(raw);
      return parsed.value;
    },
    throttleMs = DEFAULT_THROTTLE_MS,
  } = options;

  const mountedRef = useRef(false);
  const writeTimerRef = useRef<number | null>(null);

  const readInitial = useMemo(() => {
    if (!hasLocalStorageApi()) {
      return initialValue;
    }
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return initialValue;
    }

    const envelope = safeJsonParse<PersistedEnvelope<T>>(raw);
    if (envelope && typeof envelope === "object" && envelope.version === version && "value" in envelope) {
      return envelope.value;
    }

    try {
      return deserialize(raw);
    } catch {
      return initialValue;
    }
  }, [deserialize, initialValue, storageKey, version]);

  const [state, setState] = useState<T>(readInitial);

  const clear = useCallback(() => {
    setState(initialValue);
    if (hasLocalStorageApi()) {
      window.localStorage.removeItem(storageKey);
    }
  }, [initialValue, storageKey]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (writeTimerRef.current !== null) {
        window.clearTimeout(writeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current || !hasLocalStorageApi()) {
      return;
    }

    const runWrite = () => {
      try {
        const payload = serialize(state);
        window.localStorage.setItem(storageKey, payload);
      } catch {
        // ignore persistence failures
      }
    };

    if (writeTimerRef.current !== null) {
      window.clearTimeout(writeTimerRef.current);
    }

    writeTimerRef.current = window.setTimeout(runWrite, throttleMs);
  }, [serialize, state, storageKey, throttleMs]);

  return [state, setState, clear] as const;
}
