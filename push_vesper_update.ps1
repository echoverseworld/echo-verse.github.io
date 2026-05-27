# Push Vesper Profile Update to GitHub Pages
Set-Location "D:\01_Echo_Verse\92_Website"

Write-Host "=== Git Status ===" -ForegroundColor Cyan
git status

Write-Host "`n=== Adding + Committing ===" -ForegroundColor Cyan
git add assets/characters/vesper_profile_web.png
git commit -m "Update Vesper profile to new MJ V7 design"

Write-Host "`n=== Pushing to origin/main ===" -ForegroundColor Cyan
git push origin main

Write-Host "`n=== Done! Website should update in ~1 min ===" -ForegroundColor Green
