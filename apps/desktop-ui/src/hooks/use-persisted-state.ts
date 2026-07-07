import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type PersistenceErrorReason = "read" | "write" | "version" | "corrupt";

type PersistedStateOptions<T> = {
  version: number;
  serialize?: (value: T) => string;
  deserialize?: (raw: string) => T;
  migrate?: (value: unknown, fromVersion: number) => T | null;
  throttleMs?: number;
  removeInvalid?: boolean;
  onPersistenceError?: (error: {
    reason: PersistenceErrorReason;
    key: string;
    message: string;
  }) => void;
};

type PersistedEnvelope<T> = { version: number; value: T };

const DEFAULT_THROTTLE_MS = 120;

function hasLocalStorageApi() {
  if (typeof window === "undefined") return false;
  const storage = window.localStorage as Storage | undefined;
  return Boolean(
    typeof storage?.getItem === "function" &&
    typeof storage.setItem === "function" &&
    typeof storage.removeItem === "function",
  );
}

function defaultSerialize<T>(value: PersistedEnvelope<T>) {
  return JSON.stringify(value);
}

function report<T>(
  options: PersistedStateOptions<T>,
  reason: PersistenceErrorReason,
  key: string,
  message: string,
) {
  options.onPersistenceError?.({ reason, key, message });
}

export function usePersistedState<T>(
  storageKey: string,
  initialValue: T,
  options: PersistedStateOptions<T>,
) {
  const {
    version,
    throttleMs = DEFAULT_THROTTLE_MS,
    removeInvalid = true,
  } = options;
  const serialize =
    options.serialize ?? ((value: T) => defaultSerialize({ version, value }));

  const mountedRef = useRef(false);
  const writeTimerRef = useRef<number | null>(null);

  const readInitial = useMemo(() => {
    if (!hasLocalStorageApi()) return initialValue;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return initialValue;

    try {
      const envelope = JSON.parse(raw) as Partial<PersistedEnvelope<unknown>>;
      if (
        !envelope ||
        typeof envelope !== "object" ||
        typeof envelope.version !== "number" ||
        !("value" in envelope)
      ) {
        if (options.deserialize) return options.deserialize(raw);
        report(
          options,
          "corrupt",
          storageKey,
          "Persisted payload is not a versioned envelope",
        );
        if (removeInvalid) window.localStorage.removeItem(storageKey);
        return initialValue;
      }
      if (envelope.version === version) return envelope.value as T;
      const migrated = options.migrate?.(envelope.value, envelope.version);
      if (migrated !== null && migrated !== undefined) return migrated;
      report(
        options,
        "version",
        storageKey,
        `Unsupported persisted version ${envelope.version}`,
      );
      if (removeInvalid) window.localStorage.removeItem(storageKey);
      return initialValue;
    } catch (error) {
      report(
        options,
        "read",
        storageKey,
        error instanceof Error
          ? error.message
          : "Unable to read persisted state",
      );
      if (removeInvalid) {
        try {
          window.localStorage.removeItem(storageKey);
        } catch {
          /* keep UI usable */
        }
      }
      return initialValue;
    }
  }, [initialValue, options, removeInvalid, storageKey, version]);

  const [state, setState] = useState<T>(readInitial);

  const clear = useCallback(() => {
    setState(initialValue);
    if (hasLocalStorageApi()) window.localStorage.removeItem(storageKey);
  }, [initialValue, storageKey]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (writeTimerRef.current !== null)
        window.clearTimeout(writeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current || !hasLocalStorageApi()) return;
    const runWrite = () => {
      try {
        window.localStorage.setItem(storageKey, serialize(state));
      } catch (error) {
        report(
          options,
          "write",
          storageKey,
          error instanceof Error
            ? error.message
            : "Unable to write persisted state",
        );
      }
    };
    if (writeTimerRef.current !== null)
      window.clearTimeout(writeTimerRef.current);
    writeTimerRef.current = window.setTimeout(runWrite, throttleMs);
  }, [options, serialize, state, storageKey, throttleMs]);

  return [state, setState, clear] as const;
}
