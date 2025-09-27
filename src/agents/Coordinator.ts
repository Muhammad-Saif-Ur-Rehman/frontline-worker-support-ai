import { EmergencyRequest, CoordinatorResult, ProcessingStep, AgentResponse } from '../types';
import { TriageAgent } from './TriageAgent';
import { GuidanceAgent } from './GuidanceAgent';
import { BookingAgent } from './BookingAgent';
import { FollowUpAgent } from './FollowUpAgent';
import { EquityAgent } from './EquityAgent';

export class Coordinator {
  private triageAgent = new TriageAgent();
  private guidanceAgent = new GuidanceAgent();
  private bookingAgent = new BookingAgent();
  private followUpAgent = new FollowUpAgent();
  private equityAgent = new EquityAgent();
  
  private determineProcessingMode(forceMode?: 'normal' | 'degraded' | 'conflict'): 'normal' | 'degraded' {
    if (forceMode === 'degraded') {
      return 'degraded';
    } else if (forceMode === 'conflict') {
      // Conflict mode uses normal processing but triggers conflict resolution
      return 'normal';
    } else if (forceMode === 'normal') {
      return 'normal';
    } else {
      // Auto-detect degraded conditions (simulate network/system issues)
      const systemHealth = this.checkSystemHealth();
      return systemHealth.isHealthy ? 'normal' : 'degraded';
    }
  }
  
  private checkSystemHealth(): { isHealthy: boolean; issues: string[] } {
    // Simulate system health checks
    const issues: string[] = [];
    
    // Simulate random system issues (10% chance)
    if (Math.random() < 0.1) {
      issues.push('Network connectivity issues detected');
    }
    
    if (Math.random() < 0.05) {
      issues.push('AI service API rate limit exceeded');
    }
    
    if (Math.random() < 0.03) {
      issues.push('Database connection unstable');
    }
    
    return {
      isHealthy: issues.length === 0,
      issues
    };
  }

