import React, { useState } from 'react';

export type AppProps = {
  storageKey: string;
};

export default function App({ storageKey }: AppProps) {
  const [count, setCount] = useState(() => Number(localStorage.getItem(storageKey) || 0));

  function increment() {
    const next = count + 1;
    localStorage.setItem(storageKey, String(next));
    setCount(next);
  }

  return (
    <section className="card">
      <h2>Canvas starter</h2>
      <p>This React source is vendored in the generated repository.</p>
      <button id="canvas-action" type="button" onClick={increment}>
        Saved interactions: {count}
      </button>
    </section>
  );
}
