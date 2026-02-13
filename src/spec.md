# Specification

## Summary
**Goal:** Deploy a new draft build that matches the Version 35 baseline Join + Chat flows end-to-end, while making Light mode the default and adding a Light/Dark toggle inside the existing Settings (Edit Profile) dialog after entering chat.

**Planned changes:**
- Restore/ensure Version 35 baseline UI and behavior across the Join flow and Chat flow with no layout or feature changes.
- Make the app load in Light mode by default on fresh load, regardless of OS/system theme.
- Add a Light/Dark theme toggle inside the existing Settings (Edit Profile) dialog accessible from the Chat header (only after entering chat).
- Persist the user’s theme preference in localStorage; if localStorage is cleared, default back to Light mode on next load.

**User-visible outcome:** Users see the app in Light mode by default, and after entering chat can open Settings (Edit Profile) to toggle between Light and Dark themes, with their choice saved across reloads.
