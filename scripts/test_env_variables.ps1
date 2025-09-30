# Script de test des variables d'environnement Docker (Windows PowerShell)

Write-Host "🔍 Test des Variables d'Environnement Docker" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

# Vérifier que le fichier .env existe
if (!(Test-Path ".env")) {
    Write-Host "❌ Fichier .env non trouvé" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Fichier .env trouvé" -ForegroundColor Green

# Vérifier que docker-compose.yml utilise env_file
$DockerComposeContent = Get-Content "docker-compose.yml" -Raw
if ($DockerComposeContent -match "env_file:") {
    Write-Host "✅ docker-compose.yml utilise env_file" -ForegroundColor Green
} else {
    Write-Host "❌ docker-compose.yml n'utilise pas env_file" -ForegroundColor Red
}

# Tester les variables d'environnement
Write-Host ""
Write-Host "📋 Variables d'environnement dans .env:" -ForegroundColor Yellow

$EnvVars = @(
    "ENVIRONMENT",
    "SEED_DEFAULT_DATA", 
    "SEED_LARGE_TEST_DATA",
    "SEED_CLIENTS",
    "SEED_PRODUCTS",
    "HOST",
    "PORT"
)

foreach ($Var in $EnvVars) {
    $Value = (Get-Content ".env" | Where-Object { $_ -match "^$Var=" } | ForEach-Object { $_.Split("=", 2)[1] })
    if ($Value) {
        Write-Host "   $Var = $Value" -ForegroundColor Cyan
    } else {
        Write-Host "   $Var = (non défini)" -ForegroundColor Red
    }
}

# Tester avec docker-compose
Write-Host ""
Write-Host "🐳 Test avec Docker Compose:" -ForegroundColor Yellow

try {
    # Vérifier que docker-compose peut lire les variables
    $EnvTest = docker-compose config --services
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker Compose peut lire la configuration" -ForegroundColor Green
        
        # Tester une variable spécifique
        $TestResult = docker-compose config | Select-String "SEED_DEFAULT_DATA"
        if ($TestResult) {
            Write-Host "✅ Variables d'environnement chargées dans Docker" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Variables d'environnement non visibles dans la config" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Erreur avec docker-compose config" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erreur lors du test Docker: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "💡 Pour tester en temps réel:" -ForegroundColor Yellow
Write-Host "   1. Modifiez une variable dans .env" -ForegroundColor Cyan
Write-Host "   2. Redémarrez les conteneurs: docker-compose down && docker-compose up -d" -ForegroundColor Cyan
Write-Host "   3. Vérifiez les logs: docker-compose logs app" -ForegroundColor Cyan
