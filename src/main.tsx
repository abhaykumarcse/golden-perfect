import React, { StrictMode } from 'react';
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './themes.css';

type BoundaryProps = { children: React.ReactNode };
type BoundaryState = { failed: boolean };
class GlobalErrorBoundary extends React.Component<BoundaryProps, BoundaryState> {
    state: BoundaryState = { failed: false };
    static getDerivedStateFromError(): BoundaryState { return { failed: true }; }
    componentDidCatch(error: Error, info: React.ErrorInfo) { console.error('Golden Perfect recovered a UI crash', error, info); }
    render() {
        if (this.state.failed) return <main className='shell theme-light'><section className='safe-error-screen'><div className='brand-mark'>◒</div><h1>Golden Perfect is safe</h1><p>Something unexpected happened. Your saved data has not been deleted.</p><button className='primary-button' onClick={() => window.location.reload()}>Reload app</button></section></main>;
        return this.props.children;
    }
}

window.addEventListener('unhandledrejection', (event) => { console.error('Golden Perfect recovered an unhandled async error', event.reason); event.preventDefault(); });
window.addEventListener('load', () => { if ('serviceWorker' in navigator) { void navigator.serviceWorker.getRegistrations().then((registrations) => Promise.all(registrations.map((registration) => registration.unregister()))).catch((error) => console.warn('Service worker cleanup skipped', error)); } if ('caches' in window) { void caches.keys().then((keys) => Promise.all(keys.filter((key) => key.toLowerCase().includes('golden-perfect')).map((key) => caches.delete(key)))).catch((error) => console.warn('Cache cleanup skipped', error)); } });

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <GlobalErrorBoundary><App /></GlobalErrorBoundary>
    </StrictMode>
);
