# Specification

## Summary
**Goal:** Add a custom favicon so an image appears next to the website name in the browser tab.

**Planned changes:**
- Add favicon image assets under `frontend/public/assets/generated/` so they are included in the frontend build output.
- Update `frontend/index.html` to reference the favicon assets via appropriate `<link rel="icon" ...>` tag(s), and include an Apple touch icon link for mobile bookmarks.

**User-visible outcome:** The site displays a custom icon in the browser tab (and a proper icon when bookmarked on mobile) without any backend changes.
