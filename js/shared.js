/* ============================================
   SHARED.JS - Core Application Functionality
   ============================================ */

// Core application IIFE
(() => {
    // Configuración de Firebase
    const firebaseConfig = {
      apiKey: "AIzaSyDjlI3qysLRd41TW3QTImB2XvdrhZ6PV8g",
      authDomain: "contador-214a3.firebaseapp.com",
      projectId: "contador-214a3",
      storageBucket: "contador-214a3.appspot.com",
      messagingSenderId: "909890810354",
      appId: "1:909890810354:web:007e7efd4281b25356bb6b"
    };

    // Inicializar Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // Variables globales
    window.AppGlobals = {
        db: db,
        users: { 
          'admin@accesorios.com': { 
            password: 'AdminSecure123!', 
            stores: ['all'],
            displayName: 'Administrador'
          },
          'vendedor1@accesorios.com': { 
            password: 'Vendedor1Pass!', 
            stores: ['Cartago Centro', 'Cartago Sur'],
            displayName: 'Vendedor 1'
          },
          'vendedor2@accesorios.com': { 
            password: 'Vendedor2Pass!', 
            stores: ['San José Centro', 'San José Este'],
            displayName: 'Vendedor 2'
          },
          'vendedor3@accesorios.com': { 
            password: 'Vendedor3Pass!', 
            stores: ['Heredia Centro', 'Alajuela Norte'],
            displayName: 'Vendedor 3'
          }
        },
        currentUserData: null,
        currentStore: null,
        isMasterUser: false,
        activeSessions: {},
        currentSaleItems: [],
        inactivityTimer: null
    };

    // DOM Elements - Global access
    window.DOMElements = {
        loginScreen: document.getElementById('login-screen'),
        mainContent: document.getElementById('main-content'),
        usernameInput: document.getElementById('username'),
        passwordInput: document.getElementById('password'),
        storeSelect: document.getElementById('store'),
        loginForm: document.getElementById('login-form'),
        errorMessage: document.getElementById('error-message'),
        logoutBtn: document.getElementById('logout'),
        currentUserSpan: document.getElementById('current-user'),
        currentStoreSpan: document.getElementById('current-store'),
        salesModal: document.getElementById('sales-modal'),
        closeSalesModal: document.getElementById('close-sales-modal'),
        analyticsModal: document.getElementById('analytics-modal'),
        closeAnalyticsModal: document.getElementById('close-analytics-modal'),
        adminModal: document.getElementById('admin-modal'),
        closeAdminModal: document.getElementById('close-admin-modal')
    };

    // --- UTILITY FUNCTIONS ---

    // Date and time utilities (Costa Rica UTC-6)
    window.DateUtils = {
        getCurrentCostaRicaDate: function() {
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            return new Date(utc + (-6 * 3600000)); // UTC-6 para Costa Rica
        },

        toYYYYMMDD: function(date) {
            return date.toISOString().split('T')[0];
        },

        formatDateForDisplay: function(date) {
            return date.toLocaleDateString('es-CR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        },

        formatTimeForDisplay: function(date) {
            return date.toLocaleTimeString('es-CR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    };

    // Toast notification system
    window.ToastManager = {
        show: function(message, type = 'info', duration = 3000) {
            const toast = document.getElementById('toast');
            if (!toast) return;

            // Remove existing classes
            toast.className = '';
            
            // Add base classes and type-specific class
            toast.classList.add('show');
            if (type === 'success') toast.classList.add('toast-success');
            else if (type === 'error') toast.classList.add('toast-error');
            else if (type === 'warning') toast.classList.add('toast-warning');
            
            toast.textContent = message;
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, duration);
        }
    };

    // Modal system
    window.ModalManager = {
        open: function(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('show');
                document.body.style.overflow = 'hidden';
            }
        },

        close: function(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('show');
                document.body.style.overflow = '';
            }
        },

        closeAll: function() {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                modal.classList.remove('show');
            });
            document.body.style.overflow = '';
        }
    };

    // Local storage utilities
    window.StorageManager = {
        saveData: function(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (error) {
                console.error('Error saving to localStorage:', error);
                return false;
            }
        },

        loadData: function(key, defaultValue = null) {
            try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : defaultValue;
            } catch (error) {
                console.error('Error loading from localStorage:', error);
                return defaultValue;
            }
        },

        removeData: function(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Error removing from localStorage:', error);
                return false;
            }
        }
    };

    // Session management
    window.SessionManager = {
        save: function(username, store) {
            const sessionData = {
                username: username,
                store: store,
                timestamp: Date.now()
            };
            window.StorageManager.saveData('currentSession', sessionData);
            
            // Update active sessions
            if (!window.AppGlobals.activeSessions[store]) {
                window.AppGlobals.activeSessions[store] = [];
            }
            
            if (!window.AppGlobals.activeSessions[store].includes(username)) {
                window.AppGlobals.activeSessions[store].push(username);
                window.StorageManager.saveData('activeSessions', window.AppGlobals.activeSessions);
            }
        },

        load: function() {
            const sessionData = window.StorageManager.loadData('currentSession');
            if (sessionData) {
                // Check if session is still valid (less than 24 hours old)
                const sessionAge = Date.now() - sessionData.timestamp;
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
                
                if (sessionAge < maxAge) {
                    window.AppGlobals.currentUserData = sessionData.username;
                    window.AppGlobals.currentStore = sessionData.store;
                    window.AppGlobals.isMasterUser = sessionData.username === 'admin@accesorios.com';
                    return true;
                }
            }
            return false;
        },

        clear: function() {
            const currentStore = window.AppGlobals.currentStore;
            const currentUser = window.AppGlobals.currentUserData;
            
            // Remove from active sessions
            if (currentStore && window.AppGlobals.activeSessions[currentStore]) {
                const index = window.AppGlobals.activeSessions[currentStore].indexOf(currentUser);
                if (index > -1) {
                    window.AppGlobals.activeSessions[currentStore].splice(index, 1);
                    window.StorageManager.saveData('activeSessions', window.AppGlobals.activeSessions);
                }
            }
            
            window.StorageManager.removeData('currentSession');
            window.AppGlobals.currentUserData = null;
            window.AppGlobals.currentStore = null;
            window.AppGlobals.isMasterUser = false;
        }
    };

    // Responsive utilities for chart resizing
    window.ResponsiveUtils = {
        // Debounce function for performance
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        // Force chart resize - for Chart.js responsive behavior
        resizeCharts: function() {
            // Dispatch resize event to trigger Chart.js responsive behavior
            window.dispatchEvent(new Event('resize'));
            
            // Also trigger on chart containers specifically
            const chartContainers = document.querySelectorAll('.chart-container');
            chartContainers.forEach(container => {
                const chart = container.querySelector('canvas');
                if (chart && chart.chart) {
                    // Force Chart.js to resize if chart instance exists
                    chart.chart.resize();
                }
            });
        },

        // Initialize responsive behavior
        init: function() {
            // Debounced resize handler
            const debouncedResize = this.debounce(this.resizeCharts, 250);
            window.addEventListener('resize', debouncedResize);
            
            // Also listen for orientation changes on mobile
            window.addEventListener('orientationchange', () => {
                setTimeout(debouncedResize, 100);
            });
        }
    };

    // Initialize responsive utilities
    window.ResponsiveUtils.init();

    // Global showToast function for backwards compatibility
    window.showToast = window.ToastManager.show;

    // Expose global references for other scripts
    window.getCurrentCostaRicaDate = window.DateUtils.getCurrentCostaRicaDate;
    window.toYYYYMMDD = window.DateUtils.toYYYYMMDD;

})();