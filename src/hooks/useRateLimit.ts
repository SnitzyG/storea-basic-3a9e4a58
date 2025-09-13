import { useState, useCallback } from 'react';

interface RateLimitState {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitState>();
  
  checkLimit(key: string, maxRequests: number = 5, windowMs: number = 300000): { allowed: boolean; resetIn?: number } {
    const now = Date.now();
    const limit = this.limits.get(key);
    
    if (!limit || now > limit.resetTime) {
      // Reset or create new limit
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return { allowed: true };
    }
    
    if (limit.count >= maxRequests) {
      return { 
        allowed: false, 
        resetIn: Math.ceil((limit.resetTime - now) / 1000) 
      };
    }
    
    limit.count++;
    return { allowed: true };
  }
  
  cleanup() {
    const now = Date.now();
    for (const [key, limit] of this.limits.entries()) {
      if (now > limit.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

const globalRateLimiter = new RateLimiter();

// Cleanup every 5 minutes
setInterval(() => globalRateLimiter.cleanup(), 300000);

export interface UseRateLimitResult {
  checkInviteLimit: (projectId: string, userId: string) => { allowed: boolean; resetIn?: number };
}

export const useRateLimit = (): UseRateLimitResult => {
  const checkInviteLimit = useCallback((projectId: string, userId: string) => {
    const key = `invite_${userId}_${projectId}`;
    return globalRateLimiter.checkLimit(key, 5, 300000); // 5 invites per 5 minutes
  }, []);

  return {
    checkInviteLimit
  };
};