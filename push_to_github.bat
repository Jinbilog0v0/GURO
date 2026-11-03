@echo off
setlocal enabledelayedexpansion
cd /d "C:\Users\nealj\GURO"

echo =======================================================
echo Pushing GURO updates to GitHub (Jinbilog0v0/GURO)
echo =======================================================

:: Ensure user identity is 100%% your account (no AI / bot contributor)
git config user.name "JinBilog0.0"
git config user.email "nealjeanclaro05@gmail.com"

echo.
echo [1/3] Staging modified and new files...
git add backend/
git add frontend/
git add docs/GURO_Capstone_Manuscript_Updated.docx
git add docs/GURO_Capstone_Manuscript_Updated.doc
git add .gitignore
git add push_to_github.bat
git add push_to_github.ps1

echo.
echo [2/3] Creating commit with your identity...
git commit -m "feat: implement 75% passing threshold, parent attendance alerts, quiz answer visibility, parent-teacher chat, and updated capstone manuscript"

echo.
echo [3/3] Pushing to master branch on GitHub...
git push origin master

echo.
echo =======================================================
echo Successfully pushed to https://github.com/Jinbilog0v0/GURO!
echo =======================================================
pause
