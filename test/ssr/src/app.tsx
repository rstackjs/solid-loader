import { renderToString } from '@solidjs/web';

const title: string = 'Hello';
export const html = renderToString(() => <h1>{title}</h1>);
