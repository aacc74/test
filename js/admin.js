/* ============================================
   ADMIN.JS - Admin Panel and Chart Functionality
   ============================================ */

// Admin functionality
(() => {
    // Ensure the shared functionality is loaded
    if (!window.AppGlobals) {
        console.error('Admin.js requires shared.js to be loaded first');
        return;
    }

    // Chart instances storage for responsive resizing
    window.ChartInstances = {};

    // Admin-specific functionality
    window.AdminManager = {
        // Initialize admin panel
        init: function() {
            this.setupEventListeners();
            this.initResponsiveCharts();
        },

        setupEventListeners: function() {
            // Admin panel button
            const adminPanelBtn = document.getElementById('admin-panel-btn');
            if (adminPanelBtn) {
                adminPanelBtn.addEventListener('click', () => {
                    window.ModalManager.open('admin-modal');
                    this.loadOnlineUsers();
                    this.loadAdminData();
                });
            }

            // Close admin modal
            const closeAdminModal = document.getElementById('close-admin-modal');
            if (closeAdminModal) {
                closeAdminModal.addEventListener('click', () => {
                    window.ModalManager.close('admin-modal');
                });
            }

            // Admin analytics button
            const adminAnalyticsBtn = document.getElementById('admin-analytics-btn');
            if (adminAnalyticsBtn) {
                adminAnalyticsBtn.addEventListener('click', () => {
                    this.showAdminAnalytics();
                });
            }
        },

        // Initialize responsive chart behavior
        initResponsiveCharts: function() {
            // Override Chart.js default responsive options
            if (window.Chart) {
                Chart.defaults.responsive = true;
                Chart.defaults.maintainAspectRatio = false;
                Chart.defaults.plugins.legend.responsive = true;
                Chart.defaults.plugins.tooltip.responsive = true;
            }
        },

        // Create responsive chart with proper container sizing
        createResponsiveChart: function(canvasId, config, containerId = null) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.error(`Canvas with id '${canvasId}' not found`);
                return null;
            }

            // Destroy existing chart if it exists
            if (window.ChartInstances[canvasId]) {
                window.ChartInstances[canvasId].destroy();
            }

            // Enhanced responsive configuration
            const responsiveConfig = {
                ...config,
                options: {
                    ...config.options,
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        ...config.options?.plugins,
                        legend: {
                            ...config.options?.plugins?.legend,
                            responsive: true,
                            labels: {
                                ...config.options?.plugins?.legend?.labels,
                                usePointStyle: true,
                                padding: 20,
                                font: {
                                    size: function(context) {
                                        // Responsive font sizing
                                        const width = context.chart.width;
                                        if (width < 480) return 10;
                                        if (width < 768) return 12;
                                        return 14;
                                    }
                                }
                            }
                        }
                    },
                    scales: config.options?.scales ? {
                        ...config.options.scales,
                        x: {
                            ...config.options.scales.x,
                            ticks: {
                                ...config.options.scales.x?.ticks,
                                font: {
                                    size: function(context) {
                                        const width = context.chart.width;
                                        if (width < 480) return 9;
                                        if (width < 768) return 11;
                                        return 12;
                                    }
                                }
                            }
                        },
                        y: {
                            ...config.options.scales.y,
                            ticks: {
                                ...config.options.scales.y?.ticks,
                                font: {
                                    size: function(context) {
                                        const width = context.chart.width;
                                        if (width < 480) return 9;
                                        if (width < 768) return 11;
                                        return 12;
                                    }
                                }
                            }
                        }
                    } : undefined
                }
            };

            // Create the chart
            const chart = new Chart(canvas.getContext('2d'), responsiveConfig);
            
            // Store reference for later resizing
            window.ChartInstances[canvasId] = chart;
            
            // Force initial resize after creation
            setTimeout(() => {
                chart.resize();
            }, 100);

            return chart;
        },

        // Force all charts to resize (called when modals open)
        resizeAllCharts: function() {
            Object.values(window.ChartInstances).forEach(chart => {
                if (chart && typeof chart.resize === 'function') {
                    chart.resize();
                }
            });
            
            // Also trigger global resize event
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 50);
        },

        // Show admin analytics with responsive charts
        showAdminAnalytics: function() {
            const adminAnalyticsModal = document.getElementById('admin-analytics-modal');
            if (!adminAnalyticsModal) return;

            window.ModalManager.open('admin-analytics-modal');
            
            // Delay chart creation to ensure modal is visible
            setTimeout(() => {
                this.createAdminCharts();
                this.resizeAllCharts();
            }, 150);
        },

        // Create admin dashboard charts
        createAdminCharts: function() {
            this.createSalesChart();
            this.createRevenueChart();
            this.createStoreComparisonChart();
            this.createPaymentMethodsChart();
        },

        // Sales trend chart
        createSalesChart: function() {
            const config = {
                type: 'line',
                data: {
                    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Ventas',
                        data: [12, 19, 3, 5, 2, 3],
                        borderColor: 'rgba(0, 0, 0, 1)',
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        borderWidth: 2,
                        fill: true
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            };

            this.createResponsiveChart('salesChart', config);
        },

        // Revenue chart
        createRevenueChart: function() {
            const config = {
                type: 'bar',
                data: {
                    labels: ['Cartago Centro', 'San José Centro', 'Heredia Centro'],
                    datasets: [{
                        label: 'Ingresos (₡)',
                        data: [150000, 200000, 180000],
                        backgroundColor: [
                            'rgba(255, 215, 0, 0.8)',
                            'rgba(255, 215, 0, 0.6)',
                            'rgba(255, 215, 0, 0.4)'
                        ],
                        borderColor: 'rgba(0, 0, 0, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '₡' + value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            };

            this.createResponsiveChart('revenueChart', config);
        },

        // Store comparison chart
        createStoreComparisonChart: function() {
            const config = {
                type: 'doughnut',
                data: {
                    labels: ['Cartago Centro', 'San José Centro', 'Heredia Centro', 'Alajuela Norte'],
                    datasets: [{
                        data: [30, 25, 25, 20],
                        backgroundColor: [
                            'rgba(255, 215, 0, 0.8)',
                            'rgba(0, 0, 0, 0.8)',
                            'rgba(255, 215, 0, 0.6)',
                            'rgba(0, 0, 0, 0.6)'
                        ],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    cutout: '50%'
                }
            };

            this.createResponsiveChart('storeComparisonChart', config);
        },

        // Payment methods chart
        createPaymentMethodsChart: function() {
            const config = {
                type: 'pie',
                data: {
                    labels: ['Efectivo', 'Tarjeta', 'Móvil', 'En línea'],
                    datasets: [{
                        data: [40, 30, 20, 10],
                        backgroundColor: [
                            'rgba(245, 158, 11, 0.8)',
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(139, 92, 246, 0.8)'
                        ],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                }
            };

            this.createResponsiveChart('paymentMethodsChart', config);
        },

        // Load online users (placeholder)
        loadOnlineUsers: function() {
            // This would typically load from a real-time database
            const onlineUsersContainer = document.getElementById('online-users-list');
            if (onlineUsersContainer) {
                onlineUsersContainer.innerHTML = `
                    <div class="user-online-item">
                        <span class="online-status online"></span>
                        <span>vendedor1@accesorios.com</span>
                        <span class="user-location">Cartago Centro</span>
                    </div>
                    <div class="user-online-item">
                        <span class="online-status online"></span>
                        <span>vendedor2@accesorios.com</span>
                        <span class="user-location">San José Centro</span>
                    </div>
                `;
            }
        },

        // Load admin data (placeholder)
        loadAdminData: function() {
            // This would typically load real admin data
            console.log('Loading admin data...');
        }
    };

    // Enhanced responsive handling for modal events
    const originalModalOpen = window.ModalManager.open;
    window.ModalManager.open = function(modalId) {
        originalModalOpen.call(this, modalId);
        
        // If opening an admin modal, ensure charts resize properly
        if (modalId.includes('admin') || modalId.includes('analytics')) {
            setTimeout(() => {
                window.AdminManager.resizeAllCharts();
            }, 200);
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.AdminManager.init();
        });
    } else {
        window.AdminManager.init();
    }

    // Export for global access
    window.AdminManager = window.AdminManager;

})();