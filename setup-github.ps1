param(
  [Parameter(Mandatory = $true)]
  [string]$RepoUrl,

  [string]$Branch = "main",
  [string]$CommitMessage = "Initial production-ready setup",
  [string]$UserName = "",
  [string]$UserEmail = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Fail($Message) {
  Write-Host "ERROR: $Message" -ForegroundColor Red
  exit 1
}

function Info($Message) {
  Write-Host "==> $Message" -ForegroundColor Cyan
}

# In PowerShell 7+, avoid converting native non-zero exit codes into terminating errors.
if (Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
  $PSNativeCommandUseErrorActionPreference = $false
}

function RunGit {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Args,
    [switch]$AllowFail,
    [switch]$Quiet
  )

  $previousErrorAction = $ErrorActionPreference
  $ErrorActionPreference = "Continue"

  try {
    if ($Quiet) {
      & git @Args 1> $null 2> $null
    } else {
      & git @Args
    }
  } finally {
    $ErrorActionPreference = $previousErrorAction
  }

  $exitCode = $LASTEXITCODE
  if (-not $AllowFail -and $exitCode -ne 0) {
    Fail ("git {0} failed with exit code {1}" -f ($Args -join " "), $exitCode)
  }

  return $exitCode
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Fail "Git is not installed or not in PATH. Install from https://git-scm.com/downloads, then reopen PowerShell."
}

if ($RepoUrl -match "<your-username>" -or $RepoUrl -match "<your-repo>") {
  Fail "RepoUrl still has placeholder text. Use your real GitHub repository URL."
}

if ($RepoUrl -notmatch "^https://github\.com/.+/.+(\.git)?$") {
  Fail "RepoUrl must look like https://github.com/<username>/<repo>.git"
}

Set-Location $PSScriptRoot

if (-not (Test-Path "package.json")) {
  Fail "package.json not found. Run this script from your project root."
}

Info "Working directory: $(Get-Location)"

if ($UserName.Trim().Length -gt 0) {
  RunGit -Args @("config", "user.name", "$UserName") | Out-Null
}
if ($UserEmail.Trim().Length -gt 0) {
  RunGit -Args @("config", "user.email", "$UserEmail") | Out-Null
}

if (-not (Test-Path ".git")) {
  Info "Initializing git repository..."
  RunGit -Args @("init") | Out-Null
}

Info "Staging files..."
RunGit -Args @("add", ".") | Out-Null

$hasHead = $true
if ((RunGit -Args @("rev-parse", "--verify", "HEAD") -AllowFail -Quiet) -ne 0) {
  $hasHead = $false
}

if (-not $hasHead) {
  Info "Creating first commit..."
  RunGit -Args @("commit", "-m", "$CommitMessage") | Out-Null
} else {
  if ((RunGit -Args @("diff", "--cached", "--quiet") -AllowFail -Quiet) -ne 0) {
    Info "Creating commit..."
    RunGit -Args @("commit", "-m", "$CommitMessage") | Out-Null
  } else {
    Info "No staged changes to commit."
  }
}

Info "Setting branch to '$Branch'..."
RunGit -Args @("branch", "-M", "$Branch") | Out-Null

$remoteExists = $true
if ((RunGit -Args @("remote", "get-url", "origin") -AllowFail -Quiet) -ne 0) {
  $remoteExists = $false
}

if ($remoteExists) {
  Info "Updating origin remote URL..."
  RunGit -Args @("remote", "set-url", "origin", "$RepoUrl") | Out-Null
} else {
  Info "Adding origin remote..."
  RunGit -Args @("remote", "add", "origin", "$RepoUrl") | Out-Null
}

Info "Pushing to GitHub..."
RunGit -Args @("push", "-u", "origin", "$Branch") | Out-Null

Write-Host ""
Write-Host "SUCCESS: Project pushed to $RepoUrl" -ForegroundColor Green
