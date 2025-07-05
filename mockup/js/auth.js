// Auth configuration
const API_URL = 'http://localhost:8080/graphql';
let authToken = localStorage.getItem('authToken');
let currentUser = null;

// Switch between login and register tabs
function switchAuthTab(tab) {
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
    
    clearMessage();
}

// Show message
function showMessage(message, type) {
    const messageEl = document.getElementById('authMessage');
    messageEl.textContent = message;
    messageEl.className = `auth-message ${type}`;
}

function clearMessage() {
    const messageEl = document.getElementById('authMessage');
    messageEl.className = 'auth-message';
    messageEl.textContent = '';
}

// GraphQL request helper
async function graphqlRequest(query, variables = {}) {
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify({ query, variables }),
        });
        
        const data = await response.json();
        
        if (data.errors) {
            throw new Error(data.errors[0].message);
        }
        
        return data.data;
    } catch (error) {
        console.error('GraphQL Error:', error);
        throw error;
    }
}

// Handle login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const query = `
        mutation Login($input: LoginInput!) {
            login(input: $input) {
                token
                user {
                    id
                    email
                    username
                    fullName
                }
            }
        }
    `;
    
    try {
        const data = await graphqlRequest(query, {
            input: { email, password }
        });
        
        authToken = data.login.token;
        currentUser = data.login.user;
        
        // Save token
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showMessage('Login successful! Redirecting...', 'success');
        
        // Redirect to main app
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
        
    } catch (error) {
        showMessage(error.message || 'Login failed', 'error');
    }
});

// Handle registration
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('regEmail').value;
    const username = document.getElementById('regUsername').value;
    const fullName = document.getElementById('regFullName').value;
    const password = document.getElementById('regPassword').value;
    
    const query = `
        mutation Register($input: RegisterInput!) {
            register(input: $input) {
                token
                user {
                    id
                    email
                    username
                    fullName
                }
            }
        }
    `;
    
    try {
        const data = await graphqlRequest(query, {
            input: {
                email,
                username,
                password,
                fullName: fullName || null
            }
        });
        
        authToken = data.register.token;
        currentUser = data.register.user;
        
        // Save token
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showMessage('Registration successful! Redirecting...', 'success');
        
        // Redirect to main app
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
        
    } catch (error) {
        showMessage(error.message || 'Registration failed', 'error');
    }
});

// Check if already logged in
if (authToken) {
    // Verify token is still valid
    const query = `
        query Me {
            me {
                id
                email
                username
            }
        }
    `;
    
    graphqlRequest(query)
        .then(data => {
            // Token is valid, redirect to main app
            window.location.href = '/';
        })
        .catch(() => {
            // Token is invalid, clear it
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
        });
}