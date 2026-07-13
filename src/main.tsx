/// <reference types="vite-plugin-pwa/client" />
import './styles.css';
import { render } from 'preact';
import { App } from './ui/App';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

render(<App />, document.getElementById('app')!);
