const observabilityEnabled = import.meta.env.PROD && Boolean(import.meta.env.VITE_SENTRY_DSN);

let sdkPromise;

async function loadObservabilitySdk() {
    if (!observabilityEnabled) return null;

    if (!sdkPromise) {
        sdkPromise = import('../sentry')
            .then((sdk) => {
                sdk.initializeSentry();
                return sdk;
            })
            .catch(() => null);
    }

    return sdkPromise;
}

export async function captureTechnicalError(error, context = {}) {
    const sdk = await loadObservabilitySdk();
    if (!sdk) return null;
    return sdk.captureTechnicalError(error, context);
}

export async function recordRouteChange(pathname) {
    const sdk = await loadObservabilitySdk();
    if (!sdk) return false;
    sdk.recordRouteChange(pathname);
    return true;
}

export async function recordConnectivityChange(isOffline) {
    const sdk = await loadObservabilitySdk();
    if (!sdk) return false;
    sdk.recordConnectivityChange(isOffline);
    return true;
}
