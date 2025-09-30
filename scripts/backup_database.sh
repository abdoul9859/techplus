#!/bin/bash
# Script de sauvegarde de la base de données PostgreSQL Docker

set -e

# Configuration
DB_CONTAINER="geek_db"
DB_NAME="geektechnologie_db"
DB_USER="postgres"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/geektechnologie_db_${TIMESTAMP}.sql"

# Créer le dossier de sauvegarde
mkdir -p "$BACKUP_DIR"

echo "🔄 Sauvegarde de la base de données..."

# Vérifier que le conteneur est en cours d'exécution
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo "❌ Le conteneur $DB_CONTAINER n'est pas en cours d'exécution"
    exit 1
fi

# Créer la sauvegarde
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Sauvegarde créée: $BACKUP_FILE"
    echo "📊 Taille: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo "❌ Erreur lors de la sauvegarde"
    exit 1
fi
