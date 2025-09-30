// Gestion des clients
let currentPage = 1;
const itemsPerPage = 10;
let clients = [];
let filteredClients = [];

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Utiliser la nouvelle logique d'authentification basée sur cookies
    const ready = () => {
        const hasAuthManager = !!window.authManager;
        const hasUser = !!(hasAuthManager && window.authManager.userData && Object.keys(window.authManager.userData).length);
        return hasAuthManager && (window.authManager.isAuthenticatedSync() || hasUser);
    };

    // Lancer immédiatement
    loadClients();
    setupEventListeners();
    
    // Appliquer la recherche passée via la navbar (?q=...)
    try {
        const params = new URLSearchParams(window.location.search || '');
        const q = (params.get('q') || '').trim();
        if (q) {
            const input = document.getElementById('searchInput');
            if (input) {
                input.value = q;
                // Déclencher le filtrage une fois la liste chargée
                setTimeout(() => {
                    try { filterClients(); } catch(e) { /* ignore */ }
                }, 50);
            }
        }
    } catch(e) { /* ignore */ }
});

function setupEventListeners() {
    // Recherche en temps réel
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterClients, 300));
    }
    // Filtres - tous déclenchent un rechargement côté serveur
    document.getElementById('cityFilter')?.addEventListener('input', debounce(filterClients, 300));
    document.getElementById('countryFilter')?.addEventListener('input', debounce(filterClients, 300));
    document.getElementById('hasEmailFilter')?.addEventListener('change', filterClients);
    document.getElementById('hasPhoneFilter')?.addEventListener('change', filterClients);
    document.getElementById('createdFrom')?.addEventListener('change', filterClients);
    document.getElementById('createdTo')?.addEventListener('change', filterClients);
}

