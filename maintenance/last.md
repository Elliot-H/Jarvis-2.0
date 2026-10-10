STATUS: needs-owner
TIME: 2026-10-10T19:30:00Z
REQUEST: Make HEVC video processing work live at full resolution, prove it on mv2rzvela196-defiant.mp4, fix vision timeouts.
RESULT:
Owner, I could not prove it live, because this maintenance runner cannot reach your Railway server or the uploaded clip. The HEVC fix is already on main: the server tries every ffmpeg build, HEVC-capable first, retries tolerantly, and crops 9:16 at source resolution with no downscaling. I fixed the photo timeouts: the vision call now gives up after 40 seconds and retries once on a fallback model. To see the proof yourself after the redeploy, open /api/media/diag?file=mv2rzvela196-defiant.mp4&prepare=1 on the server. It shows the ffmpeg builds, HEVC decode, a real frame grab, and a full 9:16 crop with headline and music. If it still says HEVC fails, tell me and I will switch the build to a different ffmpeg package. No APK reinstall is needed.
