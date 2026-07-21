import type { RtcAnchorPoint, Vector3D } from './types';

/**
 * ============================================================================
 * SPATIAL ALIGNMENT MANAGER - GRASP Information Expert
 * ============================================================================
 * Pakar kalkulasi transformasi koordinat geospasial (WGS84 / UTM) ke
 * WebGL Local Center space menggunakan metode RTC (Relative To Center)
 * untuk mencegah floating-point precision loss (jittering vertex).
 * ============================================================================
 */
export class SpatialAlignmentManager {
  private static instance: SpatialAlignmentManager;

  private constructor() {}

  public static getInstance(): SpatialAlignmentManager {
    if (!SpatialAlignmentManager.instance) {
      SpatialAlignmentManager.instance = new SpatialAlignmentManager();
    }
    return SpatialAlignmentManager.instance;
  }

  /**
   * Menghitung titik jangkar RTC dari pusat centroid GeoJSON (longitude, latitude)
   */
  public computeRtcAnchor(
    longitude: number,
    latitude: number,
    altitude: number = 0
  ): RtcAnchorPoint {
    // Konversi Sederhana WGS84 ke Mercator Meter (Acuan Lokal Bogor)
    const earthRadius = 6378137.0;
    const radLat = (latitude * Math.PI) / 180;
    const localX = earthRadius * ((longitude * Math.PI) / 180);
    const localY = earthRadius * Math.log(Math.tan(Math.PI / 4 + radLat / 2));

    return {
      longitude,
      latitude,
      altitude,
      localCenter: {
        x: localX,
        y: localY,
        z: altitude,
      },
    };
  }

  /**
   * Menggeser titik koordinat WGS84 relatif terhadap RTC Anchor
   */
  public transformWgs84ToLocalRtc(
    longitude: number,
    latitude: number,
    altitude: number,
    rtcAnchor: RtcAnchorPoint
  ): Vector3D {
    const targetAnchor = this.computeRtcAnchor(longitude, latitude, altitude);

    return {
      x: targetAnchor.localCenter.x - rtcAnchor.localCenter.x,
      y: targetAnchor.localCenter.y - rtcAnchor.localCenter.y,
      z: altitude - rtcAnchor.altitude,
    };
  }

  /**
   * Menghitung rotasi sudut matahari (Azimuth & Altitude) untuk simulasi bayangan
   * berbasis jam dan bulan di wilayah Bogor (-6.5944° S, 106.7892° E)
   */
  public calculateSunPosition(
    hourOfDay: number,
    monthOfYear: number,
    lat: number = -6.5944,
    _lng: number = 106.7892
  ): { azimuth: number; altitude: number } {
    // Perhitungan Posisi Matahari Astronomis Sederhana (Solar Position Algorithm)
    const dayOfYear = monthOfYear * 30 - 15; // Estimasi pertengahan bulan
    const declination =
      23.45 * Math.sin((((284 + dayOfYear) * 360) / 365) * (Math.PI / 180));
    
    const hourAngle = (hourOfDay - 12) * 15; // 15 derajat per jam
    const latRad = (lat * Math.PI) / 180;
    const decRad = (declination * Math.PI) / 180;
    const hourRad = (hourAngle * Math.PI) / 180;

    // Altitude (Ketinggian Matahari dari Horizon)
    const sinAltitude =
      Math.sin(latRad) * Math.sin(decRad) +
      Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourRad);
    const altitude = Math.asin(Math.max(-1, Math.min(1, sinAltitude)));

    // Azimuth (Arah Angin Matahari)
    const cosAzimuth =
      (Math.sin(decRad) * Math.cos(latRad) -
        Math.cos(decRad) * Math.sin(latRad) * Math.cos(hourRad)) /
      Math.cos(altitude);
    let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAzimuth)));
    if (hourAngle > 0) azimuth = 2 * Math.PI - azimuth;

    return {
      azimuth: (azimuth * 180) / Math.PI,
      altitude: (altitude * 180) / Math.PI,
    };
  }
}
