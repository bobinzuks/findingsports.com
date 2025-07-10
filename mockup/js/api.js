// API configuration
const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://findingsports.com';

// API helper class
class FindingSportsAPI {
    constructor() {
        this.token = localStorage.getItem('authToken');
    }

    // Set auth token
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    // Clear auth token
    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    }

    // Make authenticated request
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth methods
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

    // User methods
    async updatePreferences(preferences) {
        return await this.request('/api/users/preferences', {
            method: 'POST',
            body: JSON.stringify(preferences)
        });
    }

    async getPreferences() {
        return await this.request('/api/users/preferences');
    }

    // Games methods
    async getGames(filters = {}) {
        try {
            const params = new URLSearchParams(filters);
            // Games endpoint doesn't require auth for viewing
            const url = `${API_BASE_URL}/api/games?${params}`;
            const response = await fetch(url);
            const data = await response.json();

            // Check if games array exists
            if (!data.games) {
                console.warn('No games array in response, returning empty result');
                return { games: [], totalGames: 0 };
            }

            return data;
        } catch (error) {
            console.error('Failed to fetch games:', error);
            // Return empty result on error
            return { games: [], totalGames: 0, error: error.message };
        }
    }

    async joinGame(gameId) {
        return await this.request(`/api/games/${gameId}/join`, {
            method: 'POST'
        });
    }

    async createGame(gameData) {
        return await this.request('/api/games', {
            method: 'POST',
            body: JSON.stringify(gameData)
        });
    }

    // Field status methods
    async getFieldStatus() {
        const url = `${API_BASE_URL}/api/fields/status`;
        const response = await fetch(url);
        return await response.json();
    }
}

// Create global API instance
window.api = new FindingSportsAPI();
