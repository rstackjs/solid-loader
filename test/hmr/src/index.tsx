import { render } from '@solidjs/web';
import { createSignal } from 'solid-js';
import { Counter } from './Counter';

function App() {
  const [count, setCount] = createSignal<number>(0);
  return <Counter count={count()} increment={() => setCount(count() + 1)} />;
}

render(() => <App />, document.body);
