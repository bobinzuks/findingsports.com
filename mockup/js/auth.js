// Load API
if (!window.api) {
  const script = document.createElement('script');
  script.src = 'js/api.js';
  document.head.appendChild(script);
}

// Switch between login and register tabs
window.switchAuthTab = function switchAuthTab(tab) {
  const tabs = document.querySelectorAll('.auth-tab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  tabs.forEach(t => t.classList.remove('active'));

  if (tab === 'login') {
    tabs[0].classList.add('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
  } else {
    tabs[1].classList.add('active');
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
  }

  window.clearMessage();
};

// Show message
window.showMessage = function (message, type) {
  const messageEl = document.getElementById('authMessage');
  messageEl.textContent = message;
  messageEl.className = `auth-message ${type}`;
};

window.clearMessage = function () {
  const messageEl = document.getElementById('authMessage');
  messageEl.className = 'auth-message';
  messageEl.textContent = '';
};

// Wait for API to load
window.waitForAPI = function () {
  return new Promise(resolve => {
    const checkAPI = () => {
      if (window.api) {
        resolve();
      } else {
        setTimeout(checkAPI, 100);
      }
    };
    checkAPI();
  });
};

// Handle login
document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();

  await window.waitForAPI();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const data = await window.api.login(email, password);

    window.showMessage('Login successful! Redirecting...', 'success');

    // Redirect based on onboarding status
    setTimeout(() => {
      if (!data.user.onboarded && data.user.provider === 'google') {
        window.location.href = '/onboarding/';
      } else {
        window.location.href = '/';
      }
    }, 1000);
  } catch (error) {
    window.showMessage(error.message || 'Login failed', 'error');
  }
});

// Handle registration
document.getElementById('registerForm').addEventListener('submit', async e => {
  e.preventDefault();

  await window.waitForAPI();

  const email = document.getElementById('regEmail').value;
  const username = document.getElementById('regUsername').value;
  const name = document.getElementById('regFullName').value;
  const password = document.getElementById('regPassword').value;

  try {
    const data = await window.api.register({
      email,
      username,
      name: name || username,
      password
    });

    window.showMessage('Registration successful! Redirecting...', 'success');

    // New users go to onboarding
    setTimeout(() => {
      window.location.href = '/onboarding/';
    }, 1000);
  } catch (error) {
    window.showMessage(error.message || 'Registration failed', 'error');
  }
});

// Check if already logged in
(async function checkAuth() {
  const token = localStorage.getItem('authToken');
  if (token) {
    await window.waitForAPI();

    try {
      await window.api.getCurrentUser();
      // Token is valid, redirect to main app
      window.location.href = '/';
    } catch (error) {
      // Token is invalid, clear it
      window.api.clearToken();
    }
  }
})();
