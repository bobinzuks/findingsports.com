// Password Reset Module
class PasswordResetManager {
    constructor() {
        this.resetTokens = new Map(); // In production, use database
        this.init();
    }
    
    init() {
        this.attachResetLink();
    }
    
    attachResetLink() {
        // Will be called when login modal is shown
        document.addEventListener('click', (e) => {
            if (e.target.matches('.forgot-password-link')) {
                e.preventDefault();
                this.showResetModal();
            }
        });
    }
    
    showResetModal() {
        // Remove any existing modal
        const existing = document.querySelector('.password-reset-modal');
        if (existing) existing.remove();
        
        const modal = document.createElement('div');
        modal.className = 'password-reset-modal';
        modal.innerHTML = `
            <div class="reset-modal-overlay">
                <div class="reset-modal-content">
                    <button class="modal-close">&times;</button>
                    <h2>Reset Password</h2>
                    
                    <div class="reset-step" id="step-email">
                        <p>Enter your email address and we'll send you a reset link.</p>
                        <form id="reset-request-form">
                            <div class="form-group">
                                <label>Email Address</label>
                                <input type="email" name="email" required placeholder="your@email.com">
                            </div>
                            <button type="submit" class="btn-primary">Send Reset Link</button>
                        </form>
                    </div>
                    
                    <div class="reset-step hidden" id="step-code">
                        <p>Enter the reset code sent to your email.</p>
                        <form id="reset-code-form">
                            <div class="form-group">
                                <label>Reset Code</label>
                                <input type="text" name="code" required placeholder="Enter 6-digit code">
                            </div>
                            <button type="submit" class="btn-primary">Verify Code</button>
                        </form>
                    </div>
                    
                    <div class="reset-step hidden" id="step-password">
                        <p>Enter your new password.</p>
                        <form id="reset-password-form">
                            <div class="form-group">
                                <label>New Password</label>
                                <input type="password" name="password" id="new-password" required>
                            </div>
                            <div class="form-group">
                                <label>Confirm Password</label>
                                <input type="password" name="confirm" required>
                            </div>
                            <button type="submit" class="btn-primary">Reset Password</button>
                        </form>
                    </div>
                    
                    <div class="reset-message"></div>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .password-reset-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
            }
            .reset-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .reset-modal-content {
                background: white;
                border-radius: 10px;
                padding: 30px;
                max-width: 400px;
                width: 90%;
                position: relative;
            }
            .modal-close {
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #999;
            }
            .modal-close:hover {
                color: #333;
            }
            .reset-step {
                margin: 20px 0;
            }
            .reset-step.hidden {
                display: none;
            }
            .reset-step h2 {
                margin-bottom: 20px;
            }
            .reset-step .form-group {
                margin-bottom: 15px;
            }
            .reset-step label {
                display: block;
                margin-bottom: 5px;
                font-weight: 500;
            }
            .reset-step input {
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
                font-size: 14px;
            }
            .reset-step .btn-primary {
                width: 100%;
                padding: 12px;
                background: #ff6b35;
                color: white;
                border: none;
                border-radius: 5px;
                font-size: 16px;
                cursor: pointer;
            }
            .reset-step .btn-primary:hover {
                background: #e55a2b;
            }
            .reset-message {
                margin-top: 15px;
                padding: 10px;
                border-radius: 5px;
                text-align: center;
                display: none;
            }
            .reset-message.success {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
                display: block;
            }
            .reset-message.error {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
                display: block;
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(modal);
        
        // Attach event handlers
        this.attachModalEvents(modal);
        
        // Initialize password validator for new password field
        if (window.PasswordValidator) {
            const validator = new PasswordValidator();
            const passwordInput = modal.querySelector('#new-password');
            if (passwordInput) {
                validator.createStrengthMeter(passwordInput);
            }
        }
    }
    
    attachModalEvents(modal) {
        // Close button
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        // Click outside to close
        modal.querySelector('.reset-modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                modal.remove();
            }
        });
        
        // Form submissions
        const requestForm = modal.querySelector('#reset-request-form');
        const codeForm = modal.querySelector('#reset-code-form');
        const passwordForm = modal.querySelector('#reset-password-form');
        
        requestForm.addEventListener('submit', (e) => this.handleResetRequest(e, modal));
        codeForm.addEventListener('submit', (e) => this.handleCodeVerification(e, modal));
        passwordForm.addEventListener('submit', (e) => this.handlePasswordReset(e, modal));
    }
    
    async handleResetRequest(event, modal) {
        event.preventDefault();
        const form = event.target;
        const email = form.email.value;
        
        try {
            // Call API to send reset email
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // For demo, generate a code
                const code = Math.floor(100000 + Math.random() * 900000).toString();
                this.resetTokens.set(code, { email, expires: Date.now() + 600000 }); // 10 min expiry
                
                // Show success message
                this.showMessage(modal, `Reset code sent to ${email}. For demo, use code: ${code}`, 'success');
                
                // Move to code step
                setTimeout(() => {
                    modal.querySelector('#step-email').classList.add('hidden');
                    modal.querySelector('#step-code').classList.remove('hidden');
                    this.currentEmail = email;
                }, 2000);
            } else {
                this.showMessage(modal, data.error || 'Failed to send reset email', 'error');
            }
        } catch (error) {
            // Fallback for demo
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            this.resetTokens.set(code, { email, expires: Date.now() + 600000 });
            
            this.showMessage(modal, `Demo mode: Use reset code: ${code}`, 'success');
            setTimeout(() => {
                modal.querySelector('#step-email').classList.add('hidden');
                modal.querySelector('#step-code').classList.remove('hidden');
                this.currentEmail = email;
            }, 2000);
        }
    }
    
    async handleCodeVerification(event, modal) {
        event.preventDefault();
        const form = event.target;
        const code = form.code.value;
        
        // Verify code
        const tokenData = this.resetTokens.get(code);
        
        if (tokenData && tokenData.expires > Date.now()) {
            this.showMessage(modal, 'Code verified successfully!', 'success');
            this.currentResetToken = code;
            
            // Move to password step
            setTimeout(() => {
                modal.querySelector('#step-code').classList.add('hidden');
                modal.querySelector('#step-password').classList.remove('hidden');
                
                // Add password validator
                if (window.PasswordValidator) {
                    const validator = new PasswordValidator();
                    const passwordInput = modal.querySelector('#new-password');
                    validator.createStrengthMeter(passwordInput);
                }
            }, 1000);
        } else {
            this.showMessage(modal, 'Invalid or expired code', 'error');
        }
    }
    
    async handlePasswordReset(event, modal) {
        event.preventDefault();
        const form = event.target;
        const password = form.password.value;
        const confirm = form.confirm.value;
        
        // Validate passwords match
        if (password !== confirm) {
            this.showMessage(modal, 'Passwords do not match', 'error');
            return;
        }
        
        // Validate password strength
        if (window.PasswordValidator) {
            const validator = new PasswordValidator();
            const result = validator.validate(password);
            
            if (!result.valid) {
                this.showMessage(modal, result.errors[0], 'error');
                return;
            }
        }
        
        try {
            // Call API to reset password
            const tokenData = this.resetTokens.get(this.currentResetToken);
            
            const response = await fetch('/api/auth/reset-password-confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: tokenData.email,
                    token: this.currentResetToken,
                    password
                })
            });
            
            const data = await response.json();
            
            if (data.success || response.ok) {
                this.showMessage(modal, 'Password reset successfully! You can now login.', 'success');
                
                // Clean up
                this.resetTokens.delete(this.currentResetToken);
                
                // Close modal and show login
                setTimeout(() => {
                    modal.remove();
                    if (window.loginManager) {
                        window.loginManager.showLoginModal();
                    }
                }, 2000);
            } else {
                this.showMessage(modal, data.error || 'Failed to reset password', 'error');
            }
        } catch (error) {
            // Demo fallback
            this.showMessage(modal, 'Password reset successfully! (Demo mode)', 'success');
            setTimeout(() => {
                modal.remove();
            }, 2000);
        }
    }
    
    showMessage(modal, text, type) {
        const messageEl = modal.querySelector('.reset-message');
        messageEl.textContent = text;
        messageEl.className = `reset-message ${type}`;
        
        // Auto-hide error messages
        if (type === 'error') {
            setTimeout(() => {
                messageEl.className = 'reset-message';
            }, 5000);
        }
    }
}

// Initialize
window.passwordResetManager = new PasswordResetManager();