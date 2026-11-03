Set-Location "C:\Users\nealj\GURO"
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "Pushing GURO updates to GitHub (Jinbilog0v0/GURO)" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

# Set Git Author Identity strictly to JinBilog0.0 (no AI contributor attribution)
git config user.name "JinBilog0.0"
git config user.email "nealjeanclaro05@gmail.com"

Write-Host "`n[1/3] Staging changes..." -ForegroundColor Yellow
git add backend/
git add frontend/
git add docs/GURO_Capstone_Manuscript_Updated.docx
git add docs/GURO_Capstone_Manuscript_Updated.doc
git add .gitignore
git add push_to_github.bat
git add push_to_github.ps1

Write-Host "`n[2/3] Creating commit..." -ForegroundColor Yellow
git commit -m "feat: implement 75% passing threshold, parent attendance alerts, quiz answer visibility, parent-teacher chat, and updated capstone manuscript"

Write-Host "`n[3/3] Pushing to origin master..." -ForegroundColor Yellow
git push origin master

Write-Host "`nSuccessfully pushed to https://github.com/Jinbilog0v0/GURO!" -ForegroundColor Green
