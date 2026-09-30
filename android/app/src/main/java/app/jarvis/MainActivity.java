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
    web.addJavascriptInterface(new PhoneAudio(this, web), "AndroidPhoneAudio");

    final String origin = BuildConfig.BASE_URL;
    if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT) && !shim.isEmpty()) {
      try { WebViewCompat.addDocumentStartJavaScript(web, shim, Collections.singleton(origin)); } catch (Exception ignored) {}
    }

    web.setWebChromeClient(new WebChromeClient() {
      @Override public void onPermissionRequest(final PermissionRequest r) {
        ui.post(() -> r.grant(r.getResources()));
      }
      @Override public void onGeolocationPermissionsShowPrompt(String o, GeolocationPermissions.Callback cb) {
        cb.invoke(o, checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED, false);
      }
    });
    web.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
        Uri u = req.getUrl();
        if (u.toString().startsWith(origin)) return false;
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
    });

    askPermissions();
    web.loadUrl(origin + "/?app=1");
    startKeepAlive();
  }

  private void askPermissions() {
    java.util.ArrayList<String> need = new java.util.ArrayList<>();
    String[] all = Build.VERSION.SDK_INT >= 33
        ? new String[]{Manifest.permission.RECORD_AUDIO, Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.POST_NOTIFICATIONS, Manifest.permission.BLUETOOTH_CONNECT}
        : Build.VERSION.SDK_INT >= 31
        ? new String[]{Manifest.permission.RECORD_AUDIO, Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.BLUETOOTH_CONNECT}
        : new String[]{Manifest.permission.RECORD_AUDIO, Manifest.permission.ACCESS_FINE_LOCATION};
    java.util.ArrayList<String> want = new java.util.ArrayList<>(java.util.Arrays.asList(all));
    want.add("net.dinglisch.android.tasker.PERMISSION_RUN_TASKS"); // lets Jarvis start the Tasker Bluetooth task
    for (String p : want) if (checkSelfPermission(p) != PackageManager.PERMISSION_GRANTED) need.add(p);
    if (!need.isEmpty()) requestPermissions(need.toArray(new String[0]), REQ);
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

  /** Side key / assistant launch while already open: jump straight to listening. */
  @Override protected void onNewIntent(Intent i) {
    super.onNewIntent(i);
    setIntent(i);
    if (i.getBooleanExtra("silent", false)) return; // returning from another app: do not start listening
    if (web != null) web.evaluateJavascript("window.__jarvisWake&&window.__jarvisWake()", null);
  }

  @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); }
  @Override protected void onDestroy() { if (stt != null) stt.release(); super.onDestroy(); }
  @Override public void onBackPressed() {
    if (web != null && web.canGoBack()) web.goBack(); else moveTaskToBack(true);
  }
}
