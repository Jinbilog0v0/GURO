# GURO Mobile APK Downloads

Place the compiled release/preview Android APK file here:
`frontend/Guro-Web/public/downloads/GURO.apk`

When deployed or served via Vite (`npm run dev` or `npm run build`), any file placed in this folder is publicly downloadable from the landing page button at:
`/downloads/GURO.apk`

### To build the latest standalone APK with EAS:
```bash
cd frontend/Guro-Mobile
eas build --platform android --profile preview
```
Once the EAS build completes, download the generated `.apk` and place it here as `GURO.apk`.
