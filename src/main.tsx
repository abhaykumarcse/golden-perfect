import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './themes.css';
import './extra-themes.css';
import './theme-fix.css';

type BoundaryProps = { children: React.ReactNode };
type BoundaryState = { failed: boolean; message: string };
class GlobalErrorBoundary extends React.Component<BoundaryProps, BoundaryState> {
    state: BoundaryState = { failed: false, message: '' };
    static getDerivedStateFromError(error: Error): BoundaryState { return { failed: true, message: error?.message || 'An unexpected display error occurred.' }; }
    componentDidCatch(error: Error, info: React.ErrorInfo) { console.error('Golden Perfect UI crash details', { message: error?.message, stack: error?.stack, componentStack: info.componentStack }); }
    render() {
        if (this.state.failed) return <main className='shell theme-light'><section className='safe-error-screen'><div className='brand-mark'>◒</div><h1>Golden Perfect is safe</h1><p>Something unexpected happened while displaying the app. Your saved data has not been deleted.</p><details><summary>Technical details</summary><p>{this.state.message}</p></details><button className='primary-button' onClick={() => { try { sessionStorage.removeItem('golden-perfect-last-screen'); } catch { /* Storage can be unavailable in private mode. */ } window.location.assign(window.location.pathname + window.location.search + '#recover'); }}>Open fresh app session</button><button className='outline-button' onClick={() => window.location.reload()}>Reload app</button></section></main>;
        return this.props.children;
    }
}

window.addEventListener('error', (event) => { console.error('Golden Perfect uncaught browser error', { message: event.message, source: event.filename, line: event.lineno, column: event.colno, stack: event.error?.stack }); });
window.addEventListener('unhandledrejection', (event) => { console.error('Golden Perfect unhandled async error', event.reason); });
window.addEventListener('load', () => { if ('serviceWorker' in navigator) { void navigator.serviceWorker.getRegistrations().then((registrations) => Promise.all(registrations.map((registration) => registration.unregister()))).catch((error) => console.warn('Service worker cleanup skipped', error)); } if ('caches' in window) { void caches.keys().then((keys) => Promise.all(keys.filter((key) => key.toLowerCase().includes('golden-perfect')).map((key) => caches.delete(key)))).catch((error) => console.warn('Cache cleanup skipped', error)); } });

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <GlobalErrorBoundary><App /></GlobalErrorBoundary>
    </StrictMode>
);
