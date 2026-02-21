import { v4 as uuidv4 } from 'uuid'
import { supabase } from './supabase'

// Analytics event types
export type AnalyticsEvent = 
  | 'page_view'
  | 'session_start'
  | 'preset_selected'
  | 'input_change'
  | 'run_started'
  | 'week_advanced'
  | 'year_advanced'
  | 'run_completed'
  | 'results_viewed'
  | 'ai_opened'
  | 'ai_question'
  | 'ai_response'

interface AnalyticsPayload {
  [key: string]: any
}

class Analytics {
  private anonUserId: string | null = null
  private sessionId: string | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeIds()
    }
  }

  private initializeIds() {
    // Get or create anonymous user ID (persistent across sessions)
    this.anonUserId = localStorage.getItem('anon_user_id')
    if (!this.anonUserId) {
      this.anonUserId = uuidv4()
      localStorage.setItem('anon_user_id', this.anonUserId)
    }

    // Generate new session ID for each session
    this.sessionId = uuidv4()
    
    // Log session start
    this.logEvent('session_start', {
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      url: window.location.href
    })
  }

  async logEvent(eventName: AnalyticsEvent, payload: AnalyticsPayload = {}) {
    if (!this.anonUserId || !this.sessionId) {
      console.warn('Analytics not initialized')
      return
    }

    try {
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          session_id: this.sessionId,
          anon_user_id: this.anonUserId,
          event_name: eventName,
          payload: payload
        })

      if (error) {
        console.error('Analytics error:', error)
      }
    } catch (error) {
      console.error('Failed to log analytics event:', error)
    }
  }

  getAnonUserId(): string | null {
    return this.anonUserId
  }

  getSessionId(): string | null {
    return this.sessionId
  }
}

// Export singleton instance
export const analytics = new Analytics()
