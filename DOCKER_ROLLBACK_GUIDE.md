# 🔄 Guide de Rollback de la Base de Données Docker

## 📋 Méthodes disponibles

### **1. 🗂️ Rollback via Volume Docker (Recommandé)**

#### A. Si vous avez des sauvegardes du volume
```bash
# 1. Arrêter les services
docker-compose down

# 2. Supprimer le volume actuel
docker volume rm geektechnologie_preview-main_db_data

# 3. Restaurer depuis une sauvegarde de volume
docker run --rm -v geektechnologie_preview-main_db_data:/data -v $(pwd)/backups:/backup alpine sh -c "cd /data && tar -xzf /backup/volume_backup_YYYYMMDD.tar.gz"

# 4. Redémarrer les services
docker-compose up -d
```

#### B. Si vous avez des sauvegardes SQL
```bash
# 1. Utiliser le script de restauration
chmod +x scripts/restore_database.sh
./scripts/restore_database.sh backups/geektechnologie_db_20241201_143022.sql
```

### **2. 🔄 Rollback via Git + Docker**

#### A. Rollback complet (code + base de données)
```bash
# 1. Arrêter les services
docker-compose down

# 2. Supprimer les volumes
docker volume rm geektechnologie_preview-main_db_data

# 3. Revenir à un commit antérieur
git checkout <commit-hash>

# 4. Reconstruire et redémarrer
docker-compose build --no-cache
docker-compose up -d
```

#### B. Rollback partiel (base de données seulement)
```bash
# 1. Arrêter l'application
docker-compose stop app

# 2. Restaurer la base de données
./scripts/restore_database.sh backups/geektechnologie_db_YYYYMMDD_HHMMSS.sql

# 3. Redémarrer l'application
docker-compose up -d app
```

### **3. 🐳 Rollback via Images Docker**

#### A. Utiliser une image Docker antérieure
```bash
# 1. Lister les images disponibles
docker images | grep geektechnologie

# 2. Utiliser une image spécifique
docker-compose down
docker-compose -f docker-compose.yml -f docker-compose.rollback.yml up -d
```

#### B. Créer un docker-compose.rollback.yml
```yaml
version: "3.9"
services:
  app:
    image: geektechnologie:rollback-v1.0  # Image antérieure
    container_name: geek_app_rollback
    # ... reste de la configuration
```

## 🛠️ Scripts de Sauvegarde et Restauration

### **Sauvegarde automatique**
```bash
# Rendre le script exécutable
chmod +x scripts/backup_database.sh

# Créer une sauvegarde
./scripts/backup_database.sh

# Sauvegarde programmée (crontab)
# 0 2 * * * /path/to/scripts/backup_database.sh
```

### **Restauration**
```bash
# Rendre le script exécutable
chmod +x scripts/restore_database.sh

# Lister les sauvegardes disponibles
ls -la backups/

# Restaurer depuis une sauvegarde
./scripts/restore_database.sh backups/geektechnologie_db_20241201_143022.sql
```

## 🔍 Vérification et Diagnostic

### **Vérifier l'état actuel**
```bash
# État des conteneurs
docker-compose ps

# Logs de la base de données
docker-compose logs db

# Logs de l'application
docker-compose logs app

# Connexion à la base de données
docker exec -it geek_db psql -U postgres -d geektechnologie_db
```

### **Diagnostic des problèmes**
```bash
# Vérifier les volumes Docker
docker volume ls
docker volume inspect geektechnologie_preview-main_db_data

# Vérifier l'espace disque
docker system df

# Nettoyer les ressources inutilisées
docker system prune -a
```

## ⚠️ Points d'Attention

### **Avant un rollback**
1. **Sauvegarder l'état actuel** (même s'il est problématique)
2. **Documenter les changements** qui ont causé le problème
3. **Tester en environnement de développement** si possible

### **Pendant le rollback**
1. **Arrêter tous les services** avant de commencer
2. **Vérifier les dépendances** entre les services
3. **Surveiller les logs** pendant la restauration

### **Après le rollback**
1. **Tester la connectivité** de la base de données
2. **Vérifier l'intégrité** des données
3. **Redémarrer l'application** et tester les fonctionnalités

## 🚨 Situations d'Urgence

### **Base de données corrompue**
```bash
# 1. Arrêt immédiat
docker-compose down

# 2. Sauvegarde d'urgence (si possible)
docker exec geek_db pg_dump -U postgres geektechnologie_db > emergency_backup.sql

# 3. Restauration depuis la dernière sauvegarde valide
./scripts/restore_database.sh backups/geektechnologie_db_LAST_GOOD.sql
```

### **Perte complète des données**
```bash
# 1. Arrêter tout
docker-compose down

# 2. Supprimer les volumes corrompus
docker volume rm geektechnologie_preview-main_db_data

# 3. Restaurer depuis la sauvegarde la plus récente
./scripts/restore_database.sh backups/geektechnologie_db_YYYYMMDD_HHMMSS.sql
```

## 📅 Planification des Sauvegardes

### **Sauvegardes automatiques**
```bash
# Ajouter au crontab
0 2 * * * /path/to/scripts/backup_database.sh
0 14 * * * /path/to/scripts/backup_database.sh

# Nettoyage des anciennes sauvegardes (garder 7 jours)
0 3 * * * find /path/to/backups -name "*.sql" -mtime +7 -delete
```

### **Rotation des sauvegardes**
- **Quotidiennes** : Garder 7 jours
- **Hebdomadaires** : Garder 4 semaines  
- **Mensuelles** : Garder 12 mois

## 🔧 Configuration Recommandée

### **Variables d'environnement pour le rollback**
```bash
# .env.rollback
ENVIRONMENT=production
FORCE_INIT=false
FORCE_MIGRATE=false
FORCE_SEED=false
BACKUP_RETENTION_DAYS=7
```

### **Docker Compose pour rollback**
```yaml
# docker-compose.rollback.yml
version: "3.9"
services:
  db:
    image: postgres:15-alpine
    volumes:
      - db_data_rollback:/var/lib/postgresql/data
      - ./backups:/backups
```

Cette configuration vous permet de revenir à n'importe quelle version antérieure de votre base de données en toute sécurité !
