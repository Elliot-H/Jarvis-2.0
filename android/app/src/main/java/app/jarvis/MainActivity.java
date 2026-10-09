package app.jarvis;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.ValueCallback;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import java.io.InputStream;
import java.util.Collections;

/** Jarvis: the HUD web app in a full-screen WebView, with a native speech engine plugged in and lock-screen launch. */
public class MainActivity extends Activity {
  private WebView web;
  private SttBridge stt;
  private String shim = "";
  private final Handler ui = new Handler(Looper.getMainLooper());
  private static final int REQ = 7;
  private static final int PICK = 8;
  private ValueCallback<Uri[]> picker;

  @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
  @Override protected void onCreate(Bundle b) {
    super.onCreate(b);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    // Draw edge to edge on black so the HUD looks like a native screen.
    getWindow().setStatusBarColor(0xFF03090D);
    getWindow().setNavigationBarColor(0xFF03090D);

    try (InputStream in = getAssets().open("stt-shim.js")) {
      java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
      byte[] buf = new byte[4096]; int n;
      while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
      shim = out.toString("UTF-8");
    } catch (Exception e) { shim = ""; }

    web = new WebView(this);
    setContentView(web);
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setGeolocationEnabled(true);
    s.setUserAgentString(s.getUserAgentString() + " JarvisApp/1");
    CookieManager.getInstance().setAcceptCookie(true);
    CookieManager.getInstance().setAcceptThirdPartyCookies(web, true);

    stt = new SttBridge(this, web);
    web.addJavascriptInterface(stt, "AndroidSTT");
    web.addJavascriptInterface(new DeviceBridge(this, web), "AndroidDevice");
    web.addJavascriptInterface(new WakeBridge(this, web), "AndroidWake");
    web.addJavascriptInterface(new PhoneAudio(this, web), "AndroidPhoneAudio");
    web.addJavascriptInterface(new ObdBridge(this, web), "AndroidObd");

    final String origin = BuildConfig.BASE_URL;
    if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT) && !shim.isEmpty()) {
      try { WebViewCompat.addDocumentStartJavaScript(web, shim, Collections.singleton(origin)); } catch (Exception ignored) {}
    }

    web.setWebChromeClient(new WebChromeClient() {
      @Override public void onPermissionRequest(final PermissionRequest r) {
        ui.post(() -> r.grant(r.getResources()));
      }
      // Photo button: lets the file input open the phone's camera / photo picker
      @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
        if (picker != null) picker.onReceiveValue(null);
        picker = cb;
        try {
          Intent cam = new Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE);
          // Without an output file the camera app hands back only a tiny thumbnail (that is what made posts pixelated). Give it a file to save the full-size photo in.
          camUri = null;
          try {
            android.content.ContentValues cv = new android.content.ContentValues();
            cv.put(android.provider.MediaStore.Images.Media.DISPLAY_NAME, "jarvis_" + System.currentTimeMillis() + ".jpg");
            cv.put(android.provider.MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
            if (android.os.Build.VERSION.SDK_INT >= 29) cv.put(android.provider.MediaStore.Images.Media.RELATIVE_PATH, "Pictures/Jarvis");
            camUri = getContentResolver().insert(android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cv);
            if (camUri != null) { cam.putExtra(android.provider.MediaStore.EXTRA_OUTPUT, camUri); cam.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION); }
          } catch (Exception e) { camUri = null; }
          Intent pick = p.createIntent();
          Intent chooser = Intent.createChooser(pick, "Photo for Jarvis");
          if (cam.resolveActivity(getPackageManager()) != null) chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{cam});
          startActivityForResult(chooser, PICK);
        } catch (Exception e) { picker = null; cb.onReceiveValue(null); return false; }
        return true;
      }
      @Override public void onGeolocationPermissionsShowPrompt(String o, GeolocationPermissions.Callback cb) {
        cb.invoke(o, checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED, false);
      }
    });
    web.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
        Uri u = req.getUrl();
        if (u.toString().startsWith(origin)) return false;
        // PS5 pairing: the PSN login runs inside the app; Sony's Remote Play redirect carries the code back to Jarvis.
        if (u.toString().startsWith("https://remoteplay.dl.playstation.net/remoteplay/redirect")) {
          String code = u.getQueryParameter("code");
          v.loadUrl(origin + "/api/ps/oauth?code=" + Uri.encode(code == null ? "" : code));
          return true;
        }
        String h = u.getHost() == null ? "" : u.getHost();
        if (h.endsWith("sonyentertainmentnetwork.com") || h.endsWith("account.sony.com") || h.endsWith("playstation.com") || h.endsWith("playstation.net")) return false;
        try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) {}
        return true;
      }
      @Override public void onPageStarted(WebView v, String url, android.graphics.Bitmap f) {
        // Backup for phones that lack document-start scripts. The shim is safe to run twice.
        if (!shim.isEmpty()) v.evaluateJavascript(shim, null);
      }
      @Override public void onReceivedError(WebView v, WebResourceRequest req, WebResourceError err) {
        if (req.isForMainFrame()) ui.postDelayed(() -> web.loadUrl(origin + "/?app=1"), 4000);
      }
      /** Android killed the page's renderer while the app sat in the background (the service kept the app alive): the screen goes black. Rebuild it. */
      @Override public boolean onRenderProcessGone(WebView v, android.webkit.RenderProcessGoneDetail d) {
        ui.post(() -> { try { recreate(); } catch (Exception e) { web.loadUrl(origin + "/?app=1"); } });
        return true;
      }
    });

    askPermissions();
    web.loadUrl(origin + "/?app=1" + buyParam(getIntent()));
    startKeepAlive();
  }

  private void askPermissions() {
    java.util.ArrayList<String> need = new java.util.ArrayList<>();
    String[] all = Build.VERSION.SDK_INT >= 33
        ? new String[]{Manifest.permission.RECORD_AUDIO, Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.POST_NOTIFICATIONS, Manifest.permission.BLUETOOTH_CONNECT, Manifest.permission.BLUETOOTH_SCAN}
        : Build.VERSION.SDK_INT >= 31
        ? new String[]{Manifest.permission.RECORD_AUDIO, Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.BLUETOOTH_CONNECT, Manifest.permission.BLUETOOTH_SCAN}
        : new String[]{Manifest.permission.RECORD_AUDIO, Manifest.permission.ACCESS_FINE_LOCATION};
    java.util.ArrayList<String> want = new java.util.ArrayList<>(java.util.Arrays.asList(all));
    want.add("net.dinglisch.android.tasker.PERMISSION_RUN_TASKS"); // lets Jarvis start the Tasker Bluetooth task
    for (String p : want) if (checkSelfPermission(p) != PackageManager.PERMISSION_GRANTED) need.add(p);
    if (!need.isEmpty()) requestPermissions(need.toArray(new String[0]), REQ);
  }

  private Uri camUri;
  @Override protected void onActivityResult(int code, int result, Intent data) {
    super.onActivityResult(code, result, data);
    if (code != PICK || picker == null) return;
    Uri[] out = null;
    Uri cu = camUri; camUri = null;
    boolean picked = result == RESULT_OK && data != null && data.getData() != null;
    if (cu != null && !picked) {
      // Camera result: the full-size photo is in the file we gave it; an abandoned shot leaves an empty row to remove.
      if (result == RESULT_OK) out = new Uri[]{cu};
      else { try { getContentResolver().delete(cu, null, null); } catch (Exception ignored) {} }
    } else if (cu != null) { try { getContentResolver().delete(cu, null, null); } catch (Exception ignored) {} }
    if (out == null && result == RESULT_OK && data != null) {
      if (data.getData() != null) out = new Uri[]{data.getData()};
      else if (data.getExtras() != null && data.getExtras().get("data") instanceof android.graphics.Bitmap) {
        try {
          android.graphics.Bitmap b = (android.graphics.Bitmap) data.getExtras().get("data");
          java.io.File f = java.io.File.createTempFile("cam", ".jpg", getCacheDir());
          java.io.FileOutputStream o = new java.io.FileOutputStream(f);
          b.compress(android.graphics.Bitmap.CompressFormat.JPEG, 90, o); o.close();
          out = new Uri[]{Uri.fromFile(f)};
        } catch (Exception ignored) {}
      }
    }
    picker.onReceiveValue(out); picker = null;
  }

  @Override public void onRequestPermissionsResult(int code, String[] perms, int[] res) {
    super.onRequestPermissionsResult(code, perms, res);
    startKeepAlive();
    if (web != null) web.reload(); // pick up the new permissions
  }

  private void startKeepAlive() {
    if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) return;
    try {
      Intent i = new Intent(this, KeepAliveService.class);
      if (Build.VERSION.SDK_INT >= 26) startForegroundService(i); else startService(i);
    } catch (Exception ignored) {}
  }

  /** jarvis://open?buy=SYM (from an alert's Buy button) becomes "&buy=SYM" on the page address; anything else is empty. */
  private static String buyParam(Intent i) {
    try {
      android.net.Uri u = i == null ? null : i.getData();
      if (u == null || !"jarvis".equals(u.getScheme())) return "";
      String sym = u.getQueryParameter("buy");
      if (sym == null) return "";
      sym = sym.toUpperCase().replaceAll("[^A-Z.\\-]", "");
      return sym.isEmpty() || sym.length() > 12 ? "" : "&buy=" + sym;
    } catch (Exception e) { return ""; }
  }

  /** Side key / assistant launch while already open: jump straight to listening. */
  @Override protected void onNewIntent(Intent i) {
    super.onNewIntent(i);
    setIntent(i);
    String buy = buyParam(i);
    if (!buy.isEmpty() && web != null) { web.loadUrl(BuildConfig.BASE_URL + "/?app=1" + buy); return; }   // alert "Buy" button: jarvis://open?buy=SYM
    if (i.getBooleanExtra("silent", false)) return; // returning from another app: do not start listening
    if (web != null) web.evaluateJavascript("window.__jarvisWake&&window.__jarvisWake()", null);
  }

  private boolean resumedOnce = false;
  @Override protected void onResume() {
    super.onResume();
    if (web == null) return;
    web.onResume();
    if (!resumedOnce) { resumedOnce = true; return; }
    // Coming back to the app: if the page does not answer, or answers with an empty screen (black), reload it.
    final boolean[] answered = {false};
    web.evaluateJavascript("(document.body&&document.body.children.length)||0", v -> {
      answered[0] = true;
      if (v == null || v.equals("null") || v.equals("0")) web.loadUrl(BuildConfig.BASE_URL + "/?app=1");
    });
    ui.postDelayed(() -> { if (!answered[0] && !isFinishing()) { try { recreate(); } catch (Exception e) { web.loadUrl(BuildConfig.BASE_URL + "/?app=1"); } } }, 3000);
  }
  @Override protected void onDestroy() { if (stt != null) stt.release(); super.onDestroy(); }
  @Override public void onBackPressed() {
    if (web != null && web.canGoBack()) web.goBack(); else moveTaskToBack(true);
  }
}
