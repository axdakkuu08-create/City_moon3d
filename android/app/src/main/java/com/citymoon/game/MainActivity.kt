package com.citymoon.game

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.webkit.WebViewAssetLoader

// Full-screen WebView that serves the game from app assets at https://appassets.androidplatform.net/
// (works offline; ES modules and fetch() work because the origin is https, not file://).
class MainActivity : ComponentActivity() {
    private lateinit var web: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        window.decorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION)

        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/", WebViewAssetLoader.AssetsPathHandler(this)) // serves app/src/main/assets/www/*
            .build()

        web = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true            // localStorage saves
            settings.mediaPlaybackRequiresUserGesture = false
            settings.cacheMode = WebSettings.LOAD_NO_CACHE
            settings.allowFileAccess = false
            setBackgroundColor(0xFF0B0D18.toInt())
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(v: WebView, r: WebResourceRequest): WebResourceResponse? {
                    val url = r.url
                    // serve /assets/www/<path> as https://appassets.androidplatform.net/www/<path>
                    return loader.shouldInterceptRequest(url)
                }
            }
            loadUrl("https://appassets.androidplatform.net/www/index.html")
        }
        setContentView(web)
    }

    override fun onPause() { super.onPause(); web.onPause() }
    override fun onResume() { super.onResume(); web.onResume() }
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() { if (web.canGoBack()) web.goBack() else super.onBackPressed() }
}
