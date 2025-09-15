/* Admin-specific JavaScript functionality */

// Chart resize functionality
function renderChart(chartConfig) {
  // Ensure maintainAspectRatio is false for responsive behavior
  if (chartConfig && chartConfig.options) {
    chartConfig.options.maintainAspectRatio = false;
  }
  
  // Create/render the chart (placeholder for actual chart library implementation)
  const chart = createChart(chartConfig);
  
  // Call resize method after chart creation
  if (chart && typeof chart.resize === 'function') {
    chart.resize();
  }
  
  return chart;
}

// Generate all reports with resize event dispatch
function generateAllReports() {
  return new Promise((resolve, reject) => {
    try {
      // Generate reports logic here (placeholder)
      const reports = [];
      
      // Render charts for each report
      reports.forEach(report => {
        if (report.chartConfig) {
          renderChart(report.chartConfig);
        }
      });
      
      // Dispatch resize event after report generation
      window.dispatchEvent(new Event('resize'));
      
      resolve(reports);
    } catch (error) {
      reject(error);
    }
  });
}

// Load reports functionality
function loadReports() {
  return generateAllReports()
    .then(reports => {
      // Process reports
      console.log('Reports loaded successfully');
      return reports;
    })
    .catch(error => {
      console.error('Error loading reports:', error);
      throw error;
    });
}

// Placeholder for chart creation - to be implemented with actual chart library
function createChart(config) {
  // This would be implemented with Chart.js, D3.js, or another charting library
  return {
    resize: function() {
      // Chart resize implementation
      console.log('Chart resized');
    }
  };
}

// Initialize admin functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Setup resize listener for charts
  window.addEventListener('resize', function() {
    // Resize all charts when window is resized
    const charts = document.querySelectorAll('.chart-container');
    charts.forEach(container => {
      // Trigger chart resize if chart instance exists
      if (container.chart && typeof container.chart.resize === 'function') {
        container.chart.resize();
      }
    });
  });
});