STATUS: done
TIME: 2026-10-02T19:51:51Z
REQUEST: Fix HUD watch list not persisting across restarts; stop auto-adding Alpaca holdings.
RESULT:
Owner, the watch list now keeps only the tickers you add with signal_watch and holds them until you remove them. Holdings are no longer added to it, and anything you hold is hidden from it. The restart bug was a backup-restore race after Railway wiped data, and that is fixed. It goes live when Railway redeploys. No APK reinstall is needed. I could only syntax-check it, not run it live.
