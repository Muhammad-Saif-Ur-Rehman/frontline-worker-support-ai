import { EmergencyRequest, TriageResult, ServiceMatch, AgentResponse } from '../types';
import { SERVICES, SERVICE_KEYWORDS } from '../data/services';

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

      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1200));

      const text = request.text.toLowerCase();
      const serviceScores: { [key: string]: number } = {};

      // Analyze text for service type indicators
      for (const [serviceType, keywords] of Object.entries(SERVICE_KEYWORDS)) {
        const matchingKeywords = keywords.filter(keyword => text.includes(keyword));
        if (matchingKeywords.length > 0) {
          serviceScores[serviceType] = matchingKeywords.length / keywords.length;
        }
      }

      // Urgency-based service prioritization
      let preferredServiceType = 'hospital'; // default
      if (triageResult.urgency === 'High') {
        if (serviceScores.emergency) preferredServiceType = 'emergency';
        else if (serviceScores.hospital) preferredServiceType = 'hospital';
      }

      // Find best matching service
      const candidateServices = SERVICES.filter(s => 
        s.serviceType === preferredServiceType && s.availability
      );

      if (candidateServices.length === 0) {
        throw new Error(`No available ${preferredServiceType} services found`);
      }

      // Select best service (highest confidence + availability)
      const bestService = candidateServices.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );

      return {
        success: true,
        data: bestService,
        reasoning: `Matched request to ${bestService.serviceType} based on keywords and urgency level (${triageResult.urgency}). Selected ${bestService.serviceName} with ${(bestService.confidence * 100).toFixed(0)}% confidence.`,
        confidence: bestService.confidence,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: `Service guidance failed: ${error}`,
        reasoning: 'Error in AI-based service matching',
        confidence: 0,
        processingTime: Date.now() - startTime
      };
    }
  }

  private degradedMatching(
    request: EmergencyRequest, 
    triageResult: TriageResult, 
    startTime: number
  ): AgentResponse<ServiceMatch> {
    const text = request.text.toLowerCase();
    
    // Simple rule-based matching
    let serviceType: string = 'hospital';
    
    if (text.includes('police') || text.includes('crime') || text.includes('theft')) {
      serviceType = 'police';
    } else if (text.includes('fire') || text.includes('burning')) {
      serviceType = 'fire';
    } else if (triageResult.urgency === 'High') {
      serviceType = 'emergency';
    }

    const availableServices = SERVICES.filter(s => s.serviceType === serviceType && s.availability);
    const selectedService = availableServices[0] || SERVICES[0]; // fallback to first available

    return {
      success: true,
      data: { ...selectedService, confidence: 0.5 },
      reasoning: `DEGRADED MODE: Rule-based service matching. Selected ${selectedService.serviceName} based on simple keyword rules.`,
      confidence: 0.5,
      processingTime: Date.now() - startTime
    };
  }
}