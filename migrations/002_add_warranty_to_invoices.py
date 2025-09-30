"""
Migration: Ajout des champs de garantie aux factures
"""

from sqlalchemy import text

def upgrade(connection):
    """Ajouter les champs de garantie à la table invoices"""
    
    # Ajouter les champs de garantie
    connection.execute(text("""
        ALTER TABLE invoices 
        ADD COLUMN has_warranty BOOLEAN DEFAULT FALSE,
        ADD COLUMN warranty_duration INTEGER DEFAULT NULL,
        ADD COLUMN warranty_start_date DATE DEFAULT NULL,
        ADD COLUMN warranty_end_date DATE DEFAULT NULL
    """))
    
    print("✅ Champs de garantie ajoutés à la table invoices")

def downgrade(connection):
    """Supprimer les champs de garantie de la table invoices"""
    
    connection.execute(text("""
        ALTER TABLE invoices 
        DROP COLUMN IF EXISTS has_warranty,
        DROP COLUMN IF EXISTS warranty_duration,
        DROP COLUMN IF EXISTS warranty_start_date,
        DROP COLUMN IF EXISTS warranty_end_date
    """))
    
    print("✅ Champs de garantie supprimés de la table invoices")

# Métadonnées de la migration
MIGRATION_NAME = "002_add_warranty_to_invoices"
MIGRATION_DESCRIPTION = "Ajout des champs de garantie aux factures"