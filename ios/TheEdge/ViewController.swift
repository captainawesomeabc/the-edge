import UIKit
import WebKit
import StoreKit

class ViewController: UIViewController {

    private var webView: WKWebView!
    private let subManager = SubscriptionManager.shared

    override func viewDidLoad() {
        super.viewDidLoad()

        // Register JS→native message handlers
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        let contentController = config.userContentController
        contentController.add(self, name: "purchaseSubscription")
        contentController.add(self, name: "restoreSubscription")

        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.navigationDelegate = self
        webView.allowsBackForwardNavigationGestures = true

        view.addSubview(webView)
        view.backgroundColor = .black

        // Load THE EDGE app
        guard let url = URL(string: "https://theedge.guru/app.html") else { return }
        let request = URLRequest(url: url, cachePolicy: .returnCacheDataElseLoad)
        webView.load(request)

        // Pre-fetch subscription status in background
        Task {
            await subManager.updateSubscriptionStatus()
        }
    }

    /// Inject subscription flag into the web page and fire the update event
    private func injectSubscriptionStatus() {
        let active = subManager.isSubscribed
        let js = """
        window.nativeSubscriptionActive = \(active);
        window.dispatchEvent(new Event('nativeSubscriptionUpdated'));
        """
        webView.evaluateJavaScript(js, completionHandler: nil)
    }

    /// Trigger StoreKit 2 purchase sheet — system handles the UI automatically
    private func triggerNativePurchase() {
        Task {
            do {
                let success = try await subManager.purchase()
                if success {
                    injectSubscriptionStatus()
                }
            } catch {
                let alert = UIAlertController(
                    title: "Purchase Failed",
                    message: "Unable to complete the purchase. Please try again or contact support.",
                    preferredStyle: .alert
                )
                alert.addAction(UIAlertAction(title: "OK", style: .cancel))
                present(alert, animated: true)
            }
        }
    }

    /// Restore an existing Apple subscription
    private func triggerRestore() {
        Task {
            await subManager.restorePurchases()
            injectSubscriptionStatus()
            if !subManager.isSubscribed {
                let alert = UIAlertController(
                    title: "No Subscription Found",
                    message: "No active subscription was found for this Apple ID. If you believe this is an error, please contact support.",
                    preferredStyle: .alert
                )
                alert.addAction(UIAlertAction(title: "OK", style: .cancel))
                present(alert, animated: true)
            }
        }
    }
}

extension ViewController: WKNavigationDelegate {

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // Inject subscription status as soon as page finishes loading
        injectSubscriptionStatus()
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!,
                 withError error: Error) {
        let html = """
        <html>
        <body style="background:#000;color:#FFD700;font-family:sans-serif;
                     display:flex;align-items:center;justify-content:center;
                     height:100vh;margin:0;text-align:center;">
        <div>
          <h1 style="font-size:2em;">THE EDGE</h1>
          <p>Please check your connection and try again.</p>
          <button onclick="window.location.reload()"
                  style="background:#FFD700;color:#000;border:none;
                         padding:12px 24px;font-size:1em;border-radius:8px;
                         cursor:pointer;margin-top:16px;">Retry</button>
        </div>
        </body></html>
        """
        webView.loadHTMLString(html, baseURL: nil)
    }
}

extension ViewController: WKScriptMessageHandler {

    func userContentController(_ userContentController: WKUserContentController,
                                didReceive message: WKScriptMessage) {
        switch message.name {
        case "purchaseSubscription":
            triggerNativePurchase()
        case "restoreSubscription":
            triggerRestore()
        default:
            break
        }
    }
}
