# Script de configuration des sauvegardes automatiques (Windows PowerShell)

param(
    [string]$BackupDir = ".\backups",
    [int]$RetentionDays = 7
)

Write-Host "🔧 Configuration des Sauvegardes Automatiques" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

# Créer le dossier de sauvegarde
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force
    Write-Host "📁 Dossier de sauvegarde créé: $BackupDir" -ForegroundColor Green
}

# Créer une tâche planifiée pour les sauvegardes
$TaskName = "GeekTechnologie_DatabaseBackup"
$ScriptPath = (Get-Location).Path + "\scripts\backup_database.ps1"

Write-Host "🔄 Configuration de la tâche planifiée..." -ForegroundColor Yellow

try {
    # Supprimer la tâche existante si elle existe
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    
    # Créer une nouvelle tâche planifiée
    $Action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File `"$ScriptPath`""
    $Trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM
    $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Sauvegarde automatique de la base de données GeekTechnologie"
    
    Write-Host "✅ Tâche planifiée créée: $TaskName" -ForegroundColor Green
    Write-Host "⏰ Sauvegarde programmée: Tous les jours à 2h00" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Erreur lors de la création de la tâche planifiée: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Exécutez PowerShell en tant qu'administrateur" -ForegroundColor Yellow
}

# Créer un script de nettoyage des anciennes sauvegardes
$CleanupScript = @"
# Nettoyage automatique des anciennes sauvegardes
`$BackupDir = ".\backups"
`$RetentionDays = $RetentionDays

`$OldBackups = Get-ChildItem -Path `$BackupDir -Filter "*.sql" | Where-Object { `$_.LastWriteTime -lt (Get-Date).AddDays(-`$RetentionDays) }

if (`$OldBackups.Count -gt 0) {
    Write-Host "🗑️ Suppression de `$(`$OldBackups.Count) anciennes sauvegardes..." -ForegroundColor Yellow
    `$OldBackups | Remove-Item -Force
    Write-Host "✅ Nettoyage terminé" -ForegroundColor Green
} else {
    Write-Host "ℹ️ Aucune ancienne sauvegarde à supprimer" -ForegroundColor Cyan
}
"@

$CleanupScript | Out-File -FilePath ".\scripts\cleanup_old_backups.ps1" -Encoding UTF8

Write-Host ""
Write-Host "📋 Configuration terminée!" -ForegroundColor Green
Write-Host "💡 Commandes utiles:" -ForegroundColor Yellow
Write-Host "   - Sauvegarde manuelle: .\scripts\backup_database.ps1" -ForegroundColor Cyan
Write-Host "   - Rollback rapide: .\scripts\quick_rollback.ps1" -ForegroundColor Cyan
Write-Host "   - Nettoyage: .\scripts\cleanup_old_backups.ps1" -ForegroundColor Cyan
Write-Host "   - Voir les tâches: Get-ScheduledTask -TaskName $TaskName" -ForegroundColor Cyan
