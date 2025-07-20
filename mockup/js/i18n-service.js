// Enhanced International Localization Service with Full i18n Support
window.I18nService = {
  // Current language and locale settings
  currentLanguage: 'en',
  currentLocale: 'en-US',
  currentTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  currentCurrency: 'USD',
  
  // RTL languages
  rtlLanguages: ['ar', 'he', 'fa', 'ur'],
  
  // Supported languages with locales
  supportedLanguages: {
    en: { name: 'English', locale: 'en-US', currency: 'USD', flag: '🇺🇸' },
    es: { name: 'Español', locale: 'es-ES', currency: 'EUR', flag: '🇪🇸' },
    fr: { name: 'Français', locale: 'fr-FR', currency: 'EUR', flag: '🇫🇷' },
    de: { name: 'Deutsch', locale: 'de-DE', currency: 'EUR', flag: '🇩🇪' },
    it: { name: 'Italiano', locale: 'it-IT', currency: 'EUR', flag: '🇮🇹' },
    pt: { name: 'Português', locale: 'pt-BR', currency: 'BRL', flag: '🇧🇷' },
    ru: { name: 'Русский', locale: 'ru-RU', currency: 'RUB', flag: '🇷🇺' },
    ja: { name: '日本語', locale: 'ja-JP', currency: 'JPY', flag: '🇯🇵' },
    ko: { name: '한국어', locale: 'ko-KR', currency: 'KRW', flag: '🇰🇷' },
    zh: { name: '中文', locale: 'zh-CN', currency: 'CNY', flag: '🇨🇳' },
    ar: { name: 'العربية', locale: 'ar-SA', currency: 'SAR', flag: '🇸🇦' },
    he: { name: 'עברית', locale: 'he-IL', currency: 'ILS', flag: '🇮🇱' },
    hi: { name: 'हिंदी', locale: 'hi-IN', currency: 'INR', flag: '🇮🇳' },
    tr: { name: 'Türkçe', locale: 'tr-TR', currency: 'TRY', flag: '🇹🇷' },
    pl: { name: 'Polski', locale: 'pl-PL', currency: 'PLN', flag: '🇵🇱' }
  },
  
  // Translation resources
  translations: {
    en: {
      // Navigation
      'nav.home': 'Home',
      'nav.playNow': 'Play Now',
      'nav.socialFeed': 'Social Feed',
      'nav.upcomingGames': 'Upcoming Games',
      'nav.sportRules': 'Sport Rules',
      'nav.profile': 'Profile',
      'nav.signIn': 'Sign In',
      'nav.signOut': 'Sign Out',
      
      // Main tagline
      'tagline': 'Wherever, whenever',
      'hero.title': 'Finding Sports',
      'hero.subtitle': 'Connect with players, find games, enjoy sports',
      
      // Search
      'search.placeholder': 'Search for sports, venues, or players...',
      'search.button': 'Search',
      'search.filters': 'Filters',
      'search.nearMe': 'Near Me',
      
      // Sports (culturally appropriate)
      'sport.any': 'Any sport',
      'sport.basketball': 'Basketball',
      'sport.soccer': 'Soccer', // US English
      'sport.football': 'American Football',
      'sport.volleyball': 'Volleyball',
      'sport.tennis': 'Tennis',
      'sport.hockey': 'Ice Hockey',
      'sport.cricket': 'Cricket',
      'sport.rugby': 'Rugby',
      'sport.baseball': 'Baseball',
      'sport.badminton': 'Badminton',
      'sport.tabletennis': 'Table Tennis',
      
      // Social Feed
      'social.title': 'Community Feed',
      'social.channels': 'Channels',
      'social.online': 'Online',
      'social.message.placeholder': 'Type a message...',
      'social.typing': '{user} is typing...',
      'social.multipleTyping': '{users} are typing...',
      'social.sendMessage': 'Send',
      'social.joinConversation': 'Join the conversation!',
      'social.signInToChat': 'Sign in to send messages and connect with other players',
      
      // Time expressions
      'time.justNow': 'just now',
      'time.minutesAgo': '{n} minutes ago',
      'time.hoursAgo': '{n} hours ago',
      'time.daysAgo': '{n} days ago',
      'time.today': 'Today',
      'time.yesterday': 'Yesterday',
      'time.tomorrow': 'Tomorrow',
      'time.at': 'at',
      
      // Marketplace
      'marketplace.title': 'Sports Marketplace',
      'marketplace.allCategories': 'All Categories',
      'marketplace.forSale': 'Equipment for Sale',
      'marketplace.wanted': 'Equipment Wanted',
      'marketplace.carpool': 'Carpooling',
      'marketplace.teamLooking': 'Team Looking for Players',
      'marketplace.createListing': 'Create Listing',
      'marketplace.contactSeller': 'Contact Seller',
      'marketplace.price': 'Price',
      'marketplace.free': 'Free',
      'marketplace.negotiable': 'Negotiable',
      
      // Currency format helper
      'currency.format': '${amount}',
      
      // Location
      'location.detecting': 'Detecting location...',
      'location.select': 'Select Location',
      'location.nearYou': 'Near You',
      'location.km': 'km',
      'location.miles': 'miles',
      
      // Actions
      'action.save': 'Save',
      'action.cancel': 'Cancel',
      'action.delete': 'Delete',
      'action.edit': 'Edit',
      'action.share': 'Share',
      'action.report': 'Report',
      'action.block': 'Block',
      'action.follow': 'Follow',
      'action.unfollow': 'Unfollow',
      
      // Notifications
      'notification.welcome': 'Welcome to Finding Sports!',
      'notification.newMessage': 'New message from {user}',
      'notification.gameStarting': 'Game starting in {time}',
      'notification.teamInvite': '{user} invited you to join their team'
    },
    
    es: {
      // Navigation
      'nav.home': 'Inicio',
      'nav.playNow': 'Jugar Ahora',
      'nav.socialFeed': 'Feed Social',
      'nav.upcomingGames': 'Próximos Juegos',
      'nav.sportRules': 'Reglas del Deporte',
      'nav.profile': 'Perfil',
      'nav.signIn': 'Iniciar Sesión',
      'nav.signOut': 'Cerrar Sesión',
      
      // Main tagline
      'tagline': 'Donde sea, cuando sea',
      'hero.title': 'Encontrar Deportes',
      'hero.subtitle': 'Conecta con jugadores, encuentra juegos, disfruta del deporte',
      
      // Search
      'search.placeholder': 'Buscar deportes, lugares o jugadores...',
      'search.button': 'Buscar',
      'search.filters': 'Filtros',
      'search.nearMe': 'Cerca de Mí',
      
      // Sports (culturally appropriate for Spanish)
      'sport.any': 'Cualquier deporte',
      'sport.basketball': 'Baloncesto',
      'sport.soccer': 'Fútbol', // Football in Spanish
      'sport.football': 'Fútbol Americano',
      'sport.volleyball': 'Voleibol',
      'sport.tennis': 'Tenis',
      'sport.hockey': 'Hockey sobre Hielo',
      'sport.cricket': 'Críquet',
      'sport.rugby': 'Rugby',
      'sport.baseball': 'Béisbol',
      'sport.badminton': 'Bádminton',
      'sport.tabletennis': 'Tenis de Mesa',
      
      // Social Feed
      'social.title': 'Feed de la Comunidad',
      'social.channels': 'Canales',
      'social.online': 'En línea',
      'social.message.placeholder': 'Escribe un mensaje...',
      'social.typing': '{user} está escribiendo...',
      'social.multipleTyping': '{users} están escribiendo...',
      'social.sendMessage': 'Enviar',
      'social.joinConversation': '¡Únete a la conversación!',
      'social.signInToChat': 'Inicia sesión para enviar mensajes y conectar con otros jugadores',
      
      // Time expressions
      'time.justNow': 'ahora mismo',
      'time.minutesAgo': 'hace {n} minutos',
      'time.hoursAgo': 'hace {n} horas',
      'time.daysAgo': 'hace {n} días',
      'time.today': 'Hoy',
      'time.yesterday': 'Ayer',
      'time.tomorrow': 'Mañana',
      'time.at': 'a las',
      
      // Marketplace
      'marketplace.title': 'Mercado Deportivo',
      'marketplace.allCategories': 'Todas las Categorías',
      'marketplace.forSale': 'Equipamiento en Venta',
      'marketplace.wanted': 'Se Busca Equipamiento',
      'marketplace.carpool': 'Compartir Coche',
      'marketplace.teamLooking': 'Equipo Busca Jugadores',
      'marketplace.createListing': 'Crear Anuncio',
      'marketplace.contactSeller': 'Contactar Vendedor',
      'marketplace.price': 'Precio',
      'marketplace.free': 'Gratis',
      'marketplace.negotiable': 'Negociable',
      
      // Currency format helper
      'currency.format': '{amount} €',
      
      // Location
      'location.detecting': 'Detectando ubicación...',
      'location.select': 'Seleccionar Ubicación',
      'location.nearYou': 'Cerca de Ti',
      'location.km': 'km',
      'location.miles': 'millas',
      
      // Actions
      'action.save': 'Guardar',
      'action.cancel': 'Cancelar',
      'action.delete': 'Eliminar',
      'action.edit': 'Editar',
      'action.share': 'Compartir',
      'action.report': 'Reportar',
      'action.block': 'Bloquear',
      'action.follow': 'Seguir',
      'action.unfollow': 'Dejar de seguir',
      
      // Notifications
      'notification.welcome': '¡Bienvenido a Encontrar Deportes!',
      'notification.newMessage': 'Nuevo mensaje de {user}',
      'notification.gameStarting': 'El juego comienza en {time}',
      'notification.teamInvite': '{user} te invitó a unirte a su equipo'
    },
    
    ar: {
      // Navigation
      'nav.home': 'الرئيسية',
      'nav.playNow': 'العب الآن',
      'nav.socialFeed': 'الموجز الاجتماعي',
      'nav.upcomingGames': 'الألعاب القادمة',
      'nav.sportRules': 'قواعد الرياضة',
      'nav.profile': 'الملف الشخصي',
      'nav.signIn': 'تسجيل الدخول',
      'nav.signOut': 'تسجيل الخروج',
      
      // Main tagline
      'tagline': 'في أي مكان، في أي وقت',
      'hero.title': 'إيجاد الرياضات',
      'hero.subtitle': 'تواصل مع اللاعبين، اعثر على الألعاب، استمتع بالرياضة',
      
      // Search
      'search.placeholder': 'ابحث عن الرياضات أو الأماكن أو اللاعبين...',
      'search.button': 'بحث',
      'search.filters': 'تصفيات',
      'search.nearMe': 'بالقرب مني',
      
      // Sports (culturally appropriate for Arabic)
      'sport.any': 'أي رياضة',
      'sport.basketball': 'كرة السلة',
      'sport.soccer': 'كرة القدم',
      'sport.football': 'كرة القدم الأمريكية',
      'sport.volleyball': 'الكرة الطائرة',
      'sport.tennis': 'التنس',
      'sport.hockey': 'الهوكي',
      'sport.cricket': 'الكريكيت',
      'sport.rugby': 'الرجبي',
      'sport.baseball': 'البيسبول',
      'sport.badminton': 'الريشة الطائرة',
      'sport.tabletennis': 'تنس الطاولة',
      
      // Social Feed
      'social.title': 'موجز المجتمع',
      'social.channels': 'القنوات',
      'social.online': 'متصل',
      'social.message.placeholder': 'اكتب رسالة...',
      'social.typing': '{user} يكتب...',
      'social.multipleTyping': '{users} يكتبون...',
      'social.sendMessage': 'إرسال',
      'social.joinConversation': 'انضم إلى المحادثة!',
      'social.signInToChat': 'سجل الدخول لإرسال الرسائل والتواصل مع اللاعبين الآخرين',
      
      // Time expressions
      'time.justNow': 'الآن',
      'time.minutesAgo': 'منذ {n} دقيقة',
      'time.hoursAgo': 'منذ {n} ساعة',
      'time.daysAgo': 'منذ {n} يوم',
      'time.today': 'اليوم',
      'time.yesterday': 'أمس',
      'time.tomorrow': 'غداً',
      'time.at': 'في',
      
      // Marketplace
      'marketplace.title': 'سوق الرياضة',
      'marketplace.allCategories': 'جميع الفئات',
      'marketplace.forSale': 'معدات للبيع',
      'marketplace.wanted': 'مطلوب معدات',
      'marketplace.carpool': 'مشاركة السيارة',
      'marketplace.teamLooking': 'فريق يبحث عن لاعبين',
      'marketplace.createListing': 'إنشاء إعلان',
      'marketplace.contactSeller': 'اتصل بالبائع',
      'marketplace.price': 'السعر',
      'marketplace.free': 'مجاني',
      'marketplace.negotiable': 'قابل للتفاوض',
      
      // Currency format helper
      'currency.format': '{amount} ر.س',
      
      // Location
      'location.detecting': 'جاري تحديد الموقع...',
      'location.select': 'اختر الموقع',
      'location.nearYou': 'بالقرب منك',
      'location.km': 'كم',
      'location.miles': 'ميل',
      
      // Actions
      'action.save': 'حفظ',
      'action.cancel': 'إلغاء',
      'action.delete': 'حذف',
      'action.edit': 'تعديل',
      'action.share': 'مشاركة',
      'action.report': 'إبلاغ',
      'action.block': 'حظر',
      'action.follow': 'متابعة',
      'action.unfollow': 'إلغاء المتابعة',
      
      // Notifications
      'notification.welcome': 'مرحباً بك في إيجاد الرياضات!',
      'notification.newMessage': 'رسالة جديدة من {user}',
      'notification.gameStarting': 'تبدأ اللعبة في {time}',
      'notification.teamInvite': 'دعاك {user} للانضمام إلى فريقه'
    },
    
    // Add more languages...
    fr: {
      'nav.home': 'Accueil',
      'nav.playNow': 'Jouer Maintenant',
      'nav.socialFeed': 'Fil Social',
      'tagline': 'Où que ce soit, quand vous voulez',
      'sport.soccer': 'Football', // Football in French
      'sport.football': 'Football Américain',
      'currency.format': '{amount} €'
    },
    
    ja: {
      'nav.home': 'ホーム',
      'nav.playNow': '今すぐプレイ',
      'nav.socialFeed': 'ソーシャルフィード',
      'tagline': 'いつでも、どこでも',
      'sport.soccer': 'サッカー',
      'sport.baseball': '野球', // Very popular in Japan
      'currency.format': '¥{amount}'
    },
    
    zh: {
      'nav.home': '首页',
      'nav.playNow': '立即开始',
      'nav.socialFeed': '社交动态',
      'tagline': '随时随地',
      'sport.soccer': '足球',
      'sport.tabletennis': '乒乓球', // Very popular in China
      'sport.badminton': '羽毛球', // Very popular in China
      'currency.format': '¥{amount}'
    }
  },
  
  // Initialize the i18n service
  async initialize() {
    // Get saved language or detect from browser
    this.currentLanguage = localStorage.getItem('preferredLanguage') || 
                          navigator.language.split('-')[0] || 'en';
    
    // Validate language
    if (!this.supportedLanguages[this.currentLanguage]) {
      this.currentLanguage = 'en';
    }
    
    // Set locale and currency
    const langConfig = this.supportedLanguages[this.currentLanguage];
    this.currentLocale = langConfig.locale;
    this.currentCurrency = langConfig.currency;
    
    // Apply RTL if needed
    this.applyRTL();
    
    // Add language selector
    this.addLanguageSelector();
    
    // Translate page
    this.translatePage();
    
    // Set up mutation observer for dynamic content
    this.observeDynamicContent();
  },
  
  // Apply RTL layout for RTL languages
  applyRTL() {
    const isRTL = this.rtlLanguages.includes(this.currentLanguage);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = this.currentLanguage;
    
    // Add RTL class for custom styling
    if (isRTL) {
      document.body.classList.add('rtl-layout');
    } else {
      document.body.classList.remove('rtl-layout');
    }
  },
  
  // Get translation for a key
  t(key, params = {}) {
    const translations = this.translations[this.currentLanguage] || this.translations.en;
    let translation = translations[key] || this.translations.en[key] || key;
    
    // Replace parameters
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{${param}}`, params[param]);
    });
    
    return translation;
  },
  
  // Format date/time according to locale
  formatDateTime(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: this.currentTimezone
    };
    
    return new Intl.DateTimeFormat(this.currentLocale, {...defaultOptions, ...options})
      .format(new Date(date));
  },
  
  // Format relative time (e.g., "2 hours ago")
  formatRelativeTime(date) {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
      return this.t('time.justNow');
    } else if (diffMins < 60) {
      return this.t('time.minutesAgo', { n: diffMins });
    } else if (diffHours < 24) {
      return this.t('time.hoursAgo', { n: diffHours });
    } else if (diffDays < 7) {
      return this.t('time.daysAgo', { n: diffDays });
    } else {
      return this.formatDateTime(date, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  },
  
  // Format currency
  formatCurrency(amount, currency = null) {
    const useCurrency = currency || this.currentCurrency;
    
    try {
      return new Intl.NumberFormat(this.currentLocale, {
        style: 'currency',
        currency: useCurrency
      }).format(amount);
    } catch (e) {
      // Fallback for unsupported currency
      return this.t('currency.format', { amount: amount.toFixed(2) });
    }
  },
  
  // Format distance (km/miles based on locale)
  formatDistance(km) {
    const isMetric = !['en-US', 'en-GB'].includes(this.currentLocale);
    
    if (isMetric) {
      return `${km.toFixed(1)} ${this.t('location.km')}`;
    } else {
      const miles = km * 0.621371;
      return `${miles.toFixed(1)} ${this.t('location.miles')}`;
    }
  },
  
  // Get culturally appropriate sport name
  getSportName(sportKey) {
    return this.t(`sport.${sportKey}`) || sportKey;
  },
  
  // Add language selector to header
  addLanguageSelector() {
    const headerRight = document.querySelector('.header-right, .user-menu');
    if (!headerRight) return;
    
    // Remove existing selector if any
    const existing = document.querySelector('.i18n-language-selector');
    if (existing) existing.remove();
    
    const selector = document.createElement('div');
    selector.className = 'i18n-language-selector';
    selector.innerHTML = `
      <button class="language-btn" onclick="window.I18nService.toggleLanguageMenu()">
        <span class="current-flag">${this.supportedLanguages[this.currentLanguage].flag}</span>
        <span class="current-lang-name">${this.supportedLanguages[this.currentLanguage].name}</span>
        <span class="dropdown-arrow">▼</span>
      </button>
      <div class="language-dropdown" style="display: none;">
        ${Object.entries(this.supportedLanguages).map(([code, lang]) => `
          <div class="language-option ${code === this.currentLanguage ? 'active' : ''}" 
               onclick="window.I18nService.changeLanguage('${code}')">
            <span class="lang-flag">${lang.flag}</span>
            <span class="lang-name">${lang.name}</span>
            ${code === this.currentLanguage ? '<span class="checkmark">✓</span>' : ''}
          </div>
        `).join('')}
      </div>
    `;
    
    // Add styles
    this.addLanguageSelectorStyles();
    
    // Insert at the beginning of header-right
    headerRight.insertBefore(selector, headerRight.firstChild);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.i18n-language-selector')) {
        const dropdown = document.querySelector('.language-dropdown');
        if (dropdown) dropdown.style.display = 'none';
      }
    });
  },
  
  // Add language selector styles
  addLanguageSelectorStyles() {
    if (document.getElementById('i18n-selector-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'i18n-selector-styles';
    style.textContent = `
      .i18n-language-selector {
        position: relative;
        margin-right: 20px;
      }
      
      .language-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        transition: all 0.3s;
      }
      
      .language-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
      }
      
      .current-flag {
        font-size: 20px;
      }
      
      .dropdown-arrow {
        font-size: 10px;
        margin-left: 4px;
        transition: transform 0.3s;
      }
      
      .language-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 10px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        min-width: 200px;
        max-height: 400px;
        overflow-y: auto;
        z-index: 1000;
      }
      
      .language-option {
        padding: 12px 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: background 0.2s;
        color: #333;
      }
      
      .language-option:hover {
        background: #f5f5f5;
      }
      
      .language-option.active {
        background: #e8f4f8;
        font-weight: 600;
      }
      
      .language-option:first-child {
        border-radius: 12px 12px 0 0;
      }
      
      .language-option:last-child {
        border-radius: 0 0 12px 12px;
      }
      
      .lang-flag {
        font-size: 24px;
      }
      
      .checkmark {
        margin-left: auto;
        color: #4CAF50;
      }
      
      /* RTL Support */
      .rtl-layout .i18n-language-selector {
        margin-right: 0;
        margin-left: 20px;
      }
      
      .rtl-layout .language-dropdown {
        right: auto;
        left: 0;
      }
      
      .rtl-layout .language-option {
        flex-direction: row-reverse;
      }
      
      .rtl-layout .checkmark {
        margin-left: 0;
        margin-right: auto;
      }
      
      /* Dark mode support */
      body.dark-mode .language-btn {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
      }
      
      body.dark-mode .language-dropdown {
        background: #2b2b2b;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      }
      
      body.dark-mode .language-option {
        color: #fff;
      }
      
      body.dark-mode .language-option:hover {
        background: #3a3a3a;
      }
      
      body.dark-mode .language-option.active {
        background: #4a4a4a;
      }
    `;
    
    document.head.appendChild(style);
  },
  
  // Toggle language menu
  toggleLanguageMenu() {
    const dropdown = document.querySelector('.language-dropdown');
    if (dropdown) {
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
  },
  
  // Change language
  async changeLanguage(lang) {
    if (lang === this.currentLanguage) return;
    
    // Show loading indicator
    this.showLoadingIndicator();
    
    // Save preference
    this.currentLanguage = lang;
    const langConfig = this.supportedLanguages[lang];
    this.currentLocale = langConfig.locale;
    this.currentCurrency = langConfig.currency;
    
    localStorage.setItem('preferredLanguage', lang);
    localStorage.setItem('preferredLocale', this.currentLocale);
    localStorage.setItem('preferredCurrency', this.currentCurrency);
    
    // Apply RTL if needed
    this.applyRTL();
    
    // Update language selector
    const btn = document.querySelector('.language-btn');
    if (btn) {
      btn.querySelector('.current-flag').textContent = langConfig.flag;
      btn.querySelector('.current-lang-name').textContent = langConfig.name;
    }
    
    // Hide dropdown
    const dropdown = document.querySelector('.language-dropdown');
    if (dropdown) dropdown.style.display = 'none';
    
    // Translate page
    await this.translatePage();
    
    // Hide loading indicator
    this.hideLoadingIndicator();
    
    // Dispatch language change event
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: lang, locale: this.currentLocale } 
    }));
  },
  
  // Translate the entire page
  async translatePage() {
    // Translate all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const params = element.getAttribute('data-i18n-params');
      
      const translation = this.t(key, params ? JSON.parse(params) : {});
      
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.placeholder = translation;
      } else {
        element.textContent = translation;
      }
    });
    
    // Translate specific elements without data-i18n
    this.translateNavigationItems();
    this.translateSocialFeed();
    this.updateTimeElements();
    this.updateCurrencyElements();
    
    // Update page title
    document.title = `${this.t('hero.title')} - ${this.t('tagline')}`;
  },
  
  // Translate navigation items
  translateNavigationItems() {
    const navMappings = {
      'Play Now': 'nav.playNow',
      'Social Feed': 'nav.socialFeed',
      'Upcoming Games': 'nav.upcomingGames',
      'Sport Rules': 'nav.sportRules'
    };
    
    document.querySelectorAll('.tab').forEach(tab => {
      const text = tab.textContent.trim();
      if (navMappings[text]) {
        tab.textContent = this.t(navMappings[text]);
      }
    });
  },
  
  // Translate social feed specific elements
  translateSocialFeed() {
    // Update channel names
    document.querySelectorAll('.channel-item').forEach(item => {
      const channelName = item.textContent.trim();
      if (channelName.startsWith('#')) {
        const sport = channelName.substring(1);
        const translatedSport = this.getSportName(sport);
        if (translatedSport !== sport) {
          item.querySelector('.channel-name')?.textContent = `#${translatedSport}`;
        }
      }
    });
    
    // Update message placeholders
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
      const channel = window.SocialFeedPage?.currentChannel || 'general';
      messageInput.placeholder = this.t('social.message.placeholder');
    }
    
    // Update typing indicators
    this.updateTypingIndicator();
  },
  
  // Update typing indicator with translation
  updateTypingIndicator() {
    if (!window.SocialFeedPage) return;
    
    const indicator = document.getElementById('typingIndicator');
    if (!indicator) return;
    
    const typingUsers = window.SocialFeedPage.typingUsers;
    if (typingUsers && typingUsers.size > 0) {
      const users = Array.from(typingUsers.values());
      let text = '';
      
      if (users.length === 1) {
        text = this.t('social.typing', { user: users[0].name });
      } else {
        const userNames = users.slice(0, 2).map(u => u.name).join(', ');
        text = this.t('social.multipleTyping', { users: userNames });
      }
      
      indicator.querySelector('.typing-text').textContent = text;
    }
  },
  
  // Update all time elements on the page
  updateTimeElements() {
    document.querySelectorAll('[data-timestamp]').forEach(element => {
      const timestamp = element.getAttribute('data-timestamp');
      element.textContent = this.formatRelativeTime(timestamp);
    });
    
    document.querySelectorAll('[data-datetime]').forEach(element => {
      const datetime = element.getAttribute('data-datetime');
      const format = element.getAttribute('data-format') || 'full';
      
      const options = format === 'date' ? 
        { year: 'numeric', month: 'long', day: 'numeric' } :
        format === 'time' ?
        { hour: '2-digit', minute: '2-digit' } :
        { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        
      element.textContent = this.formatDateTime(datetime, options);
    });
  },
  
  // Update all currency elements
  updateCurrencyElements() {
    document.querySelectorAll('[data-currency]').forEach(element => {
      const amount = parseFloat(element.getAttribute('data-currency'));
      const currency = element.getAttribute('data-currency-code');
      element.textContent = this.formatCurrency(amount, currency);
    });
  },
  
  // Observe DOM changes and translate new content
  observeDynamicContent() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            // Translate new elements
            if (node.hasAttribute('data-i18n')) {
              const key = node.getAttribute('data-i18n');
              node.textContent = this.t(key);
            }
            
            // Translate child elements
            node.querySelectorAll('[data-i18n]').forEach(child => {
              const key = child.getAttribute('data-i18n');
              child.textContent = this.t(key);
            });
            
            // Update timestamps
            node.querySelectorAll('[data-timestamp]').forEach(element => {
              const timestamp = element.getAttribute('data-timestamp');
              element.textContent = this.formatRelativeTime(timestamp);
            });
            
            // Update currency
            node.querySelectorAll('[data-currency]').forEach(element => {
              const amount = parseFloat(element.getAttribute('data-currency'));
              element.textContent = this.formatCurrency(amount);
            });
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  },
  
  // Show loading indicator
  showLoadingIndicator() {
    const loader = document.createElement('div');
    loader.id = 'i18n-loading';
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
      <span>Loading language...</span>
    `;
    
    document.body.appendChild(loader);
  },
  
  // Hide loading indicator
  hideLoadingIndicator() {
    const loader = document.getElementById('i18n-loading');
    if (loader) loader.remove();
  },
  
  // Helper function for social feed integration
  translateSocialMessage(message) {
    // Translate sport mentions in messages
    const sportPattern = /#(basketball|soccer|football|volleyball|tennis|hockey|cricket|rugby|baseball)/gi;
    return message.replace(sportPattern, (match, sport) => {
      return '#' + this.getSportName(sport.toLowerCase());
    });
  },
  
  // Format game time with timezone
  formatGameTime(date, showTimezone = true) {
    const options = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: this.currentTimezone
    };
    
    if (showTimezone) {
      options.timeZoneName = 'short';
    }
    
    return new Intl.DateTimeFormat(this.currentLocale, options).format(new Date(date));
  },
  
  // Get user's timezone
  getUserTimezone() {
    return this.currentTimezone;
  },
  
  // Convert price between currencies (basic conversion)
  convertCurrency(amount, fromCurrency, toCurrency = null) {
    // This would normally use a real exchange rate API
    // For demo, using approximate rates
    const rates = {
      USD: 1,
      EUR: 0.85,
      GBP: 0.73,
      CAD: 1.25,
      AUD: 1.35,
      JPY: 110,
      CNY: 6.5,
      INR: 74,
      BRL: 5.2,
      RUB: 75,
      KRW: 1180,
      SAR: 3.75,
      ILS: 3.2,
      TRY: 8.5,
      PLN: 4.0
    };
    
    const targetCurrency = toCurrency || this.currentCurrency;
    const usdAmount = amount / (rates[fromCurrency] || 1);
    const convertedAmount = usdAmount * (rates[targetCurrency] || 1);
    
    return this.formatCurrency(convertedAmount, targetCurrency);
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.I18nService.initialize();
  });
} else {
  window.I18nService.initialize();
}

// Export for use in other modules
window.i18n = window.I18nService;