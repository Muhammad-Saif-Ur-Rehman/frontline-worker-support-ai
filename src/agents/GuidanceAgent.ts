import { EmergencyRequest, TriageResult, ServiceMatch, AgentResponse } from '../types';
import { SERVICES } from '../data/services';
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

      // Use real AI processing with Gemini
      const availableServices = SERVICES.filter(s => s.availability);
      const geminiService = getGeminiService();
      
      const aiResponse = await geminiService.matchEmergencyServices(
        request.text,
        triageResult.urgency,
        availableServices
      );

      if (!aiResponse.success || !aiResponse.content) {
        console.warn('Gemini AI service matching failed, falling back to rule-based:', aiResponse.error);
        return this.degradedMatching(request, triageResult, startTime);
      }

      console.log('AI Response Content:', aiResponse.content); // Debug log

      try {
        const aiAnalysis = geminiService.parseJsonResponse(aiResponse.content);
        console.log('Parsed AI Analysis:', aiAnalysis); // Debug log
        
        // Find the selected service by ID
        const selectedService = SERVICES.find(s => s.serviceId === aiAnalysis.selectedServiceId);
        
        if (!selectedService) {
          console.warn('AI selected invalid service ID:', aiAnalysis.selectedServiceId);
          console.warn('Available service IDs:', SERVICES.map(s => s.serviceId));
          console.warn('Falling back to rule-based matching');
          return this.degradedMatching(request, triageResult, startTime);
        }

        console.log('Selected Service:', selectedService); // Debug log

        return {
          success: true,
          data: selectedService,
          reasoning: `AI Service Matching: ${aiAnalysis.reasoning}`,
          confidence: aiAnalysis.confidence || 0.8,
          processingTime: Date.now() - startTime
        };

      } catch (parseError) {
        console.error('Failed to parse AI service matching response:', parseError);
        return this.degradedMatching(request, triageResult, startTime);
      }

    } catch (error) {
      console.error('GuidanceAgent AI error:', error);
      return this.degradedMatching(request, triageResult, startTime);
    }
  }

  private degradedMatching(
    request: EmergencyRequest, 
    triageResult: TriageResult, 
    startTime: number
  ): AgentResponse<ServiceMatch> {
    const text = request.text.toLowerCase();
    console.log('Using degraded matching for text:', text); // Debug log
    
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

    console.log('Determined service type:', serviceType); // Debug log

    const availableServices = SERVICES.filter(s => s.serviceType === serviceType && s.availability);
    const selectedService = availableServices[0] || SERVICES[0]; // fallback to first available

    console.log('Selected service in degraded mode:', selectedService); // Debug log

    return {
      success: true,
      data: { ...selectedService, confidence: 0.5 },
      reasoning: `DEGRADED MODE: Rule-based service matching. Selected ${selectedService.serviceName} based on enhanced keyword rules.`,
      confidence: 0.5,
      processingTime: Date.now() - startTime
    };
  }
}