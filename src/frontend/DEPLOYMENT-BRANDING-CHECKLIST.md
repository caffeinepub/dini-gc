# Dini GC - Deployment Branding Checklist

This checklist ensures Version 33 and future deployments maintain correct branding.

## Pre-Deployment Verification

### 1. HTML Document Title
- [ ] `frontend/index.html` contains `<title>Dini GC</title>`
- [ ] No other title tags present in the document

### 2. Favicon Configuration
- [ ] Favicon link tag present: `<link rel='icon' type='image/png' href='/assets/generated/dinigc-favicon.dim_64x64.png' />`
- [ ] Favicon asset exists at: `frontend/public/assets/generated/dinigc-favicon.dim_64x64.png`
- [ ] Favicon displays correctly in browser tab during local testing

### 3. Apple Touch Icon Configuration
- [ ] Apple touch icon link tag present: `<link rel='apple-touch-icon' href='/assets/generated/dinigc-apple-touch-icon.dim_180x180.png' />`
- [ ] Apple touch icon asset exists at: `frontend/public/assets/generated/dinigc-apple-touch-icon.dim_180x180.png`

### 4. Asset File Verification
Run the verification script before deploying:
