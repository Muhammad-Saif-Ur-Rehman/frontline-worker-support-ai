import { EmergencyRequest, TriageResult, AgentResponse } from '../types';
import { URGENCY_KEYWORDS } from '../data/services';
import { getGeminiService } from '../services/GeminiService';

export class TriageAgent {
  async analyze(request: EmergencyRequest, isDegraded = false): Promise<AgentResponse<TriageResult>> {
    const startTime = Date.now();
    
    try {
      if (isDegraded) {
        return this.degradedAnalysis(request, startTime);
      }

      // Use real AI processing with Gemini
      const geminiService = getGeminiService();
      const aiResponse = await geminiService.analyzeEmergencyTriage(request.text, request.location);

      if (!aiResponse.success || !aiResponse.content) {
        // Fallback to rule-based analysis if AI fails
        return this.degradedAnalysis(request, startTime);
      }

      try {
        const aiAnalysis = geminiService.parseJsonResponse(aiResponse.content);
        
        const result: TriageResult = {
          urgency: aiAnalysis.urgency,
          confidence: aiAnalysis.confidence || 0.8,
          reasoning: aiAnalysis.reasoning || 'AI-powered emergency triage analysis completed',
          keywords: aiAnalysis.keywords || []
        };

        return {
          success: true,
          data: result,
          reasoning: `AI Analysis: ${result.reasoning}`,
          confidence: result.confidence,
          processingTime: Date.now() - startTime
        };

      } catch (parseError) {
        return this.degradedAnalysis(request, startTime);
      }

    } catch (error) {
      // Fallback to rule-based analysis
      return this.degradedAnalysis(request, startTime);
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