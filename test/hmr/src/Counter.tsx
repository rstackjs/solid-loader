export function Counter(props: { count: number; increment: () => void }) {
  return <button onClick={props.increment}>Count: {props.count}</button>;
}
