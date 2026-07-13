import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    recordConnectivityChange,
    recordRouteChange
} from '../services/observabilityService';

const observabilityEnabled = import.meta.env.PROD && Boolean(import.meta.env.VITE_SENTRY_DSN);

export function ObservabilityTracker() {
    const location = useLocation();

    useEffect(() => {
        if (!observabilityEnabled) return;
        recordRouteChange(location.pathname);
    }, [location.pathname]);

    useEffect(() => {
        if (!observabilityEnabled || typeof window === 'undefined') return undefined;

        const handleOnline = () => recordConnectivityChange(false);
        const handleOffline = () => recordConnectivityChange(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return null;
}
