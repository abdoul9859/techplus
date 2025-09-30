# Script de sauvegarde de la base de données PostgreSQL Docker (Windows PowerShell)

param(
    [string]$BackupDir = ".\backups",
    [string]$ContainerName = "geek_db",
    [string]$DatabaseName = "geektechnologie_db",
    [string]$DatabaseUser = "postgres"
)

# Créer le dossier de sauvegarde s'il n'existe pas
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force
    Write-Host "📁 Dossier de sauvegarde créé: $BackupDir" -ForegroundColor Green
}

# Générer le nom de fichier avec timestamp
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "geektechnologie_db_$Timestamp.sql"

Write-Host "🔄 Sauvegarde de la base de données..." -ForegroundColor Yellow

# Vérifier que le conteneur est en cours d'exécution
$ContainerStatus = docker ps --filter "name=$ContainerName" --format "table {{.Names}}" | Select-String $ContainerName
if (!$ContainerStatus) {
    Write-Host "❌ Le conteneur $ContainerName n'est pas en cours d'exécution" -ForegroundColor Red
    exit 1
}

try {
    # Créer la sauvegarde
    docker exec $ContainerName pg_dump -U $DatabaseUser -d $DatabaseName | Out-File -FilePath $BackupFile -Encoding UTF8
    
    if (Test-Path $BackupFile) {
        $FileSize = (Get-Item $BackupFile).Length
        $FileSizeMB = [math]::Round($FileSize / 1MB, 2)
        Write-Host "✅ Sauvegarde créée: $BackupFile" -ForegroundColor Green
        Write-Host "📊 Taille: $FileSizeMB MB" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Erreur lors de la création de la sauvegarde" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erreur lors de la sauvegarde: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