// Utilitaire debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Charger la liste des clients avec recherche côté serveur
async function loadClients() {
    try {
        showLoading();
        
        // Construire les paramètres de recherche
        const searchTerm = (document.getElementById('searchInput')?.value || '').trim();
        const city = (document.getElementById('cityFilter')?.value || '').trim();
        const country = (document.getElementById('countryFilter')?.value || '').trim();
        const hasEmail = !!document.getElementById('hasEmailFilter')?.checked;
        const hasPhone = !!document.getElementById('hasPhoneFilter')?.checked;
        const createdFrom = document.getElementById('createdFrom')?.value || '';
        const createdTo = document.getElementById('createdTo')?.value || '';
        
        const params = {
            page: currentPage,
            limit: itemsPerPage
        };
        
        // Ajouter les filtres s'ils sont renseignés
        if (searchTerm) params.search = searchTerm;
        if (city) params.city = city;
        if (country) params.country = country;
        if (hasEmail) params.has_email = true;
        if (hasPhone) params.has_phone = true;
        if (createdFrom) params.created_from = createdFrom;
        if (createdTo) params.created_to = createdTo;
        
        // Utiliser safeLoadData pour éviter les chargements infinis
        const response = await safeLoadData(
            () => axios.get('/api/clients/', { params }),
            {
                timeout: 8000,
                fallbackData: { items: [], total: 0, page: 1, pages: 1 },
                errorMessage: 'Erreur lors du chargement des clients'
            }
        );
        
        const data = response.data || { items: [], total: 0, page: 1, pages: 1 };
        clients = data.items || data || [];
        filteredClients = [...clients];
        
        displayClients();
        updatePaginationWithServerData(data.total || clients.length);
        
    } catch (error) {
        console.error('Erreur lors du chargement des clients:', error);
        
        // Afficher un message d'erreur dans le tableau
        const tbody = document.getElementById('clientsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger py-4">
                        <i class="bi bi-exclamation-triangle fs-1 d-block mb-2"></i>
                        Erreur lors du chargement des clients
                    </td>
                </tr>
            `;
        }
        
        if (typeof showAlert === 'function') {
            showAlert('Erreur lors du chargement des clients', 'danger');
        }
    }
}

// Afficher les clients
function displayClients() {
    const tbody = document.getElementById('clientsTableBody');
    if (!tbody) return;

    if (filteredClients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    Aucun client trouvé
                </td>
            </tr>
        `;
        return;
    }

    // Afficher directement les clients retournés par le serveur (pagination déjà faite)
    const clientsToShow = filteredClients;

    tbody.innerHTML = clientsToShow.map(client => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <div class="avatar-sm bg-primary rounded-circle d-flex align-items-center justify-content-center me-3">
                        <i class="bi bi-person text-white"></i>
                    </div>
                    <div>
                        <h6 class="mb-0">${escapeHtml(client.name || '')}</h6>
                        <small class="text-muted">ID: ${client.client_id}</small>
                    </div>
                </div>
            </td>
            <td>${escapeHtml((client.contact || client.contact_person || '-') )}</td>
            <td>
                ${client.email ? `<a href="mailto:${client.email}" class="text-decoration-none">${escapeHtml(client.email)}</a>` : '-'}
            </td>
            <td>
                ${client.phone ? `<a href="tel:${client.phone}" class="text-decoration-none">${escapeHtml(client.phone)}</a>` : '-'}
            </td>
            <td>${escapeHtml(client.city || '-')}</td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editClient(${client.client_id})" title="Modifier">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="viewClient(${client.client_id})" title="Voir détails">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteClient(${client.client_id})" title="Supprimer">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Filtrer les clients côté serveur
function filterClients() {
    currentPage = 1;
    loadClients();
}

// Réinitialiser la recherche
function resetSearch() {
    document.getElementById('searchInput').value = '';
    const ids = ['cityFilter','countryFilter','hasEmailFilter','hasPhoneFilter','createdFrom','createdTo'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === 'checkbox') el.checked = false; else el.value = '';
    });
    currentPage = 1;
    loadClients(); // Recharger depuis le serveur
}

// Pagination côté client (pour compatibilité)
function updatePagination() {
    const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
    const paginationContainer = document.getElementById('pagination-container');
    
    if (!paginationContainer || totalPages <= 1) {
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = '<nav><ul class="pagination justify-content-center">';
    
    // Bouton précédent
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Précédent</a>
        </li>
    `;
    
    // Numéros de page
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    // Bouton suivant
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Suivant</a>
        </li>
    `;
    
    paginationHTML += '</ul></nav>';
    paginationContainer.innerHTML = paginationHTML;
}

// Pagination côté serveur
function updatePaginationWithServerData(totalCount) {
    const totalPages = Math.ceil((totalCount || 0) / itemsPerPage);
    const paginationContainer = document.getElementById('pagination-container');
    
    if (!paginationContainer || totalPages <= 1) {
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = '<nav><ul class="pagination justify-content-center">';
    
    // Bouton précédent
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Précédent</a>
        </li>
    `;
    
    // Numéros de page
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    // Bouton suivant
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Suivant</a>
        </li>
    `;
    
    paginationHTML += '</ul></nav>';
    paginationContainer.innerHTML = paginationHTML;
}

function changePage(page) {
    if (page >= 1) {
        currentPage = page;
        loadClients(); // Recharger depuis le serveur
    }
}

// Ouvrir le modal pour nouveau client
function openClientModal() {
    document.getElementById('clientModalTitle').innerHTML = '<i class="bi bi-person-plus me-2"></i>Nouveau Client';
    document.getElementById('clientForm').reset();
    document.getElementById('clientId').value = '';
    document.getElementById('clientCountry').value = 'Sénégal';
}

// Modifier un client
async function editClient(clientId) {
    try {
        const { data: client } = await axios.get(`/api/clients/${clientId}`);
        
        // Remplir le formulaire
        document.getElementById('clientId').value = client.client_id;
        const elContact = document.getElementById('clientContact'); if (elContact) elContact.value = client.contact || client.contact_person || '';
        document.getElementById('clientEmail').value = client.email || '';
        document.getElementById('clientPhone').value = client.phone || '';
        document.getElementById('clientAddress').value = client.address || '';
        const elCity = document.getElementById('clientCity'); if (elCity) elCity.value = client.city || '';
        const elPostal = document.getElementById('clientPostalCode'); if (elPostal) elPostal.value = client.postal_code || '';
        document.getElementById('clientCountry').value = client.country || 'Sénégal';
        const elTax = document.getElementById('clientTaxNumber'); if (elTax) elTax.value = client.tax_number || '';
        document.getElementById('clientNotes').value = client.notes || '';
        
        document.getElementById('clientModalTitle').innerHTML = '<i class="bi bi-pencil me-2"></i>Modifier Client';
        
        // Ouvrir le modal
        const modal = new bootstrap.Modal(document.getElementById('clientModal'));
        modal.show();
        
    } catch (error) {
        console.error('Erreur lors du chargement du client:', error);
        showError(error.response?.data?.detail || 'Erreur lors du chargement du client');
    }
}

// Sauvegarder un client
async function saveClient() {
    try {
        const clientId = document.getElementById('clientId').value;
        const clientData = {
            name: document.getElementById('clientName').value.trim(),
            contact: (document.getElementById('clientContact')?.value || '').trim() || null,
            email: document.getElementById('clientEmail').value.trim() || null,
            phone: document.getElementById('clientPhone').value.trim() || null,
            address: document.getElementById('clientAddress').value.trim() || null,
            city: (document.getElementById('clientCity')?.value || '').trim() || null,
            postal_code: (document.getElementById('clientPostalCode')?.value || '').trim() || null,
            country: (document.getElementById('clientCountry')?.value || 'Sénégal').trim() || 'Sénégal',
            tax_number: (document.getElementById('clientTaxNumber')?.value || '').trim() || null,
            notes: document.getElementById('clientNotes').value.trim() || null
        };

        if (!clientData.name) {
            showError('Le nom du client est obligatoire');
            return;
        }

        const url = clientId ? `/api/clients/${clientId}` : '/api/clients/';
        const method = clientId ? 'PUT' : 'POST';

        if (method === 'POST') {
            await axios.post(url, clientData);
        } else {
            await axios.put(url, clientData);
        }

        // Fermer le modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('clientModal'));
        modal.hide();

        // Recharger la liste
        await loadClients();
        
        showSuccess(clientId ? 'Client modifié avec succès' : 'Client créé avec succès');
        
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        showError(error.response?.data?.detail || error.message || 'Erreur lors de la sauvegarde du client');
    }
}

// Voir les détails d'un client
async function viewClient(clientId) {
    try {
        window.location.href = `/clients/detail?id=${clientId}`;
        
    } catch (error) {
        console.error('Erreur lors du chargement du client:', error);
        showError(error.response?.data?.detail || 'Erreur lors du chargement du client');
    }
}

// Supprimer un client
async function deleteClient(clientId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
        return;
    }

    try {
        await axios.delete(`/api/clients/${clientId}`);

        await loadClients();
        showSuccess('Client supprimé avec succès');
        
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showError(error.response?.data?.detail || error.message || 'Erreur lors de la suppression du client');
    }
}

// Afficher le loading
function showLoading() {
    // Ne pas afficher d'indicateur de chargement pour une expérience instantanée
}
