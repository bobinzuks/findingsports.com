// INCOGNITO MODE FIX - Handles storage restrictions in private browsing
(function() {
    'use strict';
    
    console.log('🔒 Incognito Mode Fix Active');
    
    // Check if storage is available
    function isStorageAvailable(type) {
        try {
            const storage = window[type];
            const x = '__storage_test__';
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        } catch(e) {
            console.warn(`${type} is not available (likely incognito mode)`);
            return false;
        }
    }
    
    // Create fallback storage
    const memoryStorage = {
        _data: {},
        setItem: function(key, value) {
            this._data[key] = value;
        },
        getItem: function(key) {
            return this._data[key] || null;
        },
        removeItem: function(key) {
            delete this._data[key];
        },
        clear: function() {
            this._data = {};
        }
    };
    
    // Override storage if not available
    if (!isStorageAvailable('localStorage')) {
        console.log('📦 Using fallback memory storage for localStorage');
        window.localStorage = memoryStorage;
    }
    
    if (!isStorageAvailable('sessionStorage')) {
        console.log('📦 Using fallback memory storage for sessionStorage');
        window.sessionStorage = Object.create(memoryStorage);
    }
    
    // Prevent service worker registration in incognito
    if (navigator.serviceWorker) {
        const originalRegister = navigator.serviceWorker.register;
        navigator.serviceWorker.register = function(...args) {
            console.log('🚫 Service worker registration blocked in incognito mode');
            return Promise.resolve({
                active: null,
                installing: null,
                waiting: null,
                scope: '/',
                updateViaCache: 'none',
                unregister: () => Promise.resolve(true),
                update: () => Promise.resolve()
            });
        };
    }
    
    // Wrap all localStorage/sessionStorage calls to prevent errors
    const originalSetItem = Storage.prototype.setItem;
    const originalGetItem = Storage.prototype.getItem;
    const originalRemoveItem = Storage.prototype.removeItem;
    
    Storage.prototype.setItem = function(key, value) {
        try {
            return originalSetItem.call(this, key, value);
        } catch (e) {
            console.warn('Storage setItem failed:', e);
            return memoryStorage.setItem(key, value);
        }
    };
    
    Storage.prototype.getItem = function(key) {
        try {
            return originalGetItem.call(this, key);
        } catch (e) {
            console.warn('Storage getItem failed:', e);
            return memoryStorage.getItem(key);
        }
    };
    
    Storage.prototype.removeItem = function(key) {
        try {
            return originalRemoveItem.call(this, key);
        } catch (e) {
            console.warn('Storage removeItem failed:', e);
            return memoryStorage.removeItem(key);
        }
    };
    
    console.log('✅ Incognito mode compatibility enabled');
})();