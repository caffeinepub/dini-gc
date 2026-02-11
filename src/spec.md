# Specification

## Summary
**Goal:** Update the site favicon and apple-touch icon to use the user-uploaded dinosaur head image.

**Planned changes:**
- Regenerate `/assets/generated/dinigc-favicon.dim_64x64.png` from `image-3.png` while keeping the same filename/path.
- Regenerate `/assets/generated/dinigc-apple-touch-icon.dim_180x180.png` from `image-3.png` while keeping the same filename/path.
- Keep `frontend/index.html` referencing the exact existing icon asset paths.

**User-visible outcome:** The browser tab favicon and the mobile home-screen icon reflect the uploaded dinosaur head image after deployment.
