// Admin analytics functionality
let reportsOrdersCache = null;
let salesChart = null;

// Helper function to parse order dates
function parseOrderDate(order) {
  try {
    if (!order.timestamp) return null;
    
    // Handle both ISO string and Date object
    const date = new Date(order.timestamp);
    if (isNaN(date.getTime())) return null;
    
    return date;
  } catch (error) {
    console.warn('Failed to parse order date:', error);
    return null;
  }
}

// Helper function to format currency
function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '₡0';
  return '₡' + amount.toLocaleString('es-CR');
}

// Helper function to compute metrics for orders
function computeMetricsForOrders(orders) {
  const metrics = {
    installmentDebt: 0,
    cashSales: 0,
    initials: 0
  };
  
  orders.forEach(order => {
    const total = order.total || (order.paymentPlan && order.paymentPlan.totalFinanced) || 0;
    
    if (order.payment === 'Cuotas' || order.payment === 'Plan de cuotas') {
      metrics.installmentDebt += total;
    } else if (order.payment === 'Efectivo') {
      metrics.cashSales += total;
    }
    
    // Count initials (assuming this is the number of first-time sales or similar)
    if (order.payment === 'Prima' || order.isInitial) {
      metrics.initials += total;
    }
  });
  
  return metrics;
}

// Helper function to show notifications
function showNotification(message, type = 'info') {
  // Try to use existing showToast function if available
  if (typeof showToast === 'function') {
    showToast(message, type);
  } else {
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}

// Main function to render reports for a given range
function renderReportsForRange(range) {
  if (!reportsOrdersCache) return;
  const now = new Date();
  let start;
  if (range === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  } else if (range === '7d') {
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else {
    start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  const end = now;

  const filtered = reportsOrdersCache.filter(o => {
    const d = parseOrderDate(o);
    if (!d) return false;
    return d >= start && d <= end;
  });

  // Aggregate totals by day (YYYY-MM-DD)
  const dailyTotals = {};
  filtered.forEach(o => {
    const d = parseOrderDate(o);
    if (!d) return;
    
    const dateKey = d.toISOString().split('T')[0]; // YYYY-MM-DD format
    const total = o.total || (o.paymentPlan && o.paymentPlan.totalFinanced) || 0;
    
    if (!dailyTotals[dateKey]) {
      dailyTotals[dateKey] = 0;
    }
    dailyTotals[dateKey] += total;
  });

  // Prepare chart data
  const sortedDates = Object.keys(dailyTotals).sort();
  const labels = sortedDates;
  const data = sortedDates.map(date => dailyTotals[date]);
  const filteredCount = filtered.length;

  // Debug logging
  console.debug('renderReportsForRange:', {
    range,
    labels,
    data,
    filteredCount
  });

  // Handle empty data case
  const salesChartCanvas = document.getElementById('salesChart');
  const noDataElement = document.getElementById('no-data-sales');
  
  if (labels.length === 0) {
    // Hide canvas and show no data message
    if (salesChartCanvas) {
      salesChartCanvas.style.display = 'none';
    }
    
    // Remove existing no-data message if present
    if (noDataElement) {
      noDataElement.remove();
    }
    
    // Create and insert no-data message
    const noDataParagraph = document.createElement('p');
    noDataParagraph.id = 'no-data-sales';
    noDataParagraph.className = 'empty-list-message';
    noDataParagraph.textContent = 'No hay ventas en el rango seleccionado.';
    
    if (salesChartCanvas && salesChartCanvas.parentNode) {
      salesChartCanvas.parentNode.insertBefore(noDataParagraph, salesChartCanvas.nextSibling);
    }
  } else {
    // Show canvas and remove no data message
    if (salesChartCanvas) {
      salesChartCanvas.style.display = 'block';
    }
    
    if (noDataElement) {
      noDataElement.remove();
    }
    
    // Update or create chart
    try {
      if (salesChart) {
        // Try to update existing chart
        try {
          salesChart.data.labels = labels;
          salesChart.data.datasets[0].data = data;
          salesChart.update();
        } catch (updateError) {
          console.warn('Failed to update chart, recreating:', updateError);
          salesChart.destroy();
          salesChart = null;
          createNewChart();
        }
      } else {
        createNewChart();
      }
    } catch (error) {
      console.error('Chart creation/update failed:', error);
      showNotification('No se pudo renderizar la gráfica (ver consola).', 'error');
    }
  }

  // Always compute and update KPIs
  const metrics = computeMetricsForOrders(filtered);
  updateKPIElements(metrics);

  function createNewChart() {
    if (!salesChartCanvas) {
      console.warn('Sales chart canvas not found');
      return;
    }
    
    const ctx = salesChartCanvas.getContext('2d');
    salesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Ventas ($)',
          data: data,
          borderColor: '#F97316',
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  function updateKPIElements(metrics) {
    const installmentDebtEl = document.getElementById('kpi-installment-debt');
    const cashSalesEl = document.getElementById('kpi-cash-sales');
    const initialsEl = document.getElementById('kpi-initials');
    
    if (installmentDebtEl) {
      installmentDebtEl.textContent = formatCurrency(metrics.installmentDebt);
    }
    if (cashSalesEl) {
      cashSalesEl.textContent = formatCurrency(metrics.cashSales);
    }
    if (initialsEl) {
      initialsEl.textContent = formatCurrency(metrics.initials);
    }
  }
}

// Export the function for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { renderReportsForRange, parseOrderDate, computeMetricsForOrders, formatCurrency };
}