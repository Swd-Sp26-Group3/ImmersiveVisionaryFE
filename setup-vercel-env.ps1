# setup-vercel-env.ps1
Write-Host ""
Write-Host "=== Immersive Visionary - Vercel Env Setup ===" -ForegroundColor Cyan
Write-Host ""

# Link project
Write-Host "Linking project to Vercel..." -ForegroundColor Yellow
vercel link --yes

# Helper: set one env var using cmd /c echo piping (works in PS)
function Set-VercelEnv($name, $value) {
    # Escape value for cmd
    $safe = $value -replace '"', '\"'
    cmd /c "echo $safe | vercel env add $name production --yes" 2>&1 | Out-Null
    cmd /c "echo $safe | vercel env add $name preview --yes" 2>&1 | Out-Null
    Write-Host "OK: $name" -ForegroundColor Green
}

# Prompt inputs
Write-Host ""
$openrouterKey = Read-Host "OPENROUTER_API_KEY (openrouter.ai/keys)"

Write-Host ""
$backendUrl = Read-Host "NEXT_PUBLIC_API_URL (default: https://api.immersivevisionary.name.vn)"
if (-not $backendUrl) { $backendUrl = "https://api.immersivevisionary.name.vn" }

Write-Host ""
$productionDomain = Read-Host "Domain Vercel (vi du: https://immersive-visionary-fe.vercel.app)"
if (-not $productionDomain) { $productionDomain = "https://immersive-visionary-fe.vercel.app" }

# Generate JWT secret
$jwtSecret = node -e "const c = require('crypto'); process.stdout.write(c.randomBytes(48).toString('hex'))"
Write-Host ""
Write-Host "JWT_SECRET moi da duoc tao tu dong" -ForegroundColor Cyan

# Set vars on Vercel
Write-Host ""
Write-Host "Dang set env vars tren Vercel..." -ForegroundColor Yellow

Set-VercelEnv "OPENROUTER_API_KEY" $openrouterKey
Set-VercelEnv "JWT_SECRET"         $jwtSecret
Set-VercelEnv "NEXT_PUBLIC_API_URL" $backendUrl

$vnpUrl = "$productionDomain/marketplace/checkout/vnpay-return"
Set-VercelEnv "NEXT_PUBLIC_VNP_RETURN_URL" $vnpUrl

# Update local .env.local
Write-Host ""
Write-Host "Cap nhat .env.local voi JWT_SECRET moi..." -ForegroundColor Yellow
$envContent = Get-Content .env.local -Raw
$envContent = $envContent -replace "JWT_SECRET=.*", "JWT_SECRET=$jwtSecret"
Set-Content .env.local $envContent
Write-Host "OK: .env.local da cap nhat" -ForegroundColor Green

# Verify
Write-Host ""
Write-Host "Kiem tra cac env vars da set..." -ForegroundColor Yellow
vercel env ls

Write-Host ""
Write-Host "=== HOAN TAT ===" -ForegroundColor Green
Write-Host ""
Write-Host "Buoc tiep theo:" -ForegroundColor Yellow
Write-Host "  1. openrouter.ai/keys: REVOKE key cu, tao key moi"
Write-Host "  2. Chay script lai voi key moi: .\setup-vercel-env.ps1"
Write-Host "  3. Deploy: vercel --prod"
Write-Host "  4. Test chatbot: $productionDomain/support"
Write-Host ""
