"""
Migration 003: Ajouter des index pour optimiser les performances des requêtes produits

Cette migration ajoute des index stratégiques sur les colonnes fréquemment utilisées
dans les filtres et les jointures pour améliorer significativement les performances.
"""

from sqlalchemy import text

def upgrade(connection):
    """Ajouter les index pour optimiser les requêtes produits"""
    
    # Index sur products
    indexes = [
        # Index pour les filtres de recherche
        "CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)",
        "CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand)",
        "CREATE INDEX IF NOT EXISTS idx_products_model ON products(model)",
        "CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)",
        "CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)",
        "CREATE INDEX IF NOT EXISTS idx_products_condition ON products(condition)",
        
        # Index pour les filtres numériques
        "CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)",
        "CREATE INDEX IF NOT EXISTS idx_products_quantity ON products(quantity)",
        
        # Index pour le tri par date
        "CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at)",
        "CREATE INDEX IF NOT EXISTS idx_products_entry_date ON products(entry_date)",
        
        # Index composites pour les requêtes courantes
        "CREATE INDEX IF NOT EXISTS idx_products_category_quantity ON products(category, quantity)",
        
        # Index sur product_variants
        "CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id)",
        "CREATE INDEX IF NOT EXISTS idx_variants_is_sold ON product_variants(is_sold)",
        "CREATE INDEX IF NOT EXISTS idx_variants_barcode ON product_variants(barcode)",
        "CREATE INDEX IF NOT EXISTS idx_variants_imei_serial ON product_variants(imei_serial)",
        "CREATE INDEX IF NOT EXISTS idx_variants_condition ON product_variants(condition)",
        
        # Index composites pour les variantes
        "CREATE INDEX IF NOT EXISTS idx_variants_product_sold ON product_variants(product_id, is_sold)",
        "CREATE INDEX IF NOT EXISTS idx_variants_product_condition ON product_variants(product_id, condition)",
        "CREATE INDEX IF NOT EXISTS idx_variants_product_sold_condition ON product_variants(product_id, is_sold, condition)",
    ]
    
    # Commencer une nouvelle transaction propre
    try:
        connection.execute(text("COMMIT"))  # Finir toute transaction en cours
    except:
        pass
    
    # Créer les index individuellement avec gestion d'erreur
    for index_sql in indexes:
        try:
            connection.execute(text("BEGIN"))
            connection.execute(text(index_sql))
            connection.execute(text("COMMIT"))
            print(f"✓ Index créé: {index_sql.split('idx_')[1].split(' ON')[0] if 'idx_' in index_sql else 'index'}")
        except Exception as e:
            # Rollback de cette transaction spécifique et continuer
            try:
                connection.execute(text("ROLLBACK"))
            except:
                pass
            print(f"⚠ Index ignoré (existe ou erreur): {index_sql.split('idx_')[1].split(' ON')[0] if 'idx_' in index_sql else 'index'}")

def downgrade(connection):
    """Supprimer les index créés (optionnel pour rollback)"""
    
    indexes_to_drop = [
        "idx_products_name",
        "idx_products_brand",
        "idx_products_model",
        "idx_products_category",
        "idx_products_barcode",
        "idx_products_condition",
        "idx_products_price",
        "idx_products_quantity",
        "idx_products_created_at",
        "idx_products_entry_date",
        "idx_products_category_quantity",
        "idx_variants_product_id",
        "idx_variants_is_sold",
        "idx_variants_barcode",
        "idx_variants_imei_serial",
        "idx_variants_condition",
        "idx_variants_product_sold",
        "idx_variants_product_condition",
        "idx_variants_product_sold_condition",
    ]
    
    for idx_name in indexes_to_drop:
        try:
            connection.execute(text(f"DROP INDEX IF EXISTS {idx_name}"))
            print(f"✓ Index supprimé: {idx_name}")
        except Exception as e:
            print(f"⚠ Erreur lors de la suppression de {idx_name}: {str(e)[:50]}")
    
    connection.commit()