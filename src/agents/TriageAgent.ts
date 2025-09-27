import { EmergencyRequest, TriageResult, AgentResponse } from '../types';
import { URGENCY_KEYWORDS } from '../data/services';

export class TriageAgent {
  async analyze(request: EmergencyRequest, isDegraded = false): Promise<AgentResponse<TriageResult>> {
    const startTime = Date.now();
    
    try {
      if (isDegraded) {
        return this.degradedAnalysis(request, startTime);
      }

      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const text = request.text.toLowerCase();
      const keywords: string[] = [];
      let urgency: 'High' | 'Medium' | 'Low' = 'Low';
      let confidence = 0.8;

      // Advanced keyword analysis
      if (this.containsKeywords(text, URGENCY_KEYWORDS.high)) {
        urgency = 'High';
        confidence = 0.95;
        keywords.push(...URGENCY_KEYWORDS.high.filter(k => text.includes(k)));
      } else if (this.containsKeywords(text, URGENCY_KEYWORDS.medium)) {
        urgency = 'Medium';
        confidence = 0.88;
        keywords.push(...URGENCY_KEYWORDS.medium.filter(k => text.includes(k)));
      } else {
        urgency = 'Low';
        confidence = 0.75;
        keywords.push(...URGENCY_KEYWORDS.low.filter(k => text.includes(k)));
      }

      // Context-aware adjustments
      if (text.includes('father') || text.includes('mother') || text.includes('child')) {
        confidence += 0.1;
      }
      
      if (text.includes('islamabad') || text.includes('rawalpindi')) {
        confidence += 0.05;
      }

      const result: TriageResult = {
        urgency,
        confidence: Math.min(confidence, 1.0),
        reasoning: `Analyzed request text for medical emergency indicators. Found keywords: ${keywords.join(', ')}. Urgency determined based on severity patterns.`,
        keywords
      };

      return {
        success: true,
        data: result,
        reasoning: result.reasoning,
        confidence: result.confidence,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: `Triage analysis failed: ${error}`,
        reasoning: 'Error in AI-based triage analysis',
        confidence: 0,
        processingTime: Date.now() - startTime
      };
    }
  }

  private degradedAnalysis(request: EmergencyRequest, startTime: number): AgentResponse<TriageResult> {
    const text = request.text.toLowerCase();
    let urgency: 'High' | 'Medium' | 'Low' = 'Low';
    const keywords: string[] = [];

    // Simple rule-based fallback
    if (this.containsKeywords(text, URGENCY_KEYWORDS.high)) {
      urgency = 'High';
      keywords.push(...URGENCY_KEYWORDS.high.filter(k => text.includes(k)));
    } else if (this.containsKeywords(text, URGENCY_KEYWORDS.medium)) {
      urgency = 'Medium';
      keywords.push(...URGENCY_KEYWORDS.medium.filter(k => text.includes(k)));
    }

    const result: TriageResult = {
      urgency,
      confidence: 0.6, // Lower confidence in degraded mode
      reasoning: `DEGRADED MODE: Rule-based triage using keyword matching. Keywords found: ${keywords.join(', ') || 'none'}`,
      keywords
    };

    return {
      success: true,
      data: result,
      reasoning: result.reasoning,
      confidence: result.confidence,
      processingTime: Date.now() - startTime
    };
  }

  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }
}