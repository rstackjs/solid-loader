import { render } from '@solidjs/web';
import { count } from './count.ts';

render(() => <h1>{count}</h1>, document.body);
