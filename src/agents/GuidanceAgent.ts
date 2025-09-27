import { EmergencyRequest, TriageResult, ServiceMatch, AgentResponse } from '../types';
import { SERVICES, inferLocationFromText, getServicesByProximity } from '../data/services';
import { getGeminiService } from '../services/GeminiService';

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

      // Use real AI processing with Gemini - now with enhanced location awareness
      const geminiService = getGeminiService();
      
      const aiResponse = await geminiService.matchEmergencyServices(
        request.text,
        triageResult.urgency,
        request.location // Pass the original location text for better geocoding
      );

      if (!aiResponse.success || !aiResponse.content) {
        console.warn('Gemini AI service matching failed, falling back to rule-based matching');
        return this.degradedMatching(request, triageResult, startTime);
      }

      try {
        const aiAnalysis = geminiService.parseJsonResponse(aiResponse.content);
        
        // Find the selected service by ID
        const selectedService = SERVICES.find(s => s.serviceId === aiAnalysis.selectedServiceId);
        
        if (!selectedService) {
          console.warn('AI selected invalid service, falling back to rule-based matching');
          return this.degradedMatching(request, triageResult, startTime);
        }

        return {
          success: true,
          data: selectedService,
          reasoning: `AI Service Matching: ${aiAnalysis.reasoning}`,
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
}