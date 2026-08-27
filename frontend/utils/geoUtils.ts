/**
 * Utilitas Deteksi & Reverse-Geocoding Lokasi Presisi Browser (GPS)
 * Digunakan untuk audit log keamanan login pada Nexora Garment ERP.
 */

export interface GeoLocationResult {
    latitude?: number;
    longitude?: number;
    locationName?: string;
    accuracy?: number;
    status: 'granted' | 'denied' | 'unavailable' | 'timeout' | 'unsupported';
    error?: string;
}

/**
 * Mengambil koordinat GPS presisi dari browser user
 */
export async function getBrowserCoordinates(timeoutMs: number = 4000): Promise<{ latitude: number; longitude: number; accuracy: number } | null> {
    if (typeof window === 'undefined' || !navigator.geolocation) {
        return null;
    }

    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            resolve(null);
        }, timeoutMs);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                clearTimeout(timer);
                resolve({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy
                });
            },
            (err) => {
                clearTimeout(timer);
                console.warn('⚠️ Gagal memperoleh izin lokasi GPS:', err.message);
                resolve(null);
            },
            {
                enableHighAccuracy: true,
                timeout: timeoutMs,
                maximumAge: 60000 // Cache 1 menit
            }
        );
    });
}

/**
 * Mengubah koordinat (latitude, longitude) menjadi nama wilayah yang manusiawi (Reverse Geocoding)
 */
export async function reverseGeocodeCoords(lat: number, lon: number): Promise<string> {
    try {
        // Coba via OpenStreetMap Nominatim
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`;
        const res = await fetch(url, {
            headers: { 'Accept-Language': 'id,en' }
        });

        if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};

            const parts: string[] = [];
            const suburb = addr.suburb || addr.village || addr.neighbourhood || addr.quarter;
            const city = addr.city || addr.town || addr.city_district || addr.county;
            const state = addr.state;

            if (suburb && !parts.includes(suburb)) parts.push(suburb);
            if (city && !parts.includes(city)) parts.push(city);
            if (state && !parts.includes(state)) parts.push(state);

            if (parts.length > 0) {
                return `📍 ${parts.join(', ')} (GPS)`;
            }

            if (data.display_name) {
                const shortName = data.display_name.split(',').slice(0, 3).join(',').trim();
                return `📍 ${shortName} (GPS)`;
            }
        }
    } catch (e) {
        console.warn('⚠️ Client reverse geocoding fallback to coords:', e);
    }

    return `📍 Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)} (GPS)`;
}

/**
 * Mengambil lokasi lengkap (koordinat + nama wilayah) secara asynchronous
 */
export async function getPreciseLocation(timeoutMs: number = 4000): Promise<GeoLocationResult> {
    if (typeof window === 'undefined' || !navigator.geolocation) {
        return { status: 'unsupported', error: 'Geolocation API tidak didukung browser ini.' };
    }

    try {
        const coords = await getBrowserCoordinates(timeoutMs);
        if (!coords) {
            return { status: 'unavailable', error: 'Izin lokasi tidak diberikan atau timeout.' };
        }

        const locationName = await reverseGeocodeCoords(coords.latitude, coords.longitude);

        return {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            locationName,
            status: 'granted'
        };
    } catch (err: any) {
        return {
            status: 'denied',
            error: err.message || 'Gagal mendeteksi lokasi'
        };
    }
}
