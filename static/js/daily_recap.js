// Récap Quotidien - Gestion de l'interface
let currentRecapData = null;

document.addEventListener('DOMContentLoaded', function() {
    // Initialiser la date d'aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('recapDate').value = today;
    
    // Charger automatiquement le récap d'aujourd'hui
    loadDailyRecap();
    
    // Event listener pour le changement de date
    document.getElementById('recapDate').addEventListener('change', loadDailyRecap);
});

async function loadDailyRecap() {
    try {
        const selectedDate = document.getElementById('recapDate').value;
        if (!selectedDate) {
            showError('Veuillez sélectionner une date');
            return;
        }
        
        showLoading();
        
        // Appel API pour récupérer les données
        const response = await axios.get('/api/daily-recap/stats', {
            params: { target_date: selectedDate }
        });
        
        const data = response.data;
        currentRecapData = data;
        
        // Mettre à jour l'affichage
        updateDateDisplay(data.date_formatted);
        updateFinancialSummary(data.finances);
        updateDailyPurchases(data.daily_purchases);
        updateQuickStats(data);
        updateDetailedTables(data);
        
        hideLoading();
        
    } catch (error) {
        console.error('Erreur lors du chargement du récap:', error);
        showError('Erreur lors du chargement du récap quotidien');
        hideLoading();
    }
}

function updateDateDisplay(dateFormatted) {
    document.getElementById('currentDate').textContent = `Récap du ${dateFormatted}`;
}

function updateFinancialSummary(finances) {
    // Mise à jour de la vue caisse
    document.getElementById('paymentsReceived').textContent = formatCurrency(finances.payments_received);
    document.getElementById('bankEntries').textContent = formatCurrency(finances.bank_entries);
    document.getElementById('bankExits').textContent = formatCurrency(finances.bank_exits);
    
    const balanceElement = document.getElementById('dailyBalance');
    const balance = finances.daily_balance;
    balanceElement.textContent = formatCurrency(balance);
    
    // Couleur du solde selon positif/négatif
    balanceElement.className = balance >= 0 ? 'h4 text-success mb-1' : 'h4 text-danger mb-1';

    // Achats quotidiens (déduits) et CA net
    const dpOut = document.getElementById('dailyPurchasesOut');
    if (dpOut) dpOut.textContent = formatCurrency(finances.daily_purchases_total || 0);
    const netRevEl = document.getElementById('netRevenue');
    if (netRevEl) {
        const net = (finances.net_revenue !== undefined && finances.net_revenue !== null)
            ? finances.net_revenue
            : (Number(finances.potential_revenue || 0) - Number(finances.daily_purchases_total || 0));
        netRevEl.textContent = formatCurrency(net);
    }
}

function updateQuickStats(data) {
    // Statistiques rapides
    document.getElementById('invoicesCreated').textContent = data.invoices.created_count;
    document.getElementById('quotationsCreated').textContent = data.quotations.created_count;
    document.getElementById('stockEntries').textContent = data.stock.entries_count;
    document.getElementById('stockExits').textContent = data.stock.exits_count;
}

function updateDetailedTables(data) {
    // Table des factures
    updateInvoicesTable(data.invoices.created_list);
    
    // Table des paiements
    updatePaymentsTable(data.payments.list);
    
    // Table des devis
    updateQuotationsTable(data.quotations.created_list);
    
    // Tables des mouvements de stock
    updateStockEntriesTable(data.stock.entries_list);
    updateStockExitsTable(data.stock.exits_list);
}

function updateDailyPurchases(dp) {
    try {
        const totalEl = document.getElementById('dailyPurchasesTotal');
        const chips = document.getElementById('dailyPurchasesByCategory');
        const tbody = document.getElementById('dailyPurchasesTable');
        if (!dp) {
            totalEl && (totalEl.textContent = formatCurrency(0));
            if (chips) chips.innerHTML = '<span class="text-muted">Aucune dépense</span>';
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Aucun achat</td></tr>';
            return;
        }
        totalEl && (totalEl.textContent = formatCurrency(dp.total || 0));
        if (chips) {
            const list = Array.isArray(dp.by_category) ? dp.by_category : [];
            chips.innerHTML = list.length ? list.map(x => `
                <span class="badge bg-light text-dark">
                    <span class="text-uppercase">${escapeHtml(x.category || '')}</span>
                    <span class="ms-1 fw-semibold">${formatCurrency(x.amount || 0)}</span>
                </span>
            `).join('') : '<span class="text-muted">Aucune dépense</span>';
        }
        if (tbody) {
            const items = Array.isArray(dp.list) ? dp.list : [];
            tbody.innerHTML = items.length ? items.map(it => `
                <tr>
                    <td>${escapeHtml(it.time || '')}</td>
                    <td class="text-uppercase"><span class="badge bg-secondary">${escapeHtml(it.category || '')}</span></td>
                    <td>${escapeHtml(it.description || '')}</td>
                    <td class="fw-semibold">${formatCurrency(it.amount || 0)}</td>
                    <td>${escapeHtml(it.method || '')}</td>
                    <td>${escapeHtml(it.reference || '')}</td>
                </tr>
            `).join('') : '<tr><td colspan="6" class="text-center text-muted">Aucun achat</td></tr>';
        }
    } catch (e) { console.error(e); }
}

