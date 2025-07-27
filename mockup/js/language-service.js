// Language Translation Service
window.LanguageService = {
  currentLanguage: 'en',
  supportedLanguages: {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    zh: '中文',
    hi: 'हिंदी',
    ar: 'العربية',
    pt: 'Português',
    ru: 'Русский',
    ja: '日本語',
    ko: '한국어'
  },

  // Translation cache
  translationCache: new Map(),

  // Initialize language service
  initialize() {
    // Language service is disabled - language selector has been removed
    return;
  },

  // Add language selector to header
  addLanguageSelector() {
    const headerRight = document.querySelector('.header-right, .user-menu');
    if (!headerRight) {
      console.error('Header right section not found');
      return;
    }

    // Create language selector
    const languageSelector = document.createElement('div');
    languageSelector.className = 'language-selector';
    languageSelector.style.cssText = `
            position: relative;
            display: inline-block;
            margin-right: 20px;
        `;

    languageSelector.innerHTML = `
            <button class="language-btn" onclick="window.LanguageService.toggleLanguageDropdown()" style="
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                transition: all 0.3s;
            ">
                <span style="font-size: 18px;">🌐</span>
                <span class="current-lang">${this.supportedLanguages[this.currentLanguage]}</span>
                <span style="font-size: 12px;">▼</span>
            </button>
            <div class="language-dropdown" style="
                position: absolute;
                top: 100%;
                right: 0;
                margin-top: 10px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                display: none;
                min-width: 200px;
                z-index: 1000;
                overflow: hidden;
            ">
                ${Object.entries(this.supportedLanguages).map(([code, name]) => `
                    <div class="language-option ${code === this.currentLanguage ? 'active' : ''}" 
                         onclick="window.LanguageService.changeLanguage('${code}')"
                         style="
                            padding: 12px 20px;
                            cursor: pointer;
                            transition: background 0.2s;
                            color: #333;
                            ${code === this.currentLanguage ? 'background: #f0f0f0; font-weight: 600;' : ''}
                         "
                         onmouseover="this.style.background='#f8f8f8'"
                         onmouseout="this.style.background='${code === this.currentLanguage ? '#f0f0f0' : 'white'}'">
                        ${name}
                    </div>
                `).join('')}
            </div>
        `;

    // Insert before other header elements
    headerRight.insertBefore(languageSelector, headerRight.firstChild);

    // Close dropdown when clicking outside
    document.addEventListener('click', e => {
      if (!e.target.closest('.language-selector')) {
        const dropdown = document.querySelector('.language-dropdown');
        if (dropdown) { dropdown.style.display = 'none'; }
      }
    });
  },

  // Toggle language dropdown
  toggleLanguageDropdown() {
    const dropdown = document.querySelector('.language-dropdown');
    if (dropdown) {
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
  },

  // Change language
  async changeLanguage(lang) {
    if (lang === this.currentLanguage) { return; }

    this.currentLanguage = lang;
    localStorage.setItem('preferredLanguage', lang);

    // Update button text
    const langBtn = document.querySelector('.current-lang');
    if (langBtn) {
      langBtn.textContent = this.supportedLanguages[lang];
    }

    // Hide dropdown
    const dropdown = document.querySelector('.language-dropdown');
    if (dropdown) { dropdown.style.display = 'none'; }

    // Show loading indicator
    this.showTranslationLoading();

    // Translate page
    await this.translatePage();

    // Hide loading indicator
    this.hideTranslationLoading();
  },

  // Translate entire page
  async translatePage() {
    if (this.currentLanguage === 'en') {
      // Reload page to restore original English content
      location.reload();
      return;
    }

    // Get all text nodes to translate
    const textElements = this.getTranslatableElements();

    // Translate in batches
    const batchSize = 10;
    for (let i = 0; i < textElements.length; i += batchSize) {
      const batch = textElements.slice(i, i + batchSize);
      await Promise.all(batch.map(el => this.translateElement(el)));
    }
  },

  // Get all translatable elements
  getTranslatableElements() {
    const elements = [];
    const selector = 'h1, h2, h3, h4, h5, h6, p, span, button, label, option, .tab, .channel-item, .message-text, .tagline';

    document.querySelectorAll(selector).forEach(el => {
      // Skip if element has children (to avoid duplicating translations)
      if (el.children.length === 0 && el.textContent.trim()) {
        elements.push(el);
      }
    });

    // Also translate placeholders
    document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
      elements.push({ element: el, isPlaceholder: true });
    });

    return elements;
  },

  // Translate a single element
  async translateElement(item) {
    const el = item.element || item;
    const text = item.isPlaceholder ? el.placeholder : el.textContent.trim();

    if (!text) { return; }

    // Check cache first
    const cacheKey = `${text}_${this.currentLanguage}`;
    if (this.translationCache.has(cacheKey)) {
      if (item.isPlaceholder) {
        el.placeholder = this.translationCache.get(cacheKey);
      } else {
        el.textContent = this.translationCache.get(cacheKey);
      }
      return;
    }

    // Translate using Google Translate API (free tier)
    try {
      const translated = await this.translateText(text, this.currentLanguage);
      this.translationCache.set(cacheKey, translated);

      if (item.isPlaceholder) {
        el.placeholder = translated;
      } else {
        el.textContent = translated;
      }
    } catch (error) {
      console.error('Translation error:', error);
    }
  },

  // Translate text using Google Translate API
  async translateText(text, targetLang) {
    // For demo purposes, we'll use a simple translation mapping
    // In production, you would use Google Translate API or similar
    const translations = {
      es: {
        'Finding Sports': 'Encontrar Deportes',
        'Wherever, whenever': 'Donde sea, cuando sea',
        Search: 'Buscar',
        'Play Now': 'Jugar Ahora',
        'Social Feed': 'Feed Social',
        'Upcoming Games': 'Próximos Juegos',
        'Sport Rules': 'Reglas del Deporte',
        'Any sport': 'Cualquier deporte',
        Basketball: 'Baloncesto',
        Soccer: 'Fútbol',
        Volleyball: 'Voleibol',
        Tennis: 'Tenis',
        Hockey: 'Hockey'
      },
      fr: {
        'Finding Sports': 'Trouver des Sports',
        'Wherever, whenever': 'Où que ce soit, quand vous voulez',
        Search: 'Rechercher',
        'Play Now': 'Jouer Maintenant',
        'Social Feed': 'Fil Social',
        'Upcoming Games': 'Jeux à Venir',
        'Sport Rules': 'Règles du Sport',
        'Any sport': 'Tous les sports',
        Basketball: 'Basketball',
        Soccer: 'Football',
        Volleyball: 'Volleyball',
        Tennis: 'Tennis',
        Hockey: 'Hockey'
      },
      zh: {
        'Finding Sports': '寻找体育',
        'Wherever, whenever': '随时随地',
        Search: '搜索',
        'Play Now': '立即玩',
        'Social Feed': '社交动态',
        'Upcoming Games': '即将到来的游戏',
        'Sport Rules': '运动规则',
        'Any sport': '任何运动',
        Basketball: '篮球',
        Soccer: '足球',
        Volleyball: '排球',
        Tennis: '网球',
        Hockey: '曲棍球'
      }
    };

    // Return translated text if available, otherwise return original
    if (translations[targetLang] && translations[targetLang][text]) {
      return translations[targetLang][text];
    }

    // For production, you would make an API call here
    // return await this.callTranslationAPI(text, targetLang);

    return text; // Return original if no translation available
  },

  // Show translation loading indicator
  showTranslationLoading() {
    const loader = document.createElement('div');
    loader.id = 'translation-loader';
    loader.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 40px;
            border-radius: 12px;
            font-size: 16px;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 15px;
        `;
    loader.innerHTML = `
            <div class="spinner" style="
                width: 30px;
                height: 30px;
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-top-color: white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
            <span>Translating page...</span>
            <style>
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        `;
    document.body.appendChild(loader);
  },

  // Hide translation loading indicator
  hideTranslationLoading() {
    const loader = document.getElementById('translation-loader');
    if (loader) { loader.remove(); }
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.LanguageService.initialize();
  });
} else {
  window.LanguageService.initialize();
}
