package com.golmok.champions;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

/** 골목대전: 게임 사이트를 앱 안에서 띄움. 크롬이 아니라 이 앱의 사용 시간으로 잡혀요. */
public class MainActivity extends Activity {
  static final String HOST = "golmok-champions.onrender.com";
  static final String HOME = "https://" + HOST + "/";
  static final int PICK = 7;
  WebView web;
  ValueCallback<Uri[]> pending;
  long backAt = 0;

  @Override protected void onCreate(Bundle saved) {
    super.onCreate(saved);
    Window w = getWindow();
    w.setStatusBarColor(Color.parseColor("#1a1433"));
    w.setNavigationBarColor(Color.parseColor("#1a1433"));
    web = new WebView(this);
    web.setBackgroundColor(Color.parseColor("#2340A8"));
    setContentView(web);
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setSupportZoom(false);
    s.setTextZoom(100);
    s.setUserAgentString(s.getUserAgentString() + " GolmokApp/1");
    CookieManager.getInstance().setAcceptCookie(true);
    CookieManager.getInstance().setAcceptThirdPartyCookies(web, true);

    web.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
        Uri u = r.getUrl();
        if (HOST.equals(u.getHost())) return false;
        try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { /* 열 앱 없음 */ }
        return true;
      }
      @Override public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
        if (!r.isForMainFrame()) return;
        v.loadDataWithBaseURL(null, "<html><body style='margin:0;display:grid;place-items:center;height:100vh;background:#2340A8;color:#fff;font-family:sans-serif;text-align:center'>"
          + "<div><h2>골목대전에 연결하지 못했어요</h2><p>인터넷 연결을 확인하거나<br>서버가 깨어날 때까지 잠깐 기다려 주세요.</p>"
          + "<button onclick=\"location.href='" + HOME + "'\" style='font-size:18px;padding:12px 24px;border-radius:12px;border:3px solid #1a1433;background:#FFD23F'>다시 시도</button></div></body></html>",
          "text/html", "utf-8", null);
      }
    });
    web.setWebChromeClient(new WebChromeClient() {
      @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
        if (pending != null) pending.onReceiveValue(null);
        pending = cb;
        Intent i = new Intent(Intent.ACTION_GET_CONTENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("image/*");
        try { startActivityForResult(Intent.createChooser(i, "사진 고르기"), PICK); }
        catch (Exception e) { pending = null; return false; }
        return true;
      }
    });
    if (saved != null) web.restoreState(saved); else web.loadUrl(HOME);
  }

  @Override protected void onActivityResult(int req, int res, Intent data) {
    super.onActivityResult(req, res, data);
    if (req != PICK || pending == null) return;
    Uri[] out = null;
    if (res == RESULT_OK && data != null && data.getData() != null) out = new Uri[] { data.getData() };
    pending.onReceiveValue(out);
    pending = null;
  }

  // 뒤로 가기: 게임 화면의 「돌아가기」 버튼을 누르고, 없으면 두 번 눌러 종료
  @Override public void onBackPressed() {
    web.evaluateJavascript("(function(){var b=document.getElementById('back')||document.querySelector('.sheet [data-x],.sheet .close');if(b&&b.offsetParent!==null){b.click();return 'y'}return 'n'})()", v -> {
      if ("\"y\"".equals(v)) return;
      long now = System.currentTimeMillis();
      if (now - backAt < 2000) finish();
      else { backAt = now; Toast.makeText(this, "한 번 더 누르면 종료돼요", Toast.LENGTH_SHORT).show(); }
    });
  }

  @Override protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }
  @Override protected void onPause() { super.onPause(); CookieManager.getInstance().flush(); web.onPause(); }
  @Override protected void onResume() { super.onResume(); web.onResume(); }
  @Override protected void onDestroy() { if (web != null) { web.destroy(); } super.onDestroy(); }
}
