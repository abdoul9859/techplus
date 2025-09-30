# 🚀 Guide de Rollback Rapide - Docker

## ⚡ Commandes Essentielles

### **1. Sauvegarde Immédiate**
```powershell
# Créer une sauvegarde maintenant
.\scripts\backup_database.ps1

# Avec dossier personnalisé
.\scripts\backup_database.ps1 -BackupDir ".\my_backups"
```

### **2. Rollback Rapide**
```powershell
# Interface interactive pour choisir une sauvegarde
.\scripts\quick_rollback.ps1

# Restauration directe depuis un fichier spécifique
.\scripts\restore_database.ps1 -BackupFile ".\backups\geektechnologie_db_20241201_143022.sql"
```

### **3. Configuration Automatique**
```powershell
# Configurer les sauvegardes automatiques
.\scripts\setup_auto_backup.ps1

# Nettoyer les anciennes sauvegardes
.\scripts\cleanup_old_backups.ps1
```

## 🔥 Situations d'Urgence

### **Problème immédiat - Rollback en 3 étapes**
```powershell
# 1. Arrêter l'application
docker-compose stop app

# 2. Rollback rapide
.\scripts\quick_rollback.ps1

# 3. Vérifier que tout fonctionne
docker-compose logs app
```

### **Base de données corrompue**
```powershell
# 1. Sauvegarde d'urgence (si possible)
.\scripts\backup_database.ps1

# 2. Rollback vers la dernière sauvegarde valide
.\scripts\quick_rollback.ps1
```

### **Perte complète des données**
```powershell
# 1. Arrêter tout
docker-compose down

# 2. Supprimer les volumes corrompus
docker volume rm geektechnologie_preview-main_db_data

# 3. Redémarrer et restaurer
docker-compose up -d db
.\scripts\quick_rollback.ps1
```

## 📊 Vérification Post-Rollback

### **Vérifier que tout fonctionne**
```powershell
# État des conteneurs
docker-compose ps

# Logs de l'application
docker-compose logs app

# Test de connexion à la base
docker exec -it geek_db psql -U postgres -d geektechnologie_db -c "SELECT COUNT(*) FROM users;"
```

### **Tests de fonctionnalités**
1. **Connexion** : Vérifier que l'application démarre
2. **Base de données** : Tester une requête simple
3. **Interface** : Accéder à l'application web
4. **Données** : Vérifier que les données importantes sont présentes

## 🛠️ Maintenance Préventive

### **Sauvegardes régulières**
```powershell
# Sauvegarde quotidienne (à ajouter au planificateur de tâches)
.\scripts\backup_database.ps1

# Nettoyage hebdomadaire
.\scripts\cleanup_old_backups.ps1
```

### **Surveillance**
```powershell
# Vérifier l'espace disque
docker system df

# Vérifier les volumes
docker volume ls

# Nettoyer les ressources inutilisées
docker system prune -a
```

## 🚨 Points d'Attention

### **Avant un rollback**
- ✅ **Sauvegarder l'état actuel** (même s'il est problématique)
- ✅ **Documenter le problème** rencontré
- ✅ **Tester en local** si possible

### **Pendant le rollback**
- ⚠️ **Arrêter tous les services** avant de commencer
- ⚠️ **Ne pas interrompre** le processus de restauration
- ⚠️ **Surveiller les logs** pour détecter les erreurs

### **Après le rollback**
- ✅ **Tester la connectivité** de la base de données
- ✅ **Vérifier l'intégrité** des données
- ✅ **Redémarrer l'application** et tester les fonctionnalités
- ✅ **Documenter** ce qui a été fait

## 📞 Support d'Urgence

### **Si le rollback échoue**
1. **Vérifier les logs** : `docker-compose logs db`
2. **Vérifier l'espace disque** : `docker system df`
3. **Redémarrer Docker** : `docker-compose down && docker-compose up -d`
4. **Contacter le support** avec les logs d'erreur

### **Informations à fournir**
- Version de Docker : `docker --version`
- État des conteneurs : `docker-compose ps`
- Logs d'erreur : `docker-compose logs`
- Fichiers de sauvegarde disponibles : `ls backups/`

Cette configuration vous permet de revenir à n'importe quelle version antérieure en quelques minutes ! 🚀
