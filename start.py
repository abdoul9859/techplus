#!/usr/bin/env python3
"""
Script de démarrage pour l'application TechPlus
"""

import uvicorn
import os
import sys
import time
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

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

def ensure_database_exists():
    """Créer la base PostgreSQL cible si elle n'existe pas.

    Se connecte à la base 'postgres' avec les mêmes identifiants puis exécute
    CREATE DATABASE si nécessaire.
    """
    try:
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            # Pas de configuration DB: rien à faire ici
            return True

        url = make_url(db_url)
        # Ne traiter que PostgreSQL
        if not str(url.drivername).startswith("postgresql"):
            return True

        target_db = url.database
        if not target_db:
            return True

        admin_url = url.set(database="postgres")
        engine_admin = create_engine(str(admin_url))
        try:
            with engine_admin.connect() as conn:
                exists = conn.execute(
                    text("SELECT 1 FROM pg_database WHERE datname = :dbname"),
                    {"dbname": target_db},
                ).scalar() is not None
                if not exists:
                    # Quoter le nom pour gérer d'éventuels caractères spéciaux
                    conn.execution_options(isolation_level="AUTOCOMMIT").execute(
                        text(f'CREATE DATABASE "{target_db}"')
                    )
                    print(f"✅ Base de données créée: {target_db}")
                else:
                    print(f"ℹ️ Base de données déjà présente: {target_db}")
        finally:
            try:
                engine_admin.dispose()
            except Exception:
                pass
        return True
    except Exception as e:
        print(f"⚠️ Impossible de vérifier/créer la base: {e}")
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
    print("🚀 Démarrage de TechPlus - Gestion de Stock")
    print("=" * 50)
    
    # Créer la base de données si elle n'existe pas (ex: volume Postgres déjà initialisé)
    ensure_database_exists()

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