  async processRequest(
    request: EmergencyRequest,
    forceMode?: 'normal' | 'degraded' | 'conflict'
  ): Promise<CoordinatorResult> {
    const processingTrace: ProcessingStep[] = [];
    const conflicts: string[] = [];
    
    // Meta-Agent determines processing mode based on system conditions
    const mode = this.determineProcessingMode(forceMode);
    const shouldTriggerConflict = forceMode === 'conflict';
    
    // Log mode determination
    const modeStep = this.createProcessingStep('Coordinator', 'processing');
    modeStep.reasoning = `Meta-Agent determined processing mode: ${mode}${shouldTriggerConflict ? ' (with conflict simulation)' : ''}`;
    processingTrace.push(modeStep);
    this.updateStep(modeStep, 'completed');

    try {
      // Step 1: Triage Analysis
      const triageStep = this.createProcessingStep('TriageAgent', 'processing');
      processingTrace.push(triageStep);

      const triageResponse = await this.triageAgent.analyze(request, mode === 'degraded');
      this.updateStep(triageStep, triageResponse.success ? 'completed' : 'error', triageResponse);

      if (!triageResponse.success || !triageResponse.data) {
        throw new Error('Triage analysis failed');
      }

      let finalUrgency = triageResponse.data.urgency;

      // Meta-Agent handles conflict resolution
      if (shouldTriggerConflict) {
        const conflictStep = this.createProcessingStep('Coordinator', 'processing');
        conflictStep.reasoning = 'Meta-Agent detecting and resolving conflicts between agents';
        processingTrace.push(conflictStep);
        
        const aiUrgency = triageResponse.data.urgency;
        const ruleBasedUrgency = this.getRuleBasedUrgency(request.text);
        
        if (aiUrgency !== ruleBasedUrgency) {
          conflicts.push(`Urgency conflict: AI=${aiUrgency}, Rules=${ruleBasedUrgency}`);
          finalUrgency = this.metaAgentResolveConflict(aiUrgency, ruleBasedUrgency);
          conflicts.push(`Resolved to: ${finalUrgency}`);
          conflictStep.reasoning = `Meta-Agent resolved urgency conflict: ${aiUrgency} vs ${ruleBasedUrgency} → ${finalUrgency}`;
        }
        
        this.updateStep(conflictStep, 'completed');
      }

      // Step 2: Service Guidance
      const guidanceStep = this.createProcessingStep('GuidanceAgent', 'processing');
      processingTrace.push(guidanceStep);

      const guidanceResponse = await this.guidanceAgent.findBestService(
        request, 
        triageResponse.data, 
        mode === 'degraded'
      );
      this.updateStep(guidanceStep, guidanceResponse.success ? 'completed' : 'error', guidanceResponse);

      if (!guidanceResponse.success || !guidanceResponse.data) {
        throw new Error('Service guidance failed');
      }

      // Step 3: Booking Creation
      const bookingStep = this.createProcessingStep('BookingAgent', 'processing');
      processingTrace.push(bookingStep);

      const bookingResponse = await this.bookingAgent.createBooking(
        request,
        guidanceResponse.data,
        finalUrgency,
        mode === 'degraded'
      );
      this.updateStep(bookingStep, bookingResponse.success ? 'completed' : 'error', bookingResponse);

      if (!bookingResponse.success || !bookingResponse.data) {
        throw new Error('Booking creation failed');
      }

      // Step 4: Follow-up Generation
      const followUpStep = this.createProcessingStep('FollowUpAgent', 'processing');
      processingTrace.push(followUpStep);

      const followUpResponse = await this.followUpAgent.generateFollowUp(
        bookingResponse.data,
        guidanceResponse.data,
        mode === 'degraded'
      );
      this.updateStep(followUpStep, followUpResponse.success ? 'completed' : 'error', followUpResponse);

      if (!followUpResponse.success || !followUpResponse.data) {
        throw new Error('Follow-up generation failed');
      }

      // Step 5: Equity Logging
      const equityStep = this.createProcessingStep('EquityAgent', 'processing');
      processingTrace.push(equityStep);

      const totalProcessingTime = processingTrace.reduce((sum, step) => sum + (step.duration || 0), 0);
      const equityResponse = await this.equityAgent.logEquityData(
        request,
        guidanceResponse.data,
        totalProcessingTime,
        mode === 'degraded'
      );
      this.updateStep(equityStep, equityResponse.success ? 'completed' : 'error', equityResponse);

      if (!equityResponse.success || !equityResponse.data) {
        throw new Error('Equity logging failed');
      }

      // Return comprehensive result
      return {
        requestId: request.id,
        finalUrgency,
        selectedService: guidanceResponse.data,
        booking: bookingResponse.data,
        followUp: followUpResponse.data,
        equityLog: equityResponse.data,
        processingTrace,
        mode,
        conflicts
      };

    } catch (error) {
      // Mark any pending steps as error
      processingTrace.forEach(step => {
        if (step.status === 'processing') {
          step.status = 'error';
          step.reasoning = `Processing failed: ${error}`;
        }
      });

      throw new Error(`Coordinator processing failed: ${error}`);
    }
  }

  private createProcessingStep(agent: string, status: ProcessingStep['status']): ProcessingStep {
    return {
      agent,
      status,
      timestamp: new Date()
    };
  }

  private updateStep(step: ProcessingStep, status: ProcessingStep['status'], response?: AgentResponse) {
    step.status = status;
    step.duration = Date.now() - step.timestamp.getTime();
    
    if (response) {
      step.result = response.data;
      step.reasoning = response.reasoning;
    }
  }

  private getRuleBasedUrgency(text: string): 'High' | 'Medium' | 'Low' {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('collapsed') || lowerText.includes('unconscious') || 
        lowerText.includes('critical') || lowerText.includes('emergency')) {
      return 'High';
    }
    
    if (lowerText.includes('urgent') || lowerText.includes('pain') || 
        lowerText.includes('accident')) {
      return 'Medium';
    }
    
    return 'Low';
  }

  private metaAgentResolveConflict(aiUrgency: string, ruleBasedUrgency: string): 'High' | 'Medium' | 'Low' {
    // Meta-Agent conflict resolution: Always escalate to higher urgency for safety
    const urgencyLevels = { 'Low': 1, 'Medium': 2, 'High': 3 };
    const aiLevel = urgencyLevels[aiUrgency as keyof typeof urgencyLevels] || 1;
    const ruleLevel = urgencyLevels[ruleBasedUrgency as keyof typeof urgencyLevels] || 1;
    
    const maxLevel = Math.max(aiLevel, ruleLevel);
    
    return Object.keys(urgencyLevels).find(
      key => urgencyLevels[key as keyof typeof urgencyLevels] === maxLevel
    ) as 'High' | 'Medium' | 'Low';
  }
}