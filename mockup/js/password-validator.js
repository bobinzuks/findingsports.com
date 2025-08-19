// Password Validation and Security Module
class PasswordValidator {
    constructor() {
        this.requirements = {
            minLength: 12,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            preventCommonPasswords: true
        };
        
        // Common weak passwords to prevent
        this.commonPasswords = [
            'password123', 'admin123', '12345678', 'qwerty123', 'letmein123',
            'welcome123', 'monkey123', 'dragon123', 'master123', 'password1'
        ];
    }
    
    validate(password) {
        const errors = [];
        const strength = { score: 0, level: 'weak' };
        
        // Check minimum length
        if (password.length < this.requirements.minLength) {
            errors.push(`Password must be at least ${this.requirements.minLength} characters long`);
        } else {
            strength.score += 20;
        }
        
        // Check for uppercase
        if (this.requirements.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        } else {
            strength.score += 20;
        }
        
        // Check for lowercase
        if (this.requirements.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        } else {
            strength.score += 20;
        }
        
        // Check for numbers
        if (this.requirements.requireNumbers && !/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        } else {
            strength.score += 20;
        }
        
        // Check for special characters
        if (this.requirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character (!@#$%^&*...)');
        } else {
            strength.score += 20;
        }
        
        // Check against common passwords
        if (this.requirements.preventCommonPasswords) {
            const lowerPassword = password.toLowerCase();
            if (this.commonPasswords.some(common => lowerPassword.includes(common))) {
                errors.push('Password is too common or easily guessable');
                strength.score = Math.max(0, strength.score - 40);
            }
        }
        
        // Determine strength level
        if (strength.score >= 80) {
            strength.level = 'strong';
        } else if (strength.score >= 60) {
            strength.level = 'medium';
        } else {
            strength.level = 'weak';
        }
        
        return {
            valid: errors.length === 0,
            errors,
            strength
        };
    }
    
    generateSecurePassword() {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        const all = uppercase + lowercase + numbers + special;
        
        let password = '';
        
        // Ensure at least one of each required character type
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += special[Math.floor(Math.random() * special.length)];
        
        // Fill the rest randomly
        for (let i = password.length; i < 16; i++) {
            password += all[Math.floor(Math.random() * all.length)];
        }
        
        // Shuffle the password
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }
    
    getStrengthColor(level) {
        const colors = {
            weak: '#dc3545',
            medium: '#ffc107',
            strong: '#28a745'
        };
        return colors[level] || colors.weak;
    }
    
    createStrengthMeter(inputElement) {
        const meter = document.createElement('div');
        meter.className = 'password-strength-meter';
        meter.innerHTML = `
            <div class="strength-bar-container">
                <div class="strength-bar" style="width: 0%; background: #dc3545;"></div>
            </div>
            <div class="strength-text">Password Strength: <span class="strength-level">-</span></div>
            <ul class="password-requirements">
                <li data-req="length">At least 12 characters</li>
                <li data-req="uppercase">One uppercase letter</li>
                <li data-req="lowercase">One lowercase letter</li>
                <li data-req="number">One number</li>
                <li data-req="special">One special character</li>
            </ul>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .password-strength-meter {
                margin-top: 10px;
            }
            .strength-bar-container {
                height: 5px;
                background: #e9ecef;
                border-radius: 3px;
                overflow: hidden;
                margin-bottom: 10px;
            }
            .strength-bar {
                height: 100%;
                transition: all 0.3s ease;
            }
            .strength-text {
                font-size: 14px;
                margin-bottom: 10px;
            }
            .strength-level {
                font-weight: bold;
                text-transform: capitalize;
            }
            .password-requirements {
                list-style: none;
                padding: 0;
                margin: 0;
                font-size: 13px;
            }
            .password-requirements li {
                padding: 3px 0;
                padding-left: 20px;
                position: relative;
            }
            .password-requirements li:before {
                content: '✗';
                position: absolute;
                left: 0;
                color: #dc3545;
            }
            .password-requirements li.met:before {
                content: '✓';
                color: #28a745;
            }
        `;
        document.head.appendChild(style);
        
        // Insert meter after input
        inputElement.parentNode.insertBefore(meter, inputElement.nextSibling);
        
        // Add input listener
        inputElement.addEventListener('input', () => {
            const password = inputElement.value;
            const result = this.validate(password);
            
            // Update strength bar
            const bar = meter.querySelector('.strength-bar');
            bar.style.width = result.strength.score + '%';
            bar.style.background = this.getStrengthColor(result.strength.level);
            
            // Update strength text
            const levelText = meter.querySelector('.strength-level');
            levelText.textContent = password ? result.strength.level : '-';
            levelText.style.color = password ? this.getStrengthColor(result.strength.level) : '#6c757d';
            
            // Update requirements list
            const reqs = meter.querySelectorAll('.password-requirements li');
            reqs[0].classList.toggle('met', password.length >= this.requirements.minLength);
            reqs[1].classList.toggle('met', /[A-Z]/.test(password));
            reqs[2].classList.toggle('met', /[a-z]/.test(password));
            reqs[3].classList.toggle('met', /\d/.test(password));
            reqs[4].classList.toggle('met', /[!@#$%^&*(),.?":{}|<>]/.test(password));
        });
        
        return meter;
    }
}

// Export for use
window.PasswordValidator = PasswordValidator;