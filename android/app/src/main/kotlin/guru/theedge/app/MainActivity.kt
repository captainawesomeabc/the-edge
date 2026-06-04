package guru.theedge.app

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var splashView: View
    private lateinit var billingManager: BillingManager

    private val appUrl = "https://theedge.guru/app.html"
    private val allowedHosts = setOf("theedge.guru", "www.theedge.guru")

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Edge-to-edge dark UI
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.parseColor("#0a0a1a")
        window.navigationBarColor = Color.parseColor("#0a0a1a")

        setContentView(R.layout.activity_main)

        splashView = findViewById(R.id.splashView)
        swipeRefresh = findViewById(R.id.swipeRefresh)
        webView = findViewById(R.id.webView)

        billingManager = BillingManager(this)

        setupWebView()
        setupSwipeRefresh()

        webView.loadUrl(appUrl)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            cacheMode = WebSettings.LOAD_DEFAULT
            setSupportMultipleWindows(false)
            useWideViewPort = true
            loadWithOverviewMode = true
            allowFileAccess = false
            allowContentAccess = false
        }

        // Dark mode for WebView if supported
        if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
            WebSettingsCompat.setAlgorithmicDarkeningAllowed(webView.settings, false)
        }

        // Inject Android bridge for billing communication
        webView.addJavascriptInterface(EdgeBridge(), "AndroidBridge")

        webView.webViewClient = object : WebViewClient() {

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                hideSplash()
                swipeRefresh.isRefreshing = false
                // Inject platform detection so web app knows it's in Android
                view?.evaluateJavascript("""
                    (function() {
                        window.__THEEDGE_PLATFORM = 'android';
                        window.__THEEDGE_ANDROID = true;
                    })();
                """.trimIndent(), null)
            }

            override fun onReceivedError(
                view: WebView?, request: WebResourceRequest?, error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    swipeRefresh.isRefreshing = false
                }
            }

            override fun shouldOverrideUrlLoading(
                view: WebView?, request: WebResourceRequest?
            ): Boolean {
                val url = request?.url ?: return false
                val host = url.host ?: ""
                val scheme = url.scheme ?: ""

                // Handle theedge:// URL scheme (matches iOS behavior)
                if (scheme == "theedge") {
                    handleCustomScheme(url)
                    return true
                }

                // Intercept Stripe payment links → trigger Play Billing instead
                if (host == "buy.stripe.com") {
                    billingManager.launchSubscription(this@MainActivity)
                    return true
                }

                // Allow navigation within theedge.guru
                if (host in allowedHosts) {
                    return false
                }

                // External links → open in browser
                if (scheme == "http" || scheme == "https") {
                    startActivity(Intent(Intent.ACTION_VIEW, url))
                    return true
                }

                // Other schemes (mailto:, tel:, etc.)
                try {
                    startActivity(Intent(Intent.ACTION_VIEW, url))
                } catch (_: Exception) { }
                return true
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                if (newProgress >= 100) {
                    swipeRefresh.isRefreshing = false
                }
            }
        }
    }

    private fun setupSwipeRefresh() {
        swipeRefresh.setColorSchemeColors(Color.parseColor("#3B82F6"))
        swipeRefresh.setProgressBackgroundColorSchemeColor(Color.parseColor("#141428"))
        swipeRefresh.setOnRefreshListener {
            webView.reload()
        }
    }

    private fun handleCustomScheme(uri: Uri) {
        when (uri.host) {
            "subscribe" -> billingManager.launchSubscription(this)
            "restore" -> billingManager.restorePurchases(this)
            "privacy" -> webView.loadUrl("https://theedge.guru/privacy.html")
            "terms" -> webView.loadUrl("https://theedge.guru/terms.html")
            else -> { /* Unknown scheme action */ }
        }
    }

    private fun hideSplash() {
        if (splashView.visibility == View.VISIBLE) {
            splashView.animate()
                .alpha(0f)
                .setDuration(400)
                .withEndAction {
                    splashView.visibility = View.GONE
                }
                .start()
        }
    }

    /**
     * Notify the web app about subscription status changes.
     */
    fun notifySubscriptionStatus(isSubscribed: Boolean) {
        runOnUiThread {
            webView.evaluateJavascript("""
                (function() {
                    window.__THEEDGE_SUBSCRIBED = $isSubscribed;
                    if (typeof window.onSubscriptionUpdate === 'function') {
                        window.onSubscriptionUpdate($isSubscribed);
                    }
                    // Hide paywall if subscribed
                    if ($isSubscribed) {
                        var pw = document.getElementById('paywall-overlay');
                        if (pw) pw.style.display = 'none';
                        var ss = document.getElementById('subscription-section');
                        if (ss) ss.style.display = 'none';
                    }
                })();
            """.trimIndent(), null)
        }
    }

    @Deprecated("Use OnBackPressedDispatcher")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onResume() {
        super.onResume()
        billingManager.checkSubscription(this)
    }

    override fun onDestroy() {
        billingManager.destroy()
        webView.destroy()
        super.onDestroy()
    }

    /**
     * JavaScript bridge for web app → native communication.
     */
    inner class EdgeBridge {
        @JavascriptInterface
        fun subscribe() {
            runOnUiThread {
                billingManager.launchSubscription(this@MainActivity)
            }
        }

        @JavascriptInterface
        fun restorePurchases() {
            runOnUiThread {
                billingManager.restorePurchases(this@MainActivity)
            }
        }

        @JavascriptInterface
        fun isSubscribed(): Boolean {
            return billingManager.isSubscribed
        }

        @JavascriptInterface
        fun getPlatform(): String = "android"
    }
}
