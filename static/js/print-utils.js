/**
 * Utilitaires d'impression pour LOUCAR BUSINESS PRO
 * Permet d'imprimer directement sans ouvrir de nouvelle page permanente
 */

/**
 * Imprime un document en ouvrant une popup temporaire
 * @param {string} url - L'URL du document à imprimer
 * @param {string} windowName - Le nom de la fenêtre (optionnel)
 */
function printDocument(url, windowName = 'printWindow') {
    // Ouvrir une nouvelle fenêtre popup pour l'impression
    const ts = Date.now();
    const sep = url.includes('?') ? '&' : '?';
    const printWindow = window.open(`${url}${sep}v=${ts}`, windowName, 
        'width=800,height=600,scrollbars=yes,resizable=yes');
    
    if (printWindow) {
        // Attendre que la fenêtre se charge et se fermer automatiquement après impression
        printWindow.addEventListener('afterprint', function() {
            printWindow.close();
        });
        
        // Fallback si addEventListener n'est pas supporté
        printWindow.onafterprint = function() {
            printWindow.close();
        };
        
        // Focus sur la nouvelle fenêtre pour que l'impression soit visible
        printWindow.focus();
    } else {
        alert('Veuillez autoriser les popups pour imprimer directement.');
    }
}

/**
 * Imprime un devis
 * @param {number} quoteId - L'ID du devis
 */
function printQuote(quoteId) {
    printDocument(`/quotes/${quoteId}/print`, 'printQuote');
}

/**
 * Imprime une facture
 * @param {number} invoiceId - L'ID de la facture
 */
function printInvoice(invoiceId) {
    // Rediriger vers la page d'impression dans la même fenêtre
    window.location.href = `/invoices/${invoiceId}/print`;
}

/**
 * Imprime un bon de commande
 * @param {number} orderId - L'ID du bon de commande
 */
function printPurchaseOrder(orderId) {
    printDocument(`/purchase-orders/${orderId}/print`, 'printPurchaseOrder');
}

/**
 * Imprime un reçu de maintenance
 * @param {number} maintenanceId - L'ID de la maintenance
 */
function printMaintenanceRecord(maintenanceId) {
    printDocument(`/maintenance/${maintenanceId}/print`, 'printMaintenance');
}

/**
 * Imprime un bon de livraison directement
 * @param {number} deliveryNoteId - L'ID du bon de livraison
 */
function printDeliveryNote(deliveryNoteId) {
    // Afficher un indicateur de chargement
    const loadingToast = showLoadingToast('Préparation de l\'impression...');
    
    // Créer une iframe cachée pour charger le contenu à imprimer
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);
    
    // Charger le contenu de la page d'impression dans l'iframe
    iframe.onload = function() {
        try {
            // Cacher l'indicateur de chargement
            hideLoadingToast(loadingToast);
            
            // Attendre un peu que le contenu se charge complètement
            setTimeout(() => {
                try {
                    // Déclencher l'impression de l'iframe
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                    
                    // Supprimer l'iframe après impression
                    setTimeout(() => {
                        if (document.body.contains(iframe)) {
                            document.body.removeChild(iframe);
                        }
                    }, 2000);
                } catch (printError) {
                    console.error('Erreur lors de l\'impression de l\'iframe:', printError);
                    // Fallback: ouvrir dans un popup temporaire
                    fallbackPrint(deliveryNoteId, iframe);
                }
            }, 800);
        } catch (e) {
            console.error('Erreur lors du chargement:', e);
            hideLoadingToast(loadingToast);
            fallbackPrint(deliveryNoteId, iframe);
        }
    };
    
    // En cas d'erreur de chargement
    iframe.onerror = function() {
        console.error('Erreur de chargement de la page d\'impression');
        hideLoadingToast(loadingToast);
        fallbackPrint(deliveryNoteId, iframe);
    };
    
    // Timeout au cas où le chargement prend trop de temps
    setTimeout(() => {
        if (loadingToast) {
            hideLoadingToast(loadingToast);
            console.warn('Timeout du chargement de l\'impression');
            fallbackPrint(deliveryNoteId, iframe);
        }
    }, 10000);
    
    // Charger la page d'impression
    iframe.src = `/delivery-notes/${deliveryNoteId}/print`;
}

/**
 * Méthode de fallback pour l'impression
 */
function fallbackPrint(deliveryNoteId, iframe) {
    // Supprimer l'iframe défaillante
    if (iframe && document.body.contains(iframe)) {
        document.body.removeChild(iframe);
    }
    
    // Ouvrir dans un popup temporaire
    const printWindow = window.open(
        `/delivery-notes/${deliveryNoteId}/print`, 
        'printDeliveryNote',
        'width=800,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,status=no'
    );
    
    if (printWindow) {
        // Se fermer automatiquement après impression
        printWindow.addEventListener('afterprint', function() {
            printWindow.close();
        });
        
        // Fallback si addEventListener ne fonctionne pas
        printWindow.onafterprint = function() {
            printWindow.close();
        };
        
        // Fermer automatiquement après 30 secondes en cas de problème
        setTimeout(() => {
            if (printWindow && !printWindow.closed) {
                printWindow.close();
            }
        }, 30000);
    } else {
        alert('Impossible d\'ouvrir la fenêtre d\'impression. Veuillez autoriser les popups.');
    }
}

/**
 * Affiche un toast de chargement
 */
function showLoadingToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #007bff;
        color: white;
        padding: 12px 20px;
        border-radius: 5px;
        z-index: 9999;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        font-family: Arial, sans-serif;
        font-size: 14px;
    `;
    toast.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
    document.body.appendChild(toast);
    return toast;
}

/**
 * Cache un toast de chargement
 */
function hideLoadingToast(toast) {
    if (toast && document.body.contains(toast)) {
        document.body.removeChild(toast);
    }
} 