STATUS: done
TIME: 2026-10-10T18:58:03Z
REQUEST: Install ffmpeg on the server so video posts work (media_prepare, media_describe).
RESULT:
Done, sir. I could not touch the Railway machine directly, so I fixed it in the code. Railway most likely ignored the old ffmpeg setting, so I added the newer one and also bundled ffmpeg into the app as a backup. I tested a frame grab and a 9:16 crop with headline, with and without music, on a sample mp4 with no system ffmpeg, and all worked. Your own mv2r79ozf2fb-defiant.mp4 lives on the server, so I could not test that exact file. It goes live after the Railway redeploy, and no APK reinstall is needed.
