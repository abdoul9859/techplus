# Script de restauration de la base de données PostgreSQL Docker (Windows PowerShell)

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$ContainerName = "geek_db",
    [string]$DatabaseName = "geektechnologie_db",
    [string]$DatabaseUser = "postgres"
)

# Vérifier que le fichier existe
if (!(Test-Path $BackupFile)) {
    Write-Host "❌ Fichier de sauvegarde non trouvé: $BackupFile" -ForegroundColor Red
    Write-Host "📁 Sauvegardes disponibles:" -ForegroundColor Yellow
    Get-ChildItem -Path ".\backups\*.sql" | ForEach-Object { Write-Host "   $($_.Name)" -ForegroundColor Cyan }
    exit 1
}

Write-Host "⚠️  ATTENTION: Cette opération va ÉCRASER la base de données actuelle!" -ForegroundColor Red
Write-Host "📁 Fichier de restauration: $BackupFile" -ForegroundColor Yellow
Write-Host "🗄️  Base de données: $DatabaseName" -ForegroundColor Yellow
Write-Host ""

$Confirm = Read-Host "Êtes-vous sûr de vouloir continuer? (oui/non)"
if ($Confirm -ne "oui") {
    Write-Host "❌ Restauration annulée" -ForegroundColor Yellow
    exit 0
}

# Vérifier que le conteneur est en cours d'exécution
$ContainerStatus = docker ps --filter "name=$ContainerName" --format "table {{.Names}}" | Select-String $ContainerName
if (!$ContainerStatus) {
    Write-Host "❌ Le conteneur $ContainerName n'est pas en cours d'exécution" -ForegroundColor Red
    exit 1
}

try {
    Write-Host "🔄 Arrêt de l'application..." -ForegroundColor Yellow
    docker-compose stop app

    Write-Host "🔄 Restauration de la base de données..." -ForegroundColor Yellow

    # Supprimer et recréer la base de données
    docker exec $ContainerName psql -U $DatabaseUser -c "DROP DATABASE IF EXISTS $DatabaseName;"
    docker exec $ContainerName psql -U $DatabaseUser -c "CREATE DATABASE $DatabaseName;"

    # Restaurer depuis le fichier de sauvegarde
    Get-Content $BackupFile | docker exec -i $ContainerName psql -U $DatabaseUser -d $DatabaseName

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Base de données restaurée avec succès" -ForegroundColor Green
        Write-Host "🚀 Redémarrage de l'application..." -ForegroundColor Yellow
        docker-compose up -d app
        Write-Host "✅ Application redémarrée" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur lors de la restauration" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erreur lors de la restauration: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
