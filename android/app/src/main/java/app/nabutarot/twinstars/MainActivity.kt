package app.nabutarot.twinstars

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader
import org.json.JSONObject

/**
 * The whole game is the web page in assets/www. This activity only adds what
 * a web page cannot do on its own: AdMob ads, Play Billing, vibration.
 *
 * JS -> Android: window.NabuAndroid.<method>()   (see Bridge below)
 * Android -> JS: window.__nabuNative({type: ...})  (see send())
 */
class MainActivity : AppCompatActivity() {

    private lateinit var web: WebView
    private lateinit var ads: AdManager
    private lateinit var billing: BillingManager

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = WebView(this)
        setContentView(web)

        ads = AdManager(this) { send(it) }
        billing = BillingManager(this) { send(it) }

        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = false
            mediaPlaybackRequiresUserGesture = false
            textZoom = 100
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
        }
        web.setBackgroundColor(0xFFEFE9FA.toInt())
        web.addJavascriptInterface(Bridge(), "NabuAndroid")
        web.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                loader.shouldInterceptRequest(request.url)

            // Outside links (Nabu Tarot, privacy policy, Instagram) open in the browser.
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val url = request.url
                if (url.host == "appassets.androidplatform.net") return false
                startActivity(Intent(Intent.ACTION_VIEW, url))
                return true
            }
        }
        web.loadUrl("https://appassets.androidplatform.net/assets/www/index.html")

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                // The game keeps its own history in the URL hash.
                if (web.canGoBack()) web.goBack() else moveTaskToBack(true)
            }
        })

        ads.start()
        billing.start()
    }

    /** Deliver a message to the page. */
    fun send(msg: JSONObject) {
        runOnUiThread {
            val js = "window.__nabuNative && window.__nabuNative(" + JSONObject.quote(msg.toString()) + ")"
            web.evaluateJavascript(js, null)
        }
    }

    inner class Bridge {
        @JavascriptInterface fun showRewarded(placement: String) = runOnUiThread { ads.showRewarded(placement) }
        @JavascriptInterface fun showInterstitial() = runOnUiThread { ads.showInterstitial() }
        @JavascriptInterface fun isPrivacyOptionsRequired(): Boolean = ads.privacyOptionsRequired()
        @JavascriptInterface fun privacyOptions() = runOnUiThread { ads.showPrivacyOptions() }
        @JavascriptInterface fun buy(sku: String) = runOnUiThread { billing.buy(sku) }
        @JavascriptInterface fun restore() = runOnUiThread { billing.restore() }
        @JavascriptInterface fun queryProducts() = runOnUiThread { billing.queryProducts() }
        @JavascriptInterface fun getVersion(): String = BuildConfig.VERSION_NAME
        @JavascriptInterface fun open(url: String) = runOnUiThread { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) }
        @JavascriptInterface fun vibrate(ms: Int) {
            val v = getSystemService(VIBRATOR_SERVICE) as? Vibrator ?: return
            if (Build.VERSION.SDK_INT >= 26) v.vibrate(VibrationEffect.createOneShot(ms.toLong(), VibrationEffect.DEFAULT_AMPLITUDE))
            else @Suppress("DEPRECATION") v.vibrate(ms.toLong())
        }
    }

    override fun onResume() { super.onResume(); web.onResume(); billing.restore() }
    override fun onPause() { web.onPause(); super.onPause() }
    override fun onDestroy() { billing.close(); web.destroy(); super.onDestroy() }
}
