# Script de rollback rapide pour la base de données Docker (Windows PowerShell)

param(
    [string]$BackupDir = ".\backups",
    [string]$ContainerName = "geek_db"
)

Write-Host "🔄 Rollback Rapide - Base de Données Docker" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

# Lister les sauvegardes disponibles
$Backups = Get-ChildItem -Path $BackupDir -Filter "*.sql" | Sort-Object LastWriteTime -Descending

if ($Backups.Count -eq 0) {
    Write-Host "❌ Aucune sauvegarde trouvée dans $BackupDir" -ForegroundColor Red
    Write-Host "💡 Créez d'abord une sauvegarde avec: .\scripts\backup_database.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "📁 Sauvegardes disponibles:" -ForegroundColor Yellow
for ($i = 0; $i -lt $Backups.Count; $i++) {
    $Backup = $Backups[$i]
    $Size = [math]::Round($Backup.Length / 1MB, 2)
    $Date = $Backup.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
    Write-Host "   [$i] $($Backup.Name) ($Size MB) - $Date" -ForegroundColor Cyan
}

Write-Host ""
$Choice = Read-Host "Choisissez une sauvegarde à restaurer (numéro)"

try {
    $Index = [int]$Choice
    if ($Index -lt 0 -or $Index -ge $Backups.Count) {
        Write-Host "❌ Choix invalide" -ForegroundColor Red
        exit 1
    }
    
    $SelectedBackup = $Backups[$Index].FullName
    Write-Host "🔄 Restauration de: $($Backups[$Index].Name)" -ForegroundColor Yellow
    
    # Appeler le script de restauration
    & ".\scripts\restore_database.ps1" -BackupFile $SelectedBackup
    
} catch {
    Write-Host "❌ Erreur lors du rollback: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
