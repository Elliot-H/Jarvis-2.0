package app.jarvis;

import android.content.Intent;
import android.speech.RecognitionService;
import android.speech.SpeechRecognizer;

/** Required by Android for an assistant app. It does nothing: real listening uses Google's recognizer (see SttBridge). */
public class JarvisRecognitionService extends RecognitionService {
  @Override protected void onStartListening(Intent intent, Callback cb) { try { cb.error(SpeechRecognizer.ERROR_CLIENT); } catch (Exception ignored) {} }
  @Override protected void onCancel(Callback cb) {}
  @Override protected void onStopListening(Callback cb) {}
}
