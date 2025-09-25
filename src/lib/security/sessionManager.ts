interface SessionData {
  lastActivity: number;
  deviceFingerprint: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: number;
}

export class SessionManager {
  private static readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static readonly SESSION_CHECK_INTERVAL = 60 * 1000; // 1 minute
  private static readonly STORAGE_KEY = 'session_data';
  
  private sessionData: SessionData | null = null;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private onSessionExpired?: () => void;

  constructor(onSessionExpired?: () => void) {
    this.onSessionExpired = onSessionExpired;
    this.initializeSession();
    this.startInactivityMonitoring();
  }

  private initializeSession(): void {
    const stored = localStorage.getItem(SessionManager.STORAGE_KEY);
    if (stored) {
      try {
        this.sessionData = JSON.parse(stored);
        this.validateSession();
      } catch (error) {
        console.warn('Invalid session data found, clearing...');
        this.clearSession();
      }
    }
  }

  private validateSession(): void {
    if (!this.sessionData) return;

    const now = Date.now();
    const timeSinceActivity = now - this.sessionData.lastActivity;

    // Check for session timeout
    if (timeSinceActivity > SessionManager.INACTIVITY_TIMEOUT) {
      console.warn('Session expired due to inactivity');
      this.expireSession();
      return;
    }

    // Check for potential session hijacking
    const currentFingerprint = this.generateDeviceFingerprint();
    if (this.sessionData.deviceFingerprint !== currentFingerprint) {
      console.warn('Potential session hijacking detected - device fingerprint mismatch');
      this.expireSession();
      return;
    }
  }

  private generateDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('fingerprint', 10, 10);
    const canvasFingerprint = canvas.toDataURL();

    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      canvas: canvasFingerprint.slice(-50), // Last 50 chars for brevity
    };

    return btoa(JSON.stringify(fingerprint));
  }

  startSession(userAgent?: string, ipAddress?: string): void {
    const now = Date.now();
    this.sessionData = {
      lastActivity: now,
      deviceFingerprint: this.generateDeviceFingerprint(),
      userAgent,
      ipAddress,
      createdAt: now
    };
    
    this.saveSession();
    this.resetInactivityTimer();
  }

  updateActivity(): void {
    if (!this.sessionData) return;
    
    this.sessionData.lastActivity = Date.now();
    this.saveSession();
    this.resetInactivityTimer();
  }

  private saveSession(): void {
    if (this.sessionData) {
      localStorage.setItem(SessionManager.STORAGE_KEY, JSON.stringify(this.sessionData));
    }
  }

  private clearSession(): void {
    this.sessionData = null;
    localStorage.removeItem(SessionManager.STORAGE_KEY);
    this.stopInactivityTimer();
  }

  private expireSession(): void {
    this.clearSession();
    this.onSessionExpired?.();
  }

  private startInactivityMonitoring(): void {
    // Monitor user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      this.updateActivity();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Periodic session validation
    setInterval(() => {
      this.validateSession();
    }, SessionManager.SESSION_CHECK_INTERVAL);
  }

  private resetInactivityTimer(): void {
    this.stopInactivityTimer();
    
    this.inactivityTimer = setTimeout(() => {
      console.log('Session expired due to inactivity');
      this.expireSession();
    }, SessionManager.INACTIVITY_TIMEOUT);
  }

  private stopInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  getSessionAge(): number {
    return this.sessionData ? Date.now() - this.sessionData.createdAt : 0;
  }

  getLastActivity(): number {
    return this.sessionData?.lastActivity || 0;
  }

  isSessionValid(): boolean {
    if (!this.sessionData) return false;
    
    const now = Date.now();
    const timeSinceActivity = now - this.sessionData.lastActivity;
    
    return timeSinceActivity <= SessionManager.INACTIVITY_TIMEOUT;
  }

  destroy(): void {
    this.clearSession();
  }
}