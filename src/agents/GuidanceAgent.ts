import { EmergencyRequest, TriageResult, ServiceMatch, AgentResponse } from '../types';
import { SERVICES, inferLocationFromText, getServicesByProximity } from '../data/services';
import { getGeminiService } from '../services/GeminiService';
import { getLocationService } from '../services/LocationService';

export class GuidanceAgent {
  async findBestService(
    request: EmergencyRequest, 
    triageResult: TriageResult, 
    isDegraded = false
  ): Promise<AgentResponse<ServiceMatch>> {
    const startTime = Date.now();

    try {
      if (isDegraded) {
        return this.degradedMatching(request, triageResult, startTime);
      }

      // Step 1: Use LocationService for real location processing
      const locationService = getLocationService();
      let userLocation = null;
      let locationProcessingSuccess = false;

      if (request.location || request.text) {
        try {
          const locationText = request.location || request.text;
          userLocation = await locationService.geocodeLocation(locationText);
          locationProcessingSuccess = !!userLocation;
          
          if (userLocation) {
            console.log(`📍 Location geocoded: ${locationText} → ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`);
          } else {
            console.log('⚠️ Geocoding failed, using AI-only matching');
          }
        } catch (error) {
          console.warn('Location processing failed:', error);
        }
      }

      // Step 2: Use Gemini AI for service matching with location context
      const geminiService = getGeminiService();
      
      const aiResponse = await geminiService.matchEmergencyServices(
        request.text,
        triageResult.urgency,
        request.location // Pass the original location text for AI context
      );

      if (!aiResponse.success || !aiResponse.content) {
        console.warn('Gemini AI service matching failed, falling back to rule-based matching');
        return this.degradedMatching(request, triageResult, startTime);
      }

      try {
        const aiAnalysis = geminiService.parseJsonResponse(aiResponse.content);
        
        // Step 3: Find the selected service by ID
        let selectedService = SERVICES.find(s => s.serviceId === aiAnalysis.selectedServiceId);
        
        if (!selectedService) {
          console.warn('AI selected invalid service, falling back to rule-based matching');
          return this.degradedMatching(request, triageResult, startTime);
        }

        // Step 4: Enhance with location-specific data if we have user location
        if (userLocation && selectedService.coordinates) {
          const distance = this.calculateDistance(
            userLocation.lat, userLocation.lng,
            selectedService.coordinates.lat, selectedService.coordinates.lng
          );
          const travelTime = this.estimateTravelTime(distance);
          
          // Create enhanced service with location data
          selectedService = {
            ...selectedService,
            distance: Math.round(distance * 10) / 10,
            travelTime: travelTime,
            userLocation: userLocation.city || 'Pakistan'
          };

          console.log(`🎯 Service enhanced with location: ${selectedService.serviceName} (${selectedService.distance}km, ${selectedService.travelTime})`);
        } else if (selectedService) {
          console.log(`🎯 Service selected without location enhancement: ${selectedService.serviceName}`);
        }

        return {
          success: true,
          data: selectedService,
          reasoning: locationProcessingSuccess 
            ? `Location-aware AI matching: ${aiAnalysis.reasoning}` 
            : `AI Service Matching: ${aiAnalysis.reasoning}`,
          confidence: aiAnalysis.confidence || 0.8,
          processingTime: Date.now() - startTime
        };

      } catch (parseError) {
        console.warn('Failed to parse AI service matching response, falling back to rule-based matching');
        return this.degradedMatching(request, triageResult, startTime);
      }

    } catch (error) {
      console.warn('GuidanceAgent AI error, falling back to rule-based matching');
      return this.degradedMatching(request, triageResult, startTime);
    }
  }

  private degradedMatching(
    request: EmergencyRequest, 
    triageResult: TriageResult, 
    startTime: number
  ): AgentResponse<ServiceMatch> {
    const text = request.text.toLowerCase();
    
    // Get user location for proximity matching
    const userLocation = inferLocationFromText(request.text + ' ' + (request.location || ''));
    
    // Enhanced rule-based matching with better priority order
    let serviceType: string = 'hospital'; // default fallback
    
    // Car accidents and traffic emergencies - prioritize emergency services
    if (text.includes('accident') || text.includes('crash') || text.includes('collision') ||
        text.includes('car accident') || text.includes('vehicle') || text.includes('traffic accident')) {
      serviceType = 'emergency'; // Emergency services for accidents
    }
    // Crime and safety related keywords
    else if (text.includes('police') || text.includes('crime') || text.includes('theft') || 
        text.includes('robbery') || text.includes('robbed') || text.includes('stolen') ||
        text.includes('assault') || text.includes('violence') || text.includes('harassment') ||
        text.includes('fraud') || text.includes('suspicious')) {
      serviceType = 'police';
    } 
    // Fire related keywords
    else if (text.includes('fire') || text.includes('burning') || text.includes('smoke') || 
             text.includes('explosion') || text.includes('gas leak')) {
      serviceType = 'fire';
    } 
    // Mental health keywords
    else if (text.includes('depression') || text.includes('anxiety') || text.includes('suicide') ||
             text.includes('mental health') || text.includes('counseling')) {
      serviceType = 'mental_health';
    }
    // High urgency medical emergencies
    else if (triageResult.urgency === 'High') {
      serviceType = 'emergency';
    }

    // Use location-aware service selection in degraded mode
    const locationSortedServices = getServicesByProximity(SERVICES, userLocation, serviceType);
    const selectedService = locationSortedServices[0] || SERVICES[0]; // fallback to first available

    return {
      success: true,
      data: { ...selectedService, confidence: 0.5 },
      reasoning: `DEGRADED MODE: Location-aware rule-based service matching. Selected ${selectedService.serviceName} (${selectedService.distance}km away) based on proximity and keyword rules.`,
      confidence: 0.5,
      processingTime: Date.now() - startTime
    };
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
   * Estimate travel time based on distance and Pakistani traffic conditions
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
}