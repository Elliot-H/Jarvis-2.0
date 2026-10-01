STATUS: done
TIME: 2026-10-01T17:42:01Z
REQUEST: Add photo capture and analysis (camera button, voice trigger, vision model, image_analysis panel, failure handling)
RESULT:
Done, Owner. There is a new camera button next to the mic on the HUD, and saying "look at this" or "take a picture and analyze it" brings up a tap-to-open-camera button. The photo is shrunk, sent to a vision model through OpenRouter, then Jarvis speaks the answer and the key details appear in the image analysis panel. Camera, upload and model failures are spoken and saved as failures. It goes live when Railway redeploys; set VISION_MODEL in Railway only if your talk model cannot read images. I could only syntax-check it from here, not run it against the live model. The camera inside the Android app needs an APK reinstall, while the browser version works without one.
