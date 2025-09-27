import { EmergencyRequest, ServiceMatch, EquityLog, AgentResponse } from '../types';

export class EquityAgent {
  async logEquityData(
    request: EmergencyRequest,
    service: ServiceMatch,
    responseTime: number,
    isDegraded = false
  ): Promise<AgentResponse<EquityLog>> {
    const startTime = Date.now();

    try {
      if (isDegraded) {
        return this.degradedEquityLog(request, service, responseTime, startTime);
      }

      // Simulate equity analysis
      await new Promise(resolve => setTimeout(resolve, 400));

      const fairnessScore = this.calculateFairnessScore(service, responseTime);
      const demographic = this.inferDemographic(request);

      const equityLog: EquityLog = {
        requestId: request.id,
        demographic,
        serviceType: service.serviceType,
        responseTime,
        fairnessScore,
        notes: this.generateEquityNotes(fairnessScore, service, responseTime)
      };

      return {
        success: true,
        data: equityLog,
        reasoning: `Equity analysis completed. Fairness score: ${fairnessScore.toFixed(2)}/1.0. Service distribution and response time within acceptable ranges.`,
        confidence: 0.88,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: `Equity logging failed: ${error}`,
        reasoning: 'Error in equity monitoring system',
        confidence: 0,
        processingTime: Date.now() - startTime
      };
    }
  }

  private degradedEquityLog(
    request: EmergencyRequest,
    service: ServiceMatch,
    responseTime: number,
    startTime: number
  ): AgentResponse<EquityLog> {
    const equityLog: EquityLog = {
      requestId: request.id,
      serviceType: service.serviceType,
      responseTime,
      fairnessScore: 0.7, // Default score in degraded mode
      notes: 'DEGRADED MODE: Basic equity logging without detailed analysis.'
    };

    return {
      success: true,
      data: equityLog,
      reasoning: 'DEGRADED MODE: Minimal equity data recorded for oversight.',
      confidence: 0.4,
      processingTime: Date.now() - startTime
    };
  }

  private calculateFairnessScore(service: ServiceMatch, responseTime: number): number {
    let score = 0.8; // Base score

    // Service availability factor
    if (service.availability) score += 0.1;

    // Response time factor (lower is better)
    if (responseTime < 2000) score += 0.1;
    else if (responseTime > 5000) score -= 0.1;

    // Service quality factor
    if (service.confidence > 0.9) score += 0.05;

    return Math.max(0, Math.min(1, score));
  }

  private inferDemographic(request: EmergencyRequest): string | undefined {
    // This would normally use privacy-preserving demographic analysis
    // For demo purposes, we'll use general location-based inference
    const text = request.text.toLowerCase();
    
    if (text.includes('islamabad')) return 'urban';
    if (text.includes('rawalpindi')) return 'suburban';
    
    return undefined; // Maintain privacy by default
  }

  private generateEquityNotes(fairnessScore: number, service: ServiceMatch, responseTime: number): string {
    let notes = [];
    
    if (fairnessScore >= 0.9) {
      notes.push('Excellent service equity maintained');
    } else if (fairnessScore >= 0.7) {
      notes.push('Good service distribution');
    } else {
      notes.push('Service equity needs attention');
    }

    if (responseTime < 3000) {
      notes.push('Fast response time achieved');
    }

    notes.push(`Service type: ${service.serviceType}, Provider: ${service.serviceName}`);

    return notes.join('. ');
  }
}