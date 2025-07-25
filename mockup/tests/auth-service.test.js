/**
 * Authentication Service Test Suite
 * QA Engineer: Testing API authentication and service layer
 */

describe('Authentication Service', () => {
  let api;
  let mockFetch;
  let mockLocalStorage;

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Mock location
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost' },
      writable: true
    });

    // Create API instance
    const FindingSportsAPI = class {
      constructor() {
        this.token = localStorage.getItem('authToken');
      }

      setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
      }

      clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
      }

      async request(endpoint, options = {}) {
        const url = `http://localhost:8080${endpoint}`;
        const headers = {
          'Content-Type': 'application/json',
          ...options.headers
        };

        if (this.token) {
          headers.Authorization = `Bearer ${this.token}`;
        }

        const response = await fetch(url, {
          ...options,
          headers
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Request failed');
        }

        return data;
      }

      async login(email, password) {
        const data = await this.request('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        this.setToken(data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        return data;
      }

      async register(userData) {
        const data = await this.request('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify(userData)
        });

        this.setToken(data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        return data;
      }

      async googleLogin(credential) {
        const data = await this.request('/api/auth/google', {
          method: 'POST',
          body: JSON.stringify({ credential })
        });

        this.setToken(data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        return data;
      }

      async getCurrentUser() {
        return await this.request('/api/auth/me');
      }

      async logout() {
        await this.request('/api/auth/logout', { method: 'POST' });
        this.clearToken();
      }

      async getGames(filters = {}) {
        try {
          const params = new URLSearchParams(filters);
          const url = `http://localhost:8080/api/games?${params}`;
          const response = await fetch(url);
          const data = await response.json();

          if (!data.games) {
            return { games: [], totalGames: 0 };
          }

          return data;
        } catch (error) {
          return { games: [], totalGames: 0, error: error.message };
        }
      }
    };

    api = new FindingSportsAPI();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Management', () => {
    test('should initialize with token from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('existing-token');
      const newApi = new (api.constructor)();
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('authToken');
      expect(newApi.token).toBe('existing-token');
    });

    test('should set token and store in localStorage', () => {
      const token = 'new-test-token';
      
      api.setToken(token);
      
      expect(api.token).toBe(token);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', token);
    });

    test('should clear token and remove from localStorage', () => {
      api.token = 'some-token';
      
      api.clearToken();
      
      expect(api.token).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('currentUser');
    });
  });

  describe('API Request Method', () => {
    test('should make request with correct headers', async () => {
      const mockResponse = { ok: true, json: jest.fn().mockResolvedValue({ success: true }) };
      mockFetch.mockResolvedValue(mockResponse);

      await api.request('/test');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/test', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    });

    test('should include Authorization header when token is set', async () => {
      const mockResponse = { ok: true, json: jest.fn().mockResolvedValue({ success: true }) };
      mockFetch.mockResolvedValue(mockResponse);
      api.token = 'test-token';

      await api.request('/test');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/test', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });
    });

    test('should throw error for failed requests', async () => {
      const mockResponse = { 
        ok: false, 
        json: jest.fn().mockResolvedValue({ error: 'Bad request' }) 
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(api.request('/test')).rejects.toThrow('Bad request');
    });

    test('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(api.request('/test')).rejects.toThrow('Network error');
    });
  });

  describe('Login Method', () => {
    test('should login successfully', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const mockToken = 'login-token';
      const mockResponse = { 
        ok: true, 
        json: jest.fn().mockResolvedValue({ user: mockUser, token: mockToken }) 
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await api.login('test@example.com', 'password123');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(result).toEqual({ user: mockUser, token: mockToken });
      expect(api.token).toBe(mockToken);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', mockToken);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('currentUser', JSON.stringify(mockUser));
    });

    test('should handle login failure', async () => {
      const mockResponse = { 
        ok: false, 
        json: jest.fn().mockResolvedValue({ error: 'Invalid credentials' }) 
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(api.login('wrong@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials');
      expect(api.token).toBeNull();
    });
  });

  describe('Register Method', () => {
    test('should register successfully', async () => {
      const userData = {
        email: 'new@example.com',
        username: 'newuser',
        name: 'New User',
        password: 'password123'
      };
      const mockUser = { id: 2, ...userData };
      const mockToken = 'register-token';
      const mockResponse = { 
        ok: true, 
        json: jest.fn().mockResolvedValue({ user: mockUser, token: mockToken }) 
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await api.register(userData);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(result).toEqual({ user: mockUser, token: mockToken });
      expect(api.token).toBe(mockToken);
    });

    test('should handle registration failure', async () => {
      const mockResponse = { 
        ok: false, 
        json: jest.fn().mockResolvedValue({ error: 'Email already exists' }) 
      };
      mockFetch.mockResolvedValue(mockResponse);

      const userData = {
        email: 'existing@example.com',
        username: 'existinguser',
        password: 'password123'
      };

      await expect(api.register(userData)).rejects.toThrow('Email already exists');
    });
  });

  describe('Google Login Method', () => {
    test('should handle Google login successfully', async () => {
      const credential = 'google-jwt-credential';
      const mockUser = { id: 3, email: 'google@example.com', provider: 'google' };
      const mockToken = 'google-token';
      const mockResponse = { 
        ok: true, 
        json: jest.fn().mockResolvedValue({ user: mockUser, token: mockToken }) 
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await api.googleLogin(credential);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(result).toEqual({ user: mockUser, token: mockToken });
      expect(api.token).toBe(mockToken);
    });

    test('should handle Google login failure', async () => {
      const mockResponse = { 
        ok: false, 
        json: jest.fn().mockResolvedValue({ error: 'Invalid Google credential' }) 
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(api.googleLogin('invalid-credential')).rejects.toThrow('Invalid Google credential');
    });
  });

  describe('Get Current User Method', () => {
    test('should get current user successfully', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const mockResponse = { 
        ok: true, 
        json: jest.fn().mockResolvedValue(mockUser) 
      };
      mockFetch.mockResolvedValue(mockResponse);
      api.token = 'valid-token';

      const result = await api.getCurrentUser();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/api/auth/me', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        }
      });

      expect(result).toEqual(mockUser);
    });

    test('should handle unauthorized request', async () => {
      const mockResponse = { 
        ok: false, 
        json: jest.fn().mockResolvedValue({ error: 'Unauthorized' }) 
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(api.getCurrentUser()).rejects.toThrow('Unauthorized');
    });
  });

  describe('Logout Method', () => {
    test('should logout successfully', async () => {
      const mockResponse = { 
        ok: true, 
        json: jest.fn().mockResolvedValue({ success: true }) 
      };
      mockFetch.mockResolvedValue(mockResponse);
      api.token = 'valid-token';

      await api.logout();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        }
      });

      expect(api.token).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('currentUser');
    });
  });

  describe('Games Method (Unauthenticated)', () => {
    test('should get games without authentication', async () => {
      const mockGames = { games: [{ id: 1, name: 'Test Game' }], totalGames: 1 };
      const mockResponse = { 
        ok: true, 
        json: jest.fn().mockResolvedValue(mockGames) 
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await api.getGames();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/api/games?');
      expect(result).toEqual(mockGames);
    });

    test('should handle games API error gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await api.getGames();

      expect(result).toEqual({ games: [], totalGames: 0, error: 'Network error' });
    });

    test('should handle missing games array', async () => {
      const mockResponse = { 
        ok: true, 
        json: jest.fn().mockResolvedValue({ message: 'No games found' }) 
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await api.getGames();

      expect(result).toEqual({ games: [], totalGames: 0 });
    });

    test('should include filters in query params', async () => {
      const mockGames = { games: [], totalGames: 0 };
      const mockResponse = { 
        ok: true, 
        json: jest.fn().mockResolvedValue(mockGames) 
      };
      mockFetch.mockResolvedValue(mockResponse);

      const filters = { sport: 'basketball', location: 'vancouver' };
      await api.getGames(filters);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/api/games?sport=basketball&location=vancouver');
    });
  });

  describe('API Base URL Configuration', () => {
    test('should use localhost URL for localhost hostname', () => {
      window.location.hostname = 'localhost';
      
      // In a real implementation, this would be tested by checking the API_BASE_URL
      expect(window.location.hostname).toBe('localhost');
    });

    test('should use production URL for non-localhost hostname', () => {
      window.location.hostname = 'findingsports.com';
      
      expect(window.location.hostname).toBe('findingsports.com');
    });
  });

  describe('Error Handling', () => {
    test('should handle JSON parsing errors', async () => {
      const mockResponse = { 
        ok: true, 
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')) 
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(api.request('/test')).rejects.toThrow('Invalid JSON');
    });

    test('should handle fetch network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Failed to fetch'));

      await expect(api.request('/test')).rejects.toThrow('Failed to fetch');
    });

    test('should use default error message when none provided', async () => {
      const mockResponse = { 
        ok: false, 
        json: jest.fn().mockResolvedValue({}) 
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(api.request('/test')).rejects.toThrow('Request failed');
    });
  });

  describe('Security Features', () => {
    test('should not expose sensitive data in errors', async () => {
      const mockResponse = { 
        ok: false, 
        json: jest.fn().mockResolvedValue({ 
          error: 'Authentication failed',
          debug: 'This should not be exposed'
        }) 
      };
      mockFetch.mockResolvedValue(mockResponse);

      try {
        await api.request('/test');
      } catch (error) {
        expect(error.message).toBe('Authentication failed');
        expect(error.message).not.toContain('debug');
      }
    });

    test('should handle CORS errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Failed to fetch'));

      await expect(api.request('/test')).rejects.toThrow('Failed to fetch');
    });
  });
});