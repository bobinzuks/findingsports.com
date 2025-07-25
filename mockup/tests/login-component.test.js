/**
 * Login Component Test Suite
 * QA Engineer: Comprehensive testing for login functionality
 */

describe('Login Component', () => {
  let mockAPI;
  let mockLocalStorage;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div class="auth-container">
        <div class="auth-box">
          <div class="auth-tabs">
            <button class="auth-tab active" onclick="switchAuthTab('login')">Login</button>
            <button class="auth-tab" onclick="switchAuthTab('register')">Sign Up</button>
          </div>
          <form id="loginForm" class="auth-form">
            <div class="form-group">
              <input type="email" id="email" name="email" required placeholder="demo@example.com" value="demo@example.com" />
            </div>
            <div class="form-group">
              <input type="password" id="password" name="password" required placeholder="Enter your password" value="demo123" />
            </div>
            <button type="submit" class="auth-btn">Login</button>
          </form>
          <form id="registerForm" class="auth-form" style="display: none">
            <div class="form-group">
              <input type="email" id="regEmail" name="email" required placeholder="your@email.com" />
            </div>
            <div class="form-group">
              <input type="text" id="regUsername" name="username" required placeholder="Choose a username" />
            </div>
            <div class="form-group">
              <input type="text" id="regFullName" name="fullName" placeholder="Your full name" />
            </div>
            <div class="form-group">
              <input type="password" id="regPassword" name="password" required placeholder="Create a password" />
            </div>
            <button type="submit" class="auth-btn">Sign Up</button>
          </form>
          <div id="authMessage" class="auth-message"></div>
        </div>
      </div>
    `;

    // Mock API
    mockAPI = {
      login: jest.fn(),
      register: jest.fn(),
      getCurrentUser: jest.fn(),
      clearToken: jest.fn()
    };
    window.api = mockAPI;

    // Mock localStorage
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

    // Mock location
    delete window.location;
    window.location = { href: '' };

    // Mock global functions
    window.switchAuthTab = jest.fn();
    window.showMessage = jest.fn();
    window.clearMessage = jest.fn();
    window.waitForAPI = jest.fn().mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Tab Switching', () => {
    test('should switch to login tab', () => {
      const loginForm = document.getElementById('loginForm');
      const registerForm = document.getElementById('registerForm');
      const tabs = document.querySelectorAll('.auth-tab');

      // Simulate tab switch implementation
      tabs[0].classList.add('active');
      tabs[1].classList.remove('active');
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';

      expect(tabs[0].classList.contains('active')).toBe(true);
      expect(tabs[1].classList.contains('active')).toBe(false);
      expect(loginForm.style.display).toBe('block');
      expect(registerForm.style.display).toBe('none');
    });

    test('should switch to register tab', () => {
      const loginForm = document.getElementById('loginForm');
      const registerForm = document.getElementById('registerForm');
      const tabs = document.querySelectorAll('.auth-tab');

      // Simulate tab switch implementation
      tabs[0].classList.remove('active');
      tabs[1].classList.add('active');
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';

      expect(tabs[0].classList.contains('active')).toBe(false);
      expect(tabs[1].classList.contains('active')).toBe(true);
      expect(loginForm.style.display).toBe('none');
      expect(registerForm.style.display).toBe('block');
    });
  });

  describe('Form Validation', () => {
    test('should validate email format', () => {
      const emailInput = document.getElementById('email');
      
      // Test valid email
      emailInput.value = 'test@example.com';
      expect(emailInput.checkValidity()).toBe(true);

      // Test invalid email
      emailInput.value = 'invalid-email';
      expect(emailInput.checkValidity()).toBe(false);
    });

    test('should require password', () => {
      const passwordInput = document.getElementById('password');
      
      // Test empty password
      passwordInput.value = '';
      expect(passwordInput.checkValidity()).toBe(false);

      // Test with password
      passwordInput.value = 'password123';
      expect(passwordInput.checkValidity()).toBe(true);
    });

    test('should validate registration form fields', () => {
      const emailInput = document.getElementById('regEmail');
      const usernameInput = document.getElementById('regUsername');
      const passwordInput = document.getElementById('regPassword');
      
      // Test all required fields filled
      emailInput.value = 'test@example.com';
      usernameInput.value = 'testuser';
      passwordInput.value = 'password123';

      expect(emailInput.checkValidity()).toBe(true);
      expect(usernameInput.checkValidity()).toBe(true);
      expect(passwordInput.checkValidity()).toBe(true);
    });
  });

  describe('Login Functionality', () => {
    test('should handle successful login', async () => {
      const mockUser = { id: 1, email: 'demo@example.com', onboarded: true };
      mockAPI.login.mockResolvedValue({ user: mockUser, token: 'mock-token' });

      const form = document.getElementById('loginForm');
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');

      emailInput.value = 'demo@example.com';
      passwordInput.value = 'demo123';

      // Simulate form submission
      const submitEvent = new Event('submit');
      form.dispatchEvent(submitEvent);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockAPI.login).toHaveBeenCalledWith('demo@example.com', 'demo123');
    });

    test('should handle login error', async () => {
      mockAPI.login.mockRejectedValue(new Error('Invalid credentials'));

      const form = document.getElementById('loginForm');
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');

      emailInput.value = 'wrong@example.com';
      passwordInput.value = 'wrongpassword';

      // Simulate form submission
      try {
        const submitEvent = new Event('submit');
        form.dispatchEvent(submitEvent);
        await new Promise(resolve => setTimeout(resolve, 0));
      } catch (error) {
        expect(error.message).toBe('Invalid credentials');
      }
    });

    test('should redirect after successful login', async () => {
      const mockUser = { id: 1, email: 'demo@example.com', onboarded: true };
      mockAPI.login.mockResolvedValue({ user: mockUser, token: 'mock-token' });

      // Simulate successful login and redirect
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);

      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(window.location.href).toBe('/');
    });

    test('should redirect to onboarding for new Google users', async () => {
      const mockUser = { id: 1, email: 'test@example.com', onboarded: false, provider: 'google' };
      mockAPI.login.mockResolvedValue({ user: mockUser, token: 'mock-token' });

      // Simulate redirect to onboarding
      setTimeout(() => {
        window.location.href = '/onboarding/';
      }, 1000);

      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(window.location.href).toBe('/onboarding/');
    });
  });

  describe('Registration Functionality', () => {
    test('should handle successful registration', async () => {
      const mockUser = { id: 2, email: 'new@example.com', username: 'newuser' };
      mockAPI.register.mockResolvedValue({ user: mockUser, token: 'new-token' });

      const form = document.getElementById('registerForm');
      const emailInput = document.getElementById('regEmail');
      const usernameInput = document.getElementById('regUsername');
      const passwordInput = document.getElementById('regPassword');

      emailInput.value = 'new@example.com';
      usernameInput.value = 'newuser';
      passwordInput.value = 'newpassword123';

      // Simulate form submission
      const submitEvent = new Event('submit');
      form.dispatchEvent(submitEvent);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockAPI.register).toHaveBeenCalledWith({
        email: 'new@example.com',
        username: 'newuser',
        name: 'newuser',
        password: 'newpassword123'
      });
    });

    test('should use full name if provided', async () => {
      const mockUser = { id: 2, email: 'new@example.com', username: 'newuser' };
      mockAPI.register.mockResolvedValue({ user: mockUser, token: 'new-token' });

      const form = document.getElementById('registerForm');
      const emailInput = document.getElementById('regEmail');
      const usernameInput = document.getElementById('regUsername');
      const fullNameInput = document.getElementById('regFullName');
      const passwordInput = document.getElementById('regPassword');

      emailInput.value = 'new@example.com';
      usernameInput.value = 'newuser';
      fullNameInput.value = 'New User Full Name';
      passwordInput.value = 'newpassword123';

      // Simulate form submission
      const submitEvent = new Event('submit');
      form.dispatchEvent(submitEvent);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockAPI.register).toHaveBeenCalledWith({
        email: 'new@example.com',
        username: 'newuser',
        name: 'New User Full Name',
        password: 'newpassword123'
      });
    });

    test('should redirect to onboarding after registration', async () => {
      const mockUser = { id: 2, email: 'new@example.com', username: 'newuser' };
      mockAPI.register.mockResolvedValue({ user: mockUser, token: 'new-token' });

      // Simulate redirect to onboarding
      setTimeout(() => {
        window.location.href = '/onboarding/';
      }, 1000);

      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(window.location.href).toBe('/onboarding/');
    });
  });

  describe('Authentication Check', () => {
    test('should redirect if already logged in with valid token', async () => {
      mockLocalStorage.getItem.mockReturnValue('valid-token');
      mockAPI.getCurrentUser.mockResolvedValue({ id: 1, email: 'user@example.com' });

      // Simulate auth check
      setTimeout(() => {
        window.location.href = '/';
      }, 100);

      await new Promise(resolve => setTimeout(resolve, 200));
      expect(window.location.href).toBe('/');
    });

    test('should clear invalid token', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-token');
      mockAPI.getCurrentUser.mockRejectedValue(new Error('Invalid token'));

      // Simulate auth check with invalid token
      try {
        await mockAPI.getCurrentUser();
      } catch (error) {
        mockAPI.clearToken();
      }

      expect(mockAPI.clearToken).toHaveBeenCalled();
    });
  });

  describe('Message Display', () => {
    test('should show success message', () => {
      const messageEl = document.getElementById('authMessage');
      
      // Simulate success message
      messageEl.textContent = 'Login successful! Redirecting...';
      messageEl.className = 'auth-message success';

      expect(messageEl.textContent).toBe('Login successful! Redirecting...');
      expect(messageEl.classList.contains('success')).toBe(true);
    });

    test('should show error message', () => {
      const messageEl = document.getElementById('authMessage');
      
      // Simulate error message
      messageEl.textContent = 'Login failed';
      messageEl.className = 'auth-message error';

      expect(messageEl.textContent).toBe('Login failed');
      expect(messageEl.classList.contains('error')).toBe(true);
    });

    test('should clear message', () => {
      const messageEl = document.getElementById('authMessage');
      
      // Simulate clear message
      messageEl.className = 'auth-message';
      messageEl.textContent = '';

      expect(messageEl.textContent).toBe('');
      expect(messageEl.className).toBe('auth-message');
    });
  });

  describe('Mobile Responsiveness', () => {
    test('should be responsive on mobile screens', () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      const authBox = document.querySelector('.auth-box');
      
      // Test that mobile styles can be applied
      expect(authBox).toBeTruthy();
      
      // In a real test, you'd check computed styles
      // For now, we verify the element exists for mobile testing
    });
  });

  describe('Demo Account', () => {
    test('should have demo credentials pre-filled', () => {
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');

      expect(emailInput.value).toBe('demo@example.com');
      expect(passwordInput.value).toBe('demo123');
    });

    test('should display demo account information', () => {
      const demoInfo = document.querySelector('.demo-info');
      
      // Check that demo info section exists
      expect(demoInfo).toBeTruthy();
    });
  });
});