import { EmergencyRequest, ServiceMatch, BookingRecord, AgentResponse } from '../types';

export class BookingAgent {
  async createBooking(
    request: EmergencyRequest,
    service: ServiceMatch,
    urgency: string,
    isDegraded = false
  ): Promise<AgentResponse<BookingRecord>> {
    const startTime = Date.now();

    try {
      if (isDegraded) {
        return this.degradedBooking(request, service, urgency, startTime);
      }

      // Simulate booking API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // Generate booking ID
      const bookingId = this.generateBookingId();
      
      // Calculate scheduled time based on urgency
      const scheduledTime = this.calculateScheduledTime(urgency);

      const booking: BookingRecord = {
        bookingId,
        serviceId: service.serviceId,
        urgency,
        requestText: request.text,
        scheduledTime,
        status: 'confirmed',
        createdAt: new Date()
      };

      return {
        success: true,
        data: booking,
        reasoning: `Successfully created booking ${bookingId} for ${service.serviceName}. Scheduled for ${scheduledTime} based on ${urgency} urgency.`,
        confidence: 0.95,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: `Booking creation failed: ${error}`,
        reasoning: 'Error in automated booking system',
        confidence: 0,
        processingTime: Date.now() - startTime
      };
    }
  }

  private degradedBooking(
    request: EmergencyRequest,
    service: ServiceMatch, 
    urgency: string,
    startTime: number
  ): AgentResponse<BookingRecord> {
    const bookingId = this.generateBookingId();
    
    const booking: BookingRecord = {
      bookingId,
      serviceId: service.serviceId,
      urgency,
      requestText: request.text,
      scheduledTime: 'To be confirmed by service provider',
      status: 'pending',
      createdAt: new Date()
    };

    return {
      success: true,
      data: booking,
      reasoning: `DEGRADED MODE: Basic booking record created. Manual confirmation required. Booking ID: ${bookingId}`,
      confidence: 0.6,
      processingTime: Date.now() - startTime
    };
  }

  private generateBookingId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `BK-${timestamp}-${random}`.toUpperCase();
  }

  private calculateScheduledTime(urgency: string): string {
    const now = new Date();
    
    switch (urgency) {
      case 'High':
        // Immediate - within 15 minutes
        now.setMinutes(now.getMinutes() + 15);
        return `Immediate dispatch - Expected arrival: ${now.toLocaleTimeString()}`;
      
      case 'Medium':
        // Within 2 hours
        now.setHours(now.getHours() + 2);
        return `Today at ${now.toLocaleTimeString()}`;
      
      case 'Low':
        // Next available slot (tomorrow)
        now.setDate(now.getDate() + 1);
        now.setHours(9, 0, 0); // 9 AM tomorrow
        return `Tomorrow at ${now.toLocaleTimeString()}`;
      
      default:
        return 'To be scheduled';
    }
  }
}