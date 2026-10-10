STATUS: done
TIME: 2026-10-10T19:20:00Z
REQUEST: Make HEVC (H.265) video work on the server while keeping high resolution.
RESULT:
Done, Owner. Both ffmpeg builds I can test, the system one and the bundled one, decode HEVC fine here, so I made the server try every build and retry tolerantly instead of dying on the first failure. Video posts now crop to 9:16 at the original resolution with no downscaling, so a 4K clip stays 4K high, and quality is raised. I proved this on a 4K 10-bit HEVC test clip, but your real mv2ro6tkb12b-defiant.mp4 sits on Railway and I could not reach it. After the redeploy, open /api/media/diag?file=mv2ro6tkb12b-defiant.mp4 on the server to see the ffmpeg build, whether it is on PATH, and whether HEVC decode works on that exact file. No APK reinstall is needed.
