<#
  restart-practice.ps1
  Auto-detect active private IPv4 address, update PRACTICE_HOST via
  scripts/set-practice-host.mjs, then rebuild/recreate the Docker containers.

  Usage:
    .\restart-practice.ps1
    .\restart-practice.ps1 -Port 3001
#>

param(
    [int]$Port = 3001
)

$ErrorActionPreference = "Stop"

function Write-Step($msg) {
    Write-Host ""
    Write-Host "==> $msg" -ForegroundColor Cyan
}

function Test-PrivateIPv4($ip) {
    if ($ip -match '^10\.') { return $true }
    if ($ip -match '^192\.168\.') { return $true }
    if ($ip -match '^172\.(1[6-9]|2[0-9]|3[0-1])\.') { return $true }
    return $false
}

Write-Step "Mendeteksi IP privat aktif..."

# Ambil semua IPv4 address yang statusnya "Preferred" dan bukan dari adapter virtual/loopback
$candidates = Get-NetIPAddress -AddressFamily IPv4 -AddressState Preferred |
    Where-Object {
        $_.IPAddress -ne "127.0.0.1" -and
        (Test-PrivateIPv4 $_.IPAddress) -and
        $_.InterfaceAlias -notmatch "Loopback|vEthernet|WSL|Virtual|Hyper-V"
    }

if (-not $candidates -or $candidates.Count -eq 0) {
    Write-Host "Tidak ada IP privat aktif yang terdeteksi." -ForegroundColor Red
    Write-Host "Cek koneksi jaringan kamu, atau jalankan manual:" -ForegroundColor Yellow
    Write-Host "  ipconfig"
    Write-Host "  node scripts\set-practice-host.mjs <IP> $Port"
    exit 1
}

# Kalau ada beberapa (misal WiFi + Ethernet nyala bareng), utamakan WiFi lalu Ethernet
$preferred = $candidates | Sort-Object {
    switch -Regex ($_.InterfaceAlias) {
        "Wi-?Fi"     { 0 }
        "Ethernet"   { 1 }
        default      { 2 }
    }
} | Select-Object -First 1

$ip = $preferred.IPAddress
Write-Host "IP terpilih: $ip (interface: $($preferred.InterfaceAlias))" -ForegroundColor Green

if ($candidates.Count -gt 1) {
    Write-Host ""
    Write-Host "Catatan: ada beberapa IP privat aktif terdeteksi:" -ForegroundColor Yellow
    $candidates | ForEach-Object { Write-Host "  - $($_.IPAddress)  ($($_.InterfaceAlias))" }
    Write-Host "Dipakai yang: $ip. Kalau salah, jalankan manual:" -ForegroundColor Yellow
    Write-Host "  node scripts\set-practice-host.mjs <IP-yang-benar> $Port"
}

Write-Step "Mengatur PRACTICE_HOST -> $ip : $Port"
node scripts/set-practice-host.mjs $ip $Port
if ($LASTEXITCODE -ne 0) {
    Write-Host "Gagal set-practice-host. Cek pesan error di atas." -ForegroundColor Red
    exit 1
}

Write-Step "Rebuild & recreate container Docker..."
docker compose --env-file .env.docker.local -f docker-compose.practice.yml up --build --force-recreate -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker compose gagal. Cek pesan error di atas." -ForegroundColor Red
    exit 1
}

Write-Step "Status container:"
docker compose --env-file .env.docker.local -f docker-compose.practice.yml ps

Write-Host ""
Write-Host "Selesai! Akses web di: http://$($ip):$Port" -ForegroundColor Green