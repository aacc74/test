/* ============================================
   APP.JS - Main Application Logic
   ============================================ */

// Main application logic
(() => {
    // Ensure dependencies are loaded
    if (!window.AppGlobals || !window.SessionManager) {
        console.error('App.js requires shared.js to be loaded first');
        return;
    }

    // Application state
    let currentSaleItems = [];
    let editingSaleId = null;

    // Get DOM elements
    const {
        loginScreen,
        mainContent,
        usernameInput,
        passwordInput,
        storeSelect,
        loginForm,
        errorMessage,
        logoutBtn,
        currentUserSpan,
        currentStoreSpan
    } = window.DOMElements;

    // Additional DOM elements
    const addNormalItemBtn = document.getElementById('add-normal-item');
    const addVipItemBtn = document.getElementById('add-vip-item');
    const normalCategorySelect = document.getElementById('normal-category');
    const normalQuantityInput = document.getElementById('normal-quantity');
    const vipCategorySelect = document.getElementById('vip-category');
    const vipQuantityInput = document.getElementById('vip-quantity');
    const saveSaleBtn = document.getElementById('save-sale');
    const exportExcelBtn = document.getElementById('export-excel');
    const clearAllBtn = document.getElementById('clear-all');
    const viewSalesBtn = document.getElementById('view-sales');
    const analyticsBtn = document.getElementById('analytics');
    const saleItemsContainer = document.getElementById('sale-items');

    // Categories and prices
    const categories = {
        'Articulos': 1500,
        'Articulos (P)': 2000,
        'Bisuteria': 1200,
        'Bisuteria (P)': 1800,
        'Zapato': 3000,
        'Zapato (P)': 4000,
        'Prenda': 2500,
        'Prenda (P)': 3500,
        'B.Eco': 800,
        'Articulos (v)': 1000,
        'Bisuteria (v)': 800,
        'Zapato (v)': 2000,
        'Prenda (v)': 1800
    };

    // Application functions
    function showMainContent() {
        if (loginScreen) loginScreen.classList.add('hidden');
        if (mainContent) mainContent.classList.remove('hidden');
        if (currentUserSpan) currentUserSpan.textContent = window.AppGlobals.currentUserData;
        if (currentStoreSpan) currentStoreSpan.textContent = window.AppGlobals.currentStore;
        updateSaleItemsDisplay();
        window.AppGlobals.resetInactivityTimer();
        
        // Ensure charts resize properly when main content is shown
        setTimeout(() => {
            if (window.AdminManager && window.AdminManager.resizeAllCharts) {
                window.AdminManager.resizeAllCharts();
            }
        }, 100);
    }

    function addSaleItem(category, quantity) {
        const price = categories[category];
        if (!price) {
            window.showToast('Categoría no válida', 'error');
            return;
        }

        const existingItem = currentSaleItems.find(item => item.category === category);
        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.total = existingItem.quantity * existingItem.price;
        } else {
            currentSaleItems.push({
                category: category,
                quantity: quantity,
                price: price,
                total: price * quantity
            });
        }

        updateSaleItemsDisplay();
        window.showToast(`${quantity} ${category} agregado`, 'success');
    }

    function updateSaleItemsDisplay() {
        if (!saleItemsContainer) return;

        if (currentSaleItems.length === 0) {
            saleItemsContainer.innerHTML = '<p class="text-gray-500 text-center py-8">No hay artículos en la venta actual</p>';
            return;
        }

        let totalAmount = 0;
        const itemsHTML = currentSaleItems.map((item, index) => {
            totalAmount += item.total;
            return `
                <div class="sale-item bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
                    <div class="flex-1">
                        <div class="font-semibold text-gray-800">${item.category}</div>
                        <div class="text-sm text-gray-600">₡${item.price.toLocaleString()} x ${item.quantity}</div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold text-lg">₡${item.total.toLocaleString()}</div>
                        <button onclick="window.AppManager.removeSaleItem(${index})" 
                                class="text-red-500 hover:text-red-700 text-sm mt-1">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        saleItemsContainer.innerHTML = `
            ${itemsHTML}
            <div class="mt-4 p-4 bg-gray-100 rounded-lg">
                <div class="text-xl font-bold text-center">
                    Total: ₡${totalAmount.toLocaleString()}
                </div>
            </div>
        `;
    }

    function removeSaleItem(index) {
        if (index >= 0 && index < currentSaleItems.length) {
            currentSaleItems.splice(index, 1);
            updateSaleItemsDisplay();
            window.showToast('Artículo eliminado', 'warning');
        }
    }

    function clearAllItems() {
        if (currentSaleItems.length === 0) {
            window.showToast('No hay artículos para limpiar', 'warning');
            return;
        }

        if (confirm('¿Está seguro de limpiar todos los artículos?')) {
            currentSaleItems = [];
            updateSaleItemsDisplay();
            window.showToast('Todos los artículos eliminados', 'warning');
        }
    }

    function saveSale() {
        if (currentSaleItems.length === 0) {
            window.showToast('No hay artículos para guardar', 'error');
            return;
        }

        const saleData = {
            id: Date.now().toString(),
            items: [...currentSaleItems],
            total: currentSaleItems.reduce((sum, item) => sum + item.total, 0),
            user: window.AppGlobals.currentUserData,
            store: window.AppGlobals.currentStore,
            date: window.getCurrentCostaRicaDate().toISOString(),
            paymentMethod: 'efectivo'
        };

        // Save to localStorage
        const existingSales = window.StorageManager.loadData('sales', []);
        existingSales.push(saleData);
        window.StorageManager.saveData('sales', existingSales);

        // Clear current sale
        currentSaleItems = [];
        updateSaleItemsDisplay();

        window.showToast('Venta guardada exitosamente', 'success');
    }

    function exportToExcel() {
        const sales = window.StorageManager.loadData('sales', []);
        if (sales.length === 0) {
            window.showToast('No hay ventas para exportar', 'warning');
            return;
        }

        // Filter sales by current store (unless admin)
        const filteredSales = window.AppGlobals.isMasterUser ? 
            sales : 
            sales.filter(sale => sale.store === window.AppGlobals.currentStore);

        if (filteredSales.length === 0) {
            window.showToast('No hay ventas para exportar en esta tienda', 'warning');
            return;
        }

        // Create Excel data
        const excelData = filteredSales.map(sale => ({
            'ID Venta': sale.id,
            'Fecha': new Date(sale.date).toLocaleDateString('es-CR'),
            'Hora': new Date(sale.date).toLocaleTimeString('es-CR'),
            'Tienda': sale.store,
            'Usuario': sale.user,
            'Total': sale.total,
            'Método de Pago': sale.paymentMethod || 'efectivo',
            'Artículos': sale.items.map(item => `${item.category} (${item.quantity})`).join(', ')
        }));

        // Create workbook and worksheet
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ventas');

        // Generate filename
        const date = window.DateUtils.formatDateForDisplay(window.getCurrentCostaRicaDate());
        const store = window.AppGlobals.isMasterUser ? 'Todas' : window.AppGlobals.currentStore;
        const filename = `Ventas_${store}_${date}.xlsx`;

        // Download
        XLSX.writeFile(wb, filename);
        window.showToast('Excel exportado exitosamente', 'success');
    }

    function resetInactivityTimer() {
        clearTimeout(window.AppGlobals.inactivityTimer);
        window.AppGlobals.inactivityTimer = setTimeout(() => {
            window.showToast('Sesión cerrada por inactividad', 'warning');
            logout();
        }, 30 * 60 * 1000); // 30 minutes
    }

    function logout() {
        window.SessionManager.clear();
        if (mainContent) mainContent.classList.add('hidden');
        if (loginScreen) loginScreen.classList.remove('hidden');
        currentSaleItems = [];
        updateSaleItemsDisplay();
        clearTimeout(window.AppGlobals.inactivityTimer);
    }

    // Event Listeners
    function initializeEventListeners() {
        // Login form
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = usernameInput?.value.trim();
                const password = passwordInput?.value;
                const store = storeSelect?.value;
                
                if (!username || !password || !store) {
                    if (errorMessage) {
                        errorMessage.textContent = 'Usuario, contraseña y tienda requeridos';
                        errorMessage.classList.remove('hidden');
                    }
                    return;
                }
                
                const user = window.AppGlobals.users[username];
                if (user && user.password === password) {
                    if (username !== 'admin@accesorios.com' && !user.stores.includes(store)) {
                        if (errorMessage) {
                            errorMessage.textContent = 'No tiene acceso a esta tienda';
                            errorMessage.classList.remove('hidden');
                        }
                        return;
                    }
                    
                    window.AppGlobals.currentUserData = username;
                    window.AppGlobals.currentStore = store;
                    window.AppGlobals.isMasterUser = username === 'admin@accesorios.com';
                    window.SessionManager.save(username, store);
                    showMainContent();
                    if (errorMessage) errorMessage.classList.add('hidden');
                } else {
                    if (errorMessage) {
                        errorMessage.textContent = 'Credenciales incorrectas';
                        errorMessage.classList.remove('hidden');
                    }
                }
            });
        }

        // Logout button
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }

        // Sale item buttons
        if (addNormalItemBtn) {
            addNormalItemBtn.addEventListener('click', () => {
                const category = normalCategorySelect?.value;
                const quantity = parseInt(normalQuantityInput?.value) || 1;
                if (category) {
                    addSaleItem(category, quantity);
                    if (normalQuantityInput) normalQuantityInput.value = 1;
                }
            });
        }

        if (addVipItemBtn) {
            addVipItemBtn.addEventListener('click', () => {
                const category = vipCategorySelect?.value;
                const quantity = parseInt(vipQuantityInput?.value) || 1;
                if (category) {
                    addSaleItem(category, quantity);
                    if (vipQuantityInput) vipQuantityInput.value = 1;
                }
            });
        }

        // Action buttons
        if (saveSaleBtn) saveSaleBtn.addEventListener('click', saveSale);
        if (exportExcelBtn) exportExcelBtn.addEventListener('click', exportToExcel);
        if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllItems);

        if (viewSalesBtn) {
            viewSalesBtn.addEventListener('click', () => {
                window.ModalManager.open('sales-modal');
            });
        }

        if (analyticsBtn) {
            analyticsBtn.addEventListener('click', () => {
                window.ModalManager.open('analytics-modal');
            });
        }

        // Inactivity tracking
        const events = ['mousemove', 'keydown', 'click', 'scroll'];
        events.forEach(event => {
            document.addEventListener(event, resetInactivityTimer);
        });
    }

    // Initialization
    function initialize() {
        // Load active sessions
        window.AppGlobals.activeSessions = window.StorageManager.loadData('activeSessions', {});
        
        // Set default dates
        const todayStr = window.toYYYYMMDD(window.getCurrentCostaRicaDate());
        const dateInputs = [
            'start-date', 'end-date', 'admin-start-date', 'admin-end-date'
        ];
        
        dateInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) input.value = todayStr;
        });

        // Check for existing session
        if (window.SessionManager.load()) {
            showMainContent();
        } else {
            if (loginScreen) loginScreen.classList.remove('hidden');
        }

        // Initialize event listeners
        initializeEventListeners();

        // Initial display update
        updateSaleItemsDisplay();

        // Set up global reset timer function
        window.AppGlobals.resetInactivityTimer = resetInactivityTimer;
    }

    // Export public interface
    window.AppManager = {
        addSaleItem,
        removeSaleItem,
        clearAllItems,
        saveSale,
        exportToExcel,
        logout,
        showMainContent
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();