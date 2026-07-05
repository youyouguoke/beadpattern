import "@testing-library/jest-dom";

// Minimal localStorage mock for client components that use it.
Object.defineProperty(window, "localStorage", {
  value: (() => {
    let store: Record<string, string> = {};
    return {
      getItem(key: string) {
        return store[key] ?? null;
      },
      setItem(key: string, value: string) {
        store[key] = value;
      },
      removeItem(key: string) {
        delete store[key];
      },
      clear() {
        store = {};
      },
    };
  })(),
  writable: true,
});

// Reset fetch mock between tests.
beforeEach(() => {
  jest.restoreAllMocks();
  window.localStorage.clear();
});