function updateInvoicesTable(invoices) {
    const tbody = document.getElementById('invoicesTable');
    
    if (!invoices || invoices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Aucune facture créée ce jour</td></tr>';
        return;
    }
    
    tbody.innerHTML = invoices.map(invoice => `
        <tr>
            <td>${invoice.time}</td>
            <td><strong>${escapeHtml(invoice.number)}</strong></td>
            <td>${escapeHtml(invoice.client_name)}</td>
            <td>${formatCurrency(invoice.total)}</td>
            <td>
                <span class="badge bg-${getStatusBadgeColor(invoice.status)}">
                    ${getStatusLabel(invoice.status)}
                </span>
            </td>
        </tr>
    `).join('');
}

function updatePaymentsTable(payments) {
    const tbody = document.getElementById('paymentsTable');
    
    if (!payments || payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Aucun paiement reçu ce jour</td></tr>';
        return;
    }
    
    tbody.innerHTML = payments.map(payment => `
        <tr>
            <td>${payment.time}</td>
            <td>${escapeHtml(payment.invoice_number || '')}</td>
            <td><strong class="text-success">${formatCurrency(payment.amount)}</strong></td>
            <td>${escapeHtml(payment.method || 'Non spécifié')}</td>
        </tr>
    `).join('');
}

function updateQuotationsTable(quotations) {
    const tbody = document.getElementById('quotationsTable');
    
    if (!quotations || quotations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Aucun devis créé ce jour</td></tr>';
        return;
    }
    
    tbody.innerHTML = quotations.map(quotation => `
        <tr>
            <td>${quotation.time}</td>
            <td><strong>${escapeHtml(quotation.number)}</strong></td>
            <td>${escapeHtml(quotation.client_name)}</td>
            <td>${formatCurrency(quotation.total)}</td>
            <td>
                <span class="badge bg-${getStatusBadgeColor(quotation.status)}">
                    ${getStatusLabel(quotation.status)}
                </span>
            </td>
        </tr>
    `).join('');
}

function updateStockEntriesTable(entries) {
    const tbody = document.getElementById('stockEntriesTable');
    
    if (!entries || entries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Aucune entrée de stock ce jour</td></tr>';
        return;
    }
    
    tbody.innerHTML = entries.map(entry => `
        <tr>
            <td>${entry.time}</td>
            <td>${escapeHtml(entry.product_name)}</td>
            <td><span class="badge bg-success">+${entry.quantity}</span></td>
            <td>${escapeHtml(entry.reference || '')}</td>
        </tr>
    `).join('');
}

function updateStockExitsTable(exits) {
    const tbody = document.getElementById('stockExitsTable');
    
    if (!exits || exits.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Aucune sortie de stock ce jour</td></tr>';
        return;
    }
    
    tbody.innerHTML = exits.map(exit => `
        <tr>
            <td>${exit.time}</td>
            <td>${escapeHtml(exit.product_name)}</td>
            <td><span class="badge bg-danger">-${exit.quantity}</span></td>
            <td>${escapeHtml(exit.reference || '')}</td>
        </tr>
    `).join('');
}

// Fonctions utilitaires
function formatCurrency(amount) {
    try {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            maximumFractionDigits: 0
        }).format(amount || 0);
    } catch {
        return `${amount || 0} F CFA`;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getStatusBadgeColor(status) {
    const statusColors = {
        'en attente': 'warning',
        'payée': 'success',
        'partiellement payée': 'info',
        'en retard': 'danger',
        'annulée': 'secondary',
        'brouillon': 'secondary',
        'envoyé': 'primary',
        'accepté': 'success',
        'refusé': 'danger',
        'expiré': 'dark'
    };
    return statusColors[status?.toLowerCase()] || 'secondary';
}

function getStatusLabel(status) {
    const statusLabels = {
        'en attente': 'En attente',
        'payée': 'Payée',
        'partiellement payée': 'Partiellement payée',
        'en retard': 'En retard',
        'annulée': 'Annulée',
        'brouillon': 'Brouillon',
        'envoyé': 'Envoyé',
        'accepté': 'Accepté',
        'refusé': 'Refusé',
        'expiré': 'Expiré'
    };
    return statusLabels[status?.toLowerCase()] || status || 'Inconnu';
}

function showLoading() {
    // Afficher des spinners dans les éléments principaux
    const elements = [
        'invoicesCreated', 'quotationsCreated', 'stockEntries', 'stockExits',
        'paymentsReceived', 'bankEntries', 'bankExits', 'dailyBalance'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div>';
        }
    });
}

function hideLoading() {
    // Le chargement sera masqué par la mise à jour des données
}

function showError(message) {
    // Utiliser la fonction showAlert si elle existe, sinon alert simple
    if (typeof showAlert === 'function') {
        showAlert(message, 'danger');
    } else {
        alert(message);
    }
}

function showSuccess(message) {
    // Utiliser la fonction showAlert si elle existe, sinon console.log
    if (typeof showAlert === 'function') {
        showAlert(message, 'success');
    } else {
        console.log(message);
    }
}
