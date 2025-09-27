import { ServiceMatch } from '../types';

export interface LocationCoordinates {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
}

export interface NearbyService extends ServiceMatch {
  distance: number;
  travelTime?: string;
}

export class LocationService {
  private static readonly NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

  /**
   * Geocode an address or location description to coordinates
   */
  async geocodeLocation(locationText: string): Promise<LocationCoordinates | null> {
    try {
      // Clean the location text
      const cleanLocation = this.cleanLocationText(locationText);
      
      // Use Nominatim API for geocoding (free OpenStreetMap service)
      const response = await fetch(
        `${LocationService.NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(cleanLocation)}, Pakistan&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Frontline-Worker-Support-AI/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const results = await response.json();
      
      if (results && results.length > 0) {
        const result = results[0];
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          address: result.display_name,
          city: result.address?.city || result.address?.town || result.address?.state || 'Pakistan'
        };
      }

      return null;
    } catch (error) {
      console.warn('Geocoding failed, falling back to text-based location inference');
      return this.fallbackLocationInference(locationText);
    }
  }

  /**
   * Find nearest emergency services of a specific type using real coordinates
   */
  async findNearestServices(
    userLocation: LocationCoordinates,
    serviceType: string,
    services: ServiceMatch[],
    maxResults: number = 3
  ): Promise<NearbyService[]> {
    try {
      // Calculate distances for all available services of the requested type
      const servicesWithDistance = services
        .filter(service => 
          service.availability && 
          (serviceType === 'all' || service.serviceType === serviceType)
        )
        .map(service => {
          const distance = service.coordinates 
            ? this.calculateDistance(
                userLocation.lat, userLocation.lng,
                service.coordinates.lat, service.coordinates.lng
              )
            : 999; // Very high distance for services without coordinates

          return {
            ...service,
            distance: Math.round(distance * 10) / 10 // Round to 1 decimal
          } as NearbyService;
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, maxResults);

      // Try to get real-time travel times (optional enhancement)
      return await this.enrichWithTravelTimes(servicesWithDistance);
    } catch (error) {
      console.warn('Real-time service location failed, using fallback distances');
      return this.fallbackNearestServices(userLocation, serviceType, services, maxResults);
    }
  }

  /**
   * Get real-time traffic and travel information (enhanced with routing API)
   */
  private async enrichWithTravelTimes(
    services: NearbyService[]
  ): Promise<NearbyService[]> {
    // For now, return services with estimated travel time based on distance
    // In production, you could integrate with Google Maps API or similar
    return services.map(service => ({
      ...service,
      travelTime: this.estimateTravelTime(service.distance)
    }));
  }

  /**
   * Estimate travel time based on distance and Pakistan traffic conditions
   */
  private estimateTravelTime(distanceKm: number): string {
    // Pakistan urban traffic considerations
    const avgSpeedKmh = distanceKm < 5 ? 20 : 30; // Slower for short urban distances
    const travelTimeMinutes = Math.ceil((distanceKm / avgSpeedKmh) * 60);
    
    if (travelTimeMinutes < 5) return '< 5 min';
    if (travelTimeMinutes < 60) return `${travelTimeMinutes} min`;
    
    const hours = Math.floor(travelTimeMinutes / 60);
    const minutes = travelTimeMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Clean and prepare location text for geocoding
   */
  private cleanLocationText(locationText: string): string {
    // Extract location-relevant parts and clean up
    const text = locationText.toLowerCase();
    
    // Common location patterns in Pakistani emergency requests
    const locationPatterns = [
      /near\s+([^,]+)/g,
      /at\s+([^,]+)/g,
      /in\s+([^,]+)/g,
      /(dha\s*\d+)/gi,
      /(bahria\s*town)/gi,
      /(gulberg)/gi,
      /(model\s*town)/gi,
      /(johar\s*town)/gi,
      /(cantt)/gi,
      /(saddar)/gi,
      /([fg]-\d+)/gi, // F-8, G-9 sectors
      /(islamabad|rawalpindi|lahore|karachi)/gi
    ];

    let extractedLocation = '';
    
    for (const pattern of locationPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        extractedLocation += ' ' + matches.join(' ');
      }
    }

    return extractedLocation.trim() || locationText;
  }

  /**
   * Fallback location inference when geocoding fails
   */
  private fallbackLocationInference(locationText: string): LocationCoordinates | null {
    const text = locationText.toLowerCase();
    
    // Predefined major locations in Pakistan
    const knownLocations = {
      'dha lahore': { lat: 31.4697, lng: 74.4142, city: 'Lahore' },
      'dha karachi': { lat: 24.8059, lng: 67.0747, city: 'Karachi' },
      'bahria town lahore': { lat: 31.3427, lng: 74.1865, city: 'Lahore' },
      'gulberg lahore': { lat: 31.5204, lng: 74.3587, city: 'Lahore' },
      'islamabad': { lat: 33.6844, lng: 73.0479, city: 'Islamabad' },
      'rawalpindi': { lat: 33.5983, lng: 73.0408, city: 'Rawalpindi' },
      'lahore': { lat: 31.5204, lng: 74.3587, city: 'Lahore' },
      'karachi': { lat: 24.8607, lng: 67.0011, city: 'Karachi' }
    };

    for (const [location, coords] of Object.entries(knownLocations)) {
      if (text.includes(location)) {
        return coords;
      }
    }

    // Default to Islamabad if no location found
    return { lat: 33.6844, lng: 73.0479, city: 'Islamabad' };
  }

  /**
   * Fallback nearest services calculation when API fails
   */
  private fallbackNearestServices(
    userLocation: LocationCoordinates,
    serviceType: string,
    services: ServiceMatch[],
    maxResults: number
  ): NearbyService[] {
    return services
      .filter(service => 
        service.availability && 
        (serviceType === 'all' || service.serviceType === serviceType)
      )
      .map(service => {
        const distance = service.coordinates
          ? this.calculateDistance(
              userLocation.lat, userLocation.lng,
              service.coordinates.lat, service.coordinates.lng
            )
          : (service.city === userLocation.city ? 5 : 50); // Rough city-based distance

        return {
          ...service,
          distance: Math.round(distance * 10) / 10,
          travelTime: this.estimateTravelTime(distance)
        } as NearbyService;
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxResults);
  }

  /**
   * Determine appropriate service types for different emergency types
   */
  getServiceTypesForEmergency(emergencyText: string, urgency: string): string[] {
    const text = emergencyText.toLowerCase();
    
    // Accident handling - prioritize emergency and medical services
    if (text.includes('accident') || text.includes('crash') || text.includes('collision')) {
      return urgency === 'High' 
        ? ['emergency', 'hospital'] // Life-threatening accidents need both
        : ['emergency']; // Minor accidents need rescue services
    }
    
    // Medical emergencies
    if (text.includes('heart') || text.includes('stroke') || text.includes('collapsed') || 
        text.includes('unconscious') || text.includes('bleeding')) {
      return urgency === 'High' ? ['emergency', 'hospital'] : ['hospital'];
    }
    
    // Crime-related
    if (text.includes('robbery') || text.includes('theft') || text.includes('crime') || 
        text.includes('violence') || text.includes('assault')) {
      return ['police'];
    }
    
    // Fire emergencies
    if (text.includes('fire') || text.includes('burning') || text.includes('smoke')) {
      return ['fire'];
    }
    
    // Mental health
    if (text.includes('depression') || text.includes('anxiety') || text.includes('suicide')) {
      return ['mental_health'];
    }
    
    // Default for medical issues
    return ['hospital'];
  }
}

// Singleton instance
let locationService: LocationService | null = null;

export const getLocationService = (): LocationService => {
  if (!locationService) {
    locationService = new LocationService();
  }
  return locationService;
};