# OHOS NDK env for this machine (DevEco Studio bundled SDK)
# Usage: . .\ohos\scripts\env.ps1

$ErrorActionPreference = "Stop"

if (-not $env:OHOS_SDK_NATIVE) {
    $env:OHOS_SDK_NATIVE = "D:\dev_software\DevEco Studio\sdk\default\openharmony\native"
}
if (-not (Test-Path $env:OHOS_SDK_NATIVE)) {
    throw "OHOS_SDK_NATIVE not found: $($env:OHOS_SDK_NATIVE)"
}

$HdcDir = "D:\dev_software\DevEco Studio\sdk\default\openharmony\toolchains"
$LlvmBin = Join-Path $env:OHOS_SDK_NATIVE "llvm\bin"
$env:OHOS_NDK_CC = Join-Path $LlvmBin "clang++.exe"
$env:PATH = "$HdcDir;$LlvmBin;" + $env:PATH

Write-Host "OHOS_SDK_NATIVE=$($env:OHOS_SDK_NATIVE)"
Write-Host "OHOS_NDK_CC=$($env:OHOS_NDK_CC)"
Write-Host "hdc=$(Get-Command hdc -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source)"
& (Join-Path $LlvmBin "clang++.exe") --version | Select-Object -First 2
