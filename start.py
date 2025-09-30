#!/usr/bin/env python3
"""
Script de démarrage pour l'application GEEK TECHNOLOGIE
"""

import uvicorn
import os
import sys
import time
from pathlib import Path

# Ajouter le répertoire racine au PYTHONPATH
root_dir = Path(__file__).parent
sys.path.insert(0, str(root_dir))

def wait_for_database():
    """Attendre que la base de données soit prête"""
    print("⏳ Attente de la base de données...")
    
    try:
        from app.database import engine
        from sqlalchemy import text
        
        max_attempts = 30
        attempt = 0
        
        while attempt < max_attempts:
            try:
                with engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
                print("✅ Base de données connectée")
                return True
            except Exception as e:
                attempt += 1
                print(f"⏳ Tentative {attempt}/{max_attempts} - Base de données non prête: {e}")
                time.sleep(2)
        
        print("❌ Impossible de se connecter à la base de données après 30 tentatives")
        return False
        
    except Exception as e:
        print(f"❌ Erreur lors de la vérification de la base de données: {e}")
        return False

def create_tables():
    """Créer les tables de base de données"""
    print("🔄 Création des tables de base de données...")
    
    try:
        from app.database import create_tables as create_tables_func
        create_tables_func()
        print("✅ Tables créées avec succès")
        return True
    except Exception as e:
        print(f"❌ Erreur lors de la création des tables: {e}")
        return False

def run_migrations():
    """Exécuter les migrations"""
    print("🔄 Exécution des migrations...")
    
    try:
        from migrations.migration_manager import run_migrations as run_migrations_func
        
        if not run_migrations_func():
            print("❌ Échec des migrations")
            return False
        else:
            print("✅ Migrations exécutées avec succès")
            return True
            
    except Exception as e:
        print(f"❌ Erreur lors de l'exécution des migrations: {e}")
        return False

def main():
    """Démarrer l'application FastAPI"""
    print("🚀 Démarrage de GEEK TECHNOLOGIE - Gestion de Stock")
    print("=" * 50)
    
    # Attendre la base de données
    if not wait_for_database():
        print("❌ Impossible de démarrer sans base de données")
        sys.exit(1)
    
    # Créer les tables de base
    if not create_tables():
        print("❌ Impossible de démarrer sans tables")
        sys.exit(1)
    
    # Exécuter les migrations
    if not run_migrations():
        print("❌ Impossible de démarrer sans migrations")
        sys.exit(1)
    
    # Configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    # Désactiver le reload par défaut en production (Koyeb)
    reload = os.getenv("RELOAD", "false").lower() == "true"
    
    print(f"📍 Serveur: http://{host}:{port}")
    print(f"🔄 Rechargement automatique: {'Activé' if reload else 'Désactivé'}")
    print(f"🗄️  Base de données: PostgreSQL")
    print("=" * 50)
    print("💡 Comptes par défaut:")
    print("   - Admin: admin / admin")
    print("   - Utilisateur: user / user")
    print("=" * 50)
    
    try:
        uvicorn.run(
            "main:app",
            host=host,
            port=port,
            reload=reload,
            log_level="info",
            access_log=True
        )
    except KeyboardInterrupt:
        print("\n👋 Arrêt de l'application")
    except Exception as e:
        print(f"❌ Erreur lors du démarrage: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
