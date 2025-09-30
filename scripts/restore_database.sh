#!/bin/bash
# Script de restauration de la base de données PostgreSQL Docker

set -e

# Configuration
DB_CONTAINER="geek_db"
DB_NAME="geektechnologie_db"
DB_USER="postgres"
BACKUP_DIR="./backups"

# Vérifier les arguments
if [ $# -eq 0 ]; then
    echo "❌ Usage: $0 <fichier_de_sauvegarde>"
    echo "📁 Sauvegardes disponibles:"
    ls -la "$BACKUP_DIR"/*.sql 2>/dev/null || echo "   Aucune sauvegarde trouvée"
    exit 1
fi

BACKUP_FILE="$1"

# Vérifier que le fichier existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Fichier de sauvegarde non trouvé: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  ATTENTION: Cette opération va ÉCRASER la base de données actuelle!"
echo "📁 Fichier de restauration: $BACKUP_FILE"
echo "🗄️  Base de données: $DB_NAME"
echo ""
read -p "Êtes-vous sûr de vouloir continuer? (oui/non): " confirm

if [ "$confirm" != "oui" ]; then
    echo "❌ Restauration annulée"
    exit 0
fi

# Vérifier que le conteneur est en cours d'exécution
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo "❌ Le conteneur $DB_CONTAINER n'est pas en cours d'exécution"
    exit 1
fi

echo "🔄 Arrêt de l'application..."
docker-compose stop app

echo "🔄 Restauration de la base de données..."

# Supprimer et recréer la base de données
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"

# Restaurer depuis le fichier de sauvegarde
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Base de données restaurée avec succès"
    echo "🚀 Redémarrage de l'application..."
    docker-compose up -d app
    echo "✅ Application redémarrée"
else
    echo "❌ Erreur lors de la restauration"
    exit 1
fi
