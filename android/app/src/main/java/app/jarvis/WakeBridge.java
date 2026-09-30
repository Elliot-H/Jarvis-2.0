package app.jarvis;

import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.os.Handler;
import android.os.Looper;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONObject;
import org.tensorflow.lite.Interpreter;

import java.io.FileInputStream;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.util.ArrayList;

/**
 * On-device "Hey Jarvis" wake word (openWakeWord models, Apache 2.0, bundled in assets/wake). It records the mic itself with AudioRecord,
 * which takes no audio focus, so Spotify keeps playing while it listens. The page starts it only while music plays; a detection
 * opens the normal recognizer for the command.
 * Pipeline (same as openWakeWord): 1280-sample chunks -> melspectrogram (last 1760 samples, 8 frames x 32, x/10+2)
 * -> embedding (last 76 frames -> 96 floats) -> classifier (last 16 embeddings -> score 0..1).
 */
public class WakeBridge {
  private final Context ctx;
  private final WebView web;
  private final Handler ui = new Handler(Looper.getMainLooper());
  private volatile boolean on = false;
  private Thread th;
  private AudioRecord rec;

  WakeBridge(Context c, WebView w) { ctx = c; web = w; }

  @JavascriptInterface public boolean running() { return on; }
  /** threshold: score 0..1 needed to count as "Jarvis" (0.5 default). */
  @JavascriptInterface public void start(final String threshold) { ui.post(() -> begin(threshold)); }
  @JavascriptInterface public void stop() { ui.post(this::halt); }

  private MappedByteBuffer map(String name) throws Exception {
    AssetFileDescriptor fd = ctx.getAssets().openFd("wake/" + name);
    try (FileInputStream in = new FileInputStream(fd.getFileDescriptor())) {
      return in.getChannel().map(FileChannel.MapMode.READ_ONLY, fd.getStartOffset(), fd.getDeclaredLength());
    }
  }

  private void begin(String thr) {
    if (on) return;
    if (ctx.checkSelfPermission(android.Manifest.permission.RECORD_AUDIO) != android.content.pm.PackageManager.PERMISSION_GRANTED) { emit("error", "mic permission"); return; }
    float t0 = 0.5f; try { t0 = Float.parseFloat(thr); } catch (Exception ignored) {}
    final float threshold = t0 > 0.05f && t0 < 1f ? t0 : 0.5f;
    on = true;
    th = new Thread(() -> run(threshold), "wake");
    th.start();
  }

  private void run(float threshold) {
    Interpreter mel = null, emb = null, clf = null;
    try {
      Interpreter.Options o = new Interpreter.Options(); o.setNumThreads(2);
      mel = new Interpreter(map("melspectrogram.tflite"), o);
      mel.resizeInput(0, new int[]{1, 1760}); mel.allocateTensors();
      emb = new Interpreter(map("embedding_model.tflite"), o);
      clf = new Interpreter(map("hey_jarvis_v0.1.tflite"), o);

      final int rate = 16000, chunk = 1280;
      int min = AudioRecord.getMinBufferSize(rate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT);
      rec = new AudioRecord(MediaRecorder.AudioSource.MIC, rate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT, Math.max(min, chunk * 4) * 2);
      if (rec.getState() != AudioRecord.STATE_INITIALIZED) { emit("error", "mic not available"); cleanup(mel, emb, clf); return; }
      rec.startRecording();
      emit("started", "");

      short[] pcm = new short[chunk];
      float[][] rawIn = new float[1][1760];
      float[][][][] melOut = new float[1][1][8][32];
      ArrayList<float[]> frames = new ArrayList<>();
      ArrayList<float[]> feats = new ArrayList<>();
      float[][][][] embIn = new float[1][76][32][1];
      float[][][][] embOut = new float[1][1][1][96];
      float[][][] clfIn = new float[1][16][96];
      float[][] clfOut = new float[1][1];
      int chunks = 0; long lastHit = 0, lastNear = 0;

      while (on) {
        int n = 0;
        while (on && n < chunk) { int r = rec.read(pcm, n, chunk - n); if (r <= 0) { emit("error", "mic read " + r); on = false; break; } n += r; }
        if (!on) break;
        System.arraycopy(rawIn[0], chunk, rawIn[0], 0, 1760 - chunk);
        for (int i = 0; i < chunk; i++) rawIn[0][1760 - chunk + i] = pcm[i];
        mel.run(rawIn, melOut);
        for (int f = 0; f < 8; f++) { float[] fr = new float[32]; for (int k = 0; k < 32; k++) fr[k] = melOut[0][0][f][k] / 10f + 2f; frames.add(fr); }
        while (frames.size() > 120) frames.remove(0);
        chunks++;
        if (frames.size() < 76) continue;
        int base = frames.size() - 76;
        for (int f = 0; f < 76; f++) for (int k = 0; k < 32; k++) embIn[0][f][k][0] = frames.get(base + f)[k];
        emb.run(embIn, embOut);
        feats.add(embOut[0][0][0].clone());
        while (feats.size() > 16) feats.remove(0);
        if (feats.size() < 16 || chunks < 20) continue;   // let the buffers fill (about 1.6 s) before trusting scores
        for (int f = 0; f < 16; f++) System.arraycopy(feats.get(f), 0, clfIn[0][f], 0, 96);
        clf.run(clfIn, clfOut);
        float score = clfOut[0][0];
        long now = System.currentTimeMillis();
        if (score >= threshold && now - lastHit > 3000) { lastHit = now; emit("hit", String.format(java.util.Locale.US, "%.2f", score)); }
        else if (score >= 0.2f && score < threshold && now - lastNear > 1500) { lastNear = now; emit("near", String.format(java.util.Locale.US, "%.2f", score)); }
      }
    } catch (Throwable t) {
      emit("error", t.getClass().getSimpleName() + ": " + String.valueOf(t.getMessage()));
    } finally {
      cleanup(mel, emb, clf);
    }
  }

  private void cleanup(Interpreter a, Interpreter b, Interpreter c) {
    try { if (rec != null) { try { rec.stop(); } catch (Exception ignored) {} rec.release(); } } catch (Exception ignored) {}
    rec = null;
    try { if (a != null) a.close(); } catch (Exception ignored) {}
    try { if (b != null) b.close(); } catch (Exception ignored) {}
    try { if (c != null) c.close(); } catch (Exception ignored) {}
    boolean was = on; on = false;
    emit("stopped", "");
  }

  private void halt() { on = false; }

  private void emit(String type, String data) {
    final String js = "window.__wake&&window.__wake(" + JSONObject.quote(type) + "," + JSONObject.quote(data) + ")";
    ui.post(() -> web.evaluateJavascript(js, null));
  }

  void release() { halt(); }
}
