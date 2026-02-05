declare const __DEV__: boolean;

// Lightweight web-only error logger to avoid importing react-native in web builds
if (__DEV__) {
  const originalLog = console.log.bind(console);
  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);

  const send = (level: string, message: string, source = '') => {
    try {
      fetch('/natively-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, message, source, timestamp: new Date().toISOString(), platform: 'Web' }),
      }).catch(() => {});
    } catch (e) {
      // ignore
    }
  };

  console.log = (...args: any[]) => {
    originalLog(...args);
    send('log', args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
  };

  console.warn = (...args: any[]) => {
    originalWarn(...args);
    send('warn', args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
  };

  console.error = (...args: any[]) => {
    originalError(...args);
    send('error', args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
  };

  window.addEventListener('unhandledrejection', (ev) => {
    send('error', `Unhandled Promise Rejection: ${ev.reason}`);
  });

  window.onerror = (message, source, lineno, colno, error) => {
    send('error', `Runtime Error: ${message} at ${source}:${lineno}:${colno}`);
    return false;
  };
}
