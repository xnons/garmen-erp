import json
import urllib.request
import urllib.error
from typing import Optional
from fastapi import Request

def parse_device_info(user_agent: Optional[str]) -> str:
    """
    Mengubah User-Agent browser menjadi string perangkat yang mudah dibaca.
    Contoh output: '💻 Windows 10/11 (Chrome)', '📱 Android (Chrome Mobile)', '📱 iPhone (Safari Mobile)'
    """
    if not user_agent or user_agent.strip() == "":
        return "Perangkat Tidak Dikenal"
    
    ua = user_agent.lower()
    
    # 1. Deteksi OS & Tipe Device
    os_name = "Desktop / PC"
    icon = "💻"
    
    if "android" in ua:
        os_name = "Android"
        icon = "📱"
    elif "iphone" in ua:
        os_name = "iPhone (iOS)"
        icon = "📱"
    elif "ipad" in ua:
        os_name = "iPad (iPadOS)"
        icon = "📱"
    elif "windows nt 10.0" in ua or "windows" in ua:
        os_name = "Windows"
        icon = "💻"
    elif "macintosh" in ua or "mac os x" in ua:
        os_name = "macOS (Apple)"
        icon = "💻"
    elif "linux" in ua:
        os_name = "Linux"
        icon = "💻"

    # 2. Deteksi Browser
    browser_name = "Web Browser"
    if "edg/" in ua or "edge/" in ua:
        browser_name = "Microsoft Edge"
    elif "samsungbrowser" in ua:
        browser_name = "Samsung Internet"
    elif "chrome" in ua and "safari" in ua and "mobile" in ua:
        browser_name = "Chrome Mobile"
    elif "chrome" in ua and "safari" in ua:
        browser_name = "Google Chrome"
    elif "safari" in ua and "chrome" not in ua:
        browser_name = "Apple Safari"
    elif "firefox" in ua:
        browser_name = "Mozilla Firefox"
    elif "opr/" in ua or "opera" in ua:
        browser_name = "Opera"

    return f"{icon} {os_name} • {browser_name}"


def get_real_client_ip(request: Request) -> str:
    """
    Mendapatkan IP Address asli klien (melewati proxy Cloudflare / Render / Nginx).
    """
    # 1. Header x-forwarded-for
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        parts = [p.strip() for p in forwarded.split(",") if p.strip()]
        if parts:
            return parts[0]
            
    # 2. Header x-real-ip
    real_ip = request.headers.get("x-real-ip")
    if real_ip and real_ip.strip():
        return real_ip.strip()
        
    # 3. Direct client host
    if request.client and request.client.host:
        return request.client.host
        
    return "127.0.0.1"


def get_location_from_coords(lat: float, lon: float) -> str:
    """
    Mengubah koordinat GPS (Latitude & Longitude) menjadi nama wilayah/kota yang jelas dan akurat
    menggunakan reverse-geocoding OpenStreetMap Nominatim.
    """
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&zoom=14&addressdetails=1"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "NexoraERP-GeolocationEngine/1.2"}
        )
        with urllib.request.urlopen(req, timeout=2.5) as response:
            if response.status == 200:
                data = json.loads(response.read().decode("utf-8"))
                address = data.get("address", {})
                
                # Ekstrak komponen wilayah utama: kelurahan/suburb, kecamatan/kota, provinsi
                parts = []
                suburb = address.get("suburb") or address.get("village") or address.get("neighbourhood") or address.get("quarter")
                city = address.get("city") or address.get("town") or address.get("city_district") or address.get("county")
                state = address.get("state")
                
                if suburb and suburb not in parts:
                    parts.append(suburb)
                if city and city not in parts:
                    parts.append(city)
                if state and state not in parts:
                    parts.append(state)
                
                if parts:
                    return f"📍 {', '.join(parts)} (GPS)"
                
                if data.get("display_name"):
                    raw_display = data.get("display_name", "")
                    short_display = ", ".join(raw_display.split(",")[:3])
                    return f"📍 {short_display} (GPS)"
    except Exception as e:
        print(f"⚠️ Reverse geocode error: {e}")
    
    # Fallback jika service offline: gunakan format koordinat presisi
    return f"📍 Lat: {lat:.4f}, Lon: {lon:.4f} (GPS)"


def get_location_from_ip(ip: str, request: Optional[Request] = None) -> str:
    """
    Mendeteksi perkiraan lokasi (Kota, Negara / ISP) dari IP Address.
    Dilengkapi timeout cepat agar proses login tidak terhambat.
    """
    if not ip or ip in ["127.0.0.1", "::1", "localhost", "Unknown"]:
        return "📍 Jaringan Lokal / Server Kantor"

    # Cek private IP range (LAN)
    if ip.startswith("10.") or ip.startswith("192.168.") or ip.startswith("172."):
        return "📍 Wi-Fi Internal Kantor"

    # Cek header Cloudflare jika ada
    if request:
        cf_city = request.headers.get("cf-ipcity")
        cf_country = request.headers.get("cf-ipcountry")
        if cf_city and cf_country:
            return f"📍 {cf_city}, {cf_country}"

    # Lookup via IP Geolocation API Publik (Timeout 1.5 detik)
    try:
        url = f"http://ip-api.com/json/{ip}?fields=status,city,regionName,country,isp"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "NexoraERP-ClientTracker/1.0"}
        )
        with urllib.request.urlopen(req, timeout=1.5) as response:
            if response.status == 200:
                data = json.loads(response.read().decode("utf-8"))
                if data.get("status") == "success":
                    city = data.get("city") or data.get("regionName") or ""
                    country = data.get("country") or "Indonesia"
                    isp = data.get("isp") or ""
                    
                    parts = []
                    if city:
                        parts.append(city)
                    if country:
                        parts.append(country)
                    loc_str = ", ".join(parts)
                    if isp:
                        loc_str += f" ({isp})"
                    return f"📍 {loc_str}"
    except Exception:
        pass

    return f"📍 Indonesia (IP: {ip})"
