export class CSRFProtection {
  private static readonly TOKEN_KEY = 'csrf_token';
  private static readonly HEADER_NAME = 'X-CSRF-Token';
  
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    // Store in sessionStorage (more secure than localStorage for CSRF tokens)
    sessionStorage.setItem(this.TOKEN_KEY, token);
    return token;
  }

  static getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  static validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return storedToken !== null && storedToken === token;
  }

  static addTokenToRequest(init: RequestInit = {}): RequestInit {
    const token = this.getToken();
    if (!token) {
      throw new Error('CSRF token not found');
    }

    return {
      ...init,
      headers: {
        ...init.headers,
        [this.HEADER_NAME]: token,
      },
    };
  }

  static clearToken(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }
}

// Generate initial token when module loads
if (typeof window !== 'undefined') {
  CSRFProtection.generateToken();
}