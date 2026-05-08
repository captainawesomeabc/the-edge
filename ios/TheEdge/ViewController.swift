import UIKit
import WebKit

class ViewController: UIViewController {

    private var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        // Configure WKWebView
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

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
    }
}

extension ViewController: WKNavigationDelegate {

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!,
                 withError error: Error) {
        // Show offline page if connection fails
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
