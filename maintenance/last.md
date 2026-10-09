STATUS: done
TIME: 2026-10-09T19:17:15Z
REQUEST: Fix media_prepare: upgrade runtime to a Node version that supports sharp
RESULT:
Owner, the cause was that sharp needs Node 20.9 or newer, but the server was building on Node 18.
I pinned the build to Node 22 in package.json and nixpacks.toml, so sharp now installs and photo crop, colour lift and headline banner can run. Video prep uses ffmpeg, which was already in the build.
It goes live on the next Railway build after this push, no APK reinstall. I could not run a photo through it here, so please try the tint photo once the deploy finishes.
