# Production Safari Showreel Smoke

Local Playwright WebKit can report `canPlayType()` support while failing to
decode any tested media source at runtime. When the automated capability probe
classifies the local engine as `webkit-media-runtime-unavailable`, production
Safari or a real iOS device is the playback authority.

Run this smoke against the deployed production URL only. Do not use autoplay
override flags, mocked media events, or test-only code.

1. Open Safari on a real iPhone or macOS Safari.
2. Hard refresh the production home page.
3. Wait for the Studio Ident to complete without tapping the page.
4. Confirm the Showreel is visible and starts automatically.
5. Confirm the video time advances for at least one second.
6. Inspect the video element and confirm:
   - `muted === true`
   - `playsInline === true`
   - `loop === true`
7. Confirm no user tap is required to start playback.
