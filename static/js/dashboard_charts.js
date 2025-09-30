// Graphiques du dashboard avec Chart.js
let salesChart = null;
let topProductsChart = null;
let paymentMethodsChart = null;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Attendre que le DOM soit complètement chargé
    setTimeout(() => {
        initCharts();
        loadSalesChart('30d');
        refreshCharts(); // Charger les données initiales
    }, 500);
    
    // Auto-refresh toutes les 60 secondes
    setInterval(() => {
        refreshCharts();
    }, 60000);
});

// Initialiser les graphiques
function initCharts() {
    // Graphique des ventes
    const salesCtx = document.getElementById('salesChart');
    if (salesCtx) {
        salesChart = new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Chiffre d\'affaires',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Graphique top produits
    const topProductsCtx = document.getElementById('topProductsChart');
    if (topProductsCtx) {
        topProductsChart = new Chart(topProductsCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'CA',
                    data: [],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)'
                    ],
                    borderColor: [
                        'rgb(255, 99, 132)',
                        'rgb(54, 162, 235)',
                        'rgb(255, 206, 86)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return formatCurrency(context.parsed.x);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Graphique méthodes de paiement
    const paymentMethodsCtx = document.getElementById('paymentMethodsChart');
    if (paymentMethodsCtx) {
        paymentMethodsChart = new Chart(paymentMethodsCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = formatCurrency(context.parsed);
                                return label + ': ' + value;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Charger le graphique des ventes
async function loadSalesChart(period = '30d') {
    try {
        const response = await apiRequest(`/api/dashboard/sales-chart?period=${period}`);
        const data = response.data || {};
        
        if (salesChart && data.labels && data.data) {
            salesChart.data.labels = data.labels;
            salesChart.data.datasets[0].data = data.data;
            salesChart.update();
        }
    } catch (error) {
        console.error('Erreur chargement graphique ventes:', error);
    }
}

// Charger les statistiques et mettre à jour les graphiques
async function refreshCharts() {
    try {
        const response = await apiRequest('/api/dashboard/stats');
        const stats = response.data || {};
        
        // Mettre à jour le graphique top produits (limité à 10)
        if (topProductsChart && stats.top_products && stats.top_products.length > 0) {
            const products = stats.top_products.slice(0, 10);
            topProductsChart.data.labels = products.map(p => p.name || 'N/A');
            topProductsChart.data.datasets[0].data = products.map(p => p.revenue || 0);
            
            // Générer des couleurs dynamiques
            const colors = products.map((_, i) => {
                const hue = (i * 360 / products.length) % 360;
                return `hsla(${hue}, 70%, 60%, 0.8)`;
            });
            topProductsChart.data.datasets[0].backgroundColor = colors;
            topProductsChart.data.datasets[0].borderColor = colors.map(c => c.replace('0.8', '1'));
            
            topProductsChart.update();
        }
        
        // Mettre à jour le graphique méthodes de paiement
        if (paymentMethodsChart && stats.payment_methods && stats.payment_methods.length > 0) {
            paymentMethodsChart.data.labels = stats.payment_methods.map(pm => pm.method || 'N/A');
            paymentMethodsChart.data.datasets[0].data = stats.payment_methods.map(pm => pm.amount || 0);
            paymentMethodsChart.update();
        }
        
    } catch (error) {
        console.error('Erreur refresh graphiques:', error);
    }
}

// Changer la période du graphique des ventes
function changeSalesPeriod(period) {
    // Mettre à jour les boutons actifs
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Recharger le graphique
    loadSalesChart(period);
}

// Formatter les montants en FCFA
function formatCurrency(value) {
    if (value === null || value === undefined) return '0 F CFA';
    return new Intl.NumberFormat('fr-FR', { 
        style: 'currency', 
        currency: 'XOF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value).replace('XOF', 'F CFA');
}
