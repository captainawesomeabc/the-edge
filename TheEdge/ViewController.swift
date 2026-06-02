import UIKit
import WebKit
import StoreKit
import SafariServices

class ViewController: UIViewController {

    // MARK: - Properties
    var webView: WKWebView!
    var progressView: UIProgressView!
    var refreshControl: UIRefreshControl!
    var toolbar: UIToolbar!
    var backButton: UIBarButtonItem!
    var forwardButton: UIBarButtonItem!
    var splashView: SplashView!

    private var progressObservation: NSKeyValueObservation?
    private var canGoBackObservation: NSKeyValueObservation?
    private var canGoForwardObservation: NSKeyValueObservation?
    private var transactionObserver: Task<Void, Never>?

    // MARK: - StoreKit
    private let subscriptionProductID = "guru.theedge.monthly"

    // MARK: - View Setup
    override func loadView() {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.preferences.javaScriptEnabled = true
        config.websiteDataStore = WKWebsiteDataStore.default()

        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .automatic
        view = webView
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        setupToolbar()
        setupProgressBar()
        setupPullToRefresh()
        setupObservers()
        showSplash()
        listenForTransactions()
        loadApp()
    }

    // MARK: - Load App
    func loadApp() {
        guard let url = URL(string: "https://theedge.guru/app.html") else { return }
        let request = URLRequest(url: url, cachePolicy: .reloadRevalidatingCacheData, timeoutInterval: 30)
        webView.load(request)
    }

    // MARK: - Native Toolbar
    func setupToolbar() {
        toolbar = UIToolbar()
        toolbar.translatesAutoresizingMaskIntoConstraints = false
        toolbar.barTintColor = UIColor(red: 10/255.0, green: 22/255.0, blue: 40/255.0, alpha: 1)
        toolbar.tintColor = UIColor(red: 26/255.0, green: 115/255.0, blue: 232/255.0, alpha: 1)
        toolbar.isTranslucent = false

        backButton = UIBarButtonItem(
            image: UIImage(systemName: "chevron.left"),
            style: .plain, target: self, action: #selector(goBack)
        )
        backButton.isEnabled = false

        forwardButton = UIBarButtonItem(
            image: UIImage(systemName: "chevron.right"),
            style: .plain, target: self, action: #selector(goForward)
        )
        forwardButton.isEnabled = false

        let homeButton = UIBarButtonItem(
            image: UIImage(systemName: "house.fill"),
            style: .plain, target: self, action: #selector(goHome)
        )

        let shareButton = UIBarButtonItem(
            image: UIImage(systemName: "square.and.arrow.up"),
            style: .plain, target: self, action: #selector(sharePage)
        )

        let flex = UIBarButtonItem(barButtonSystemItem: .flexibleSpace, target: nil, action: nil)
        toolbar.items = [backButton, flex, forwardButton, flex, homeButton, flex, shareButton]

        view.addSubview(toolbar)
        NSLayoutConstraint.activate([
            toolbar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            toolbar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            toolbar.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            toolbar.heightAnchor.constraint(equalToConstant: 44)
        ])

        webView.scrollView.contentInset = UIEdgeInsets(top: 0, left: 0, bottom: 44, right: 0)
        webView.scrollView.scrollIndicatorInsets = UIEdgeInsets(top: 0, left: 0, bottom: 44, right: 0)
    }

    // MARK: - Progress Bar
    func setupProgressBar() {
        progressView = UIProgressView(progressViewStyle: .default)
        progressView.translatesAutoresizingMaskIntoConstraints = false
        progressView.tintColor = UIColor(red: 26/255.0, green: 115/255.0, blue: 232/255.0, alpha: 1)
        progressView.trackTintColor = UIColor(red: 10/255.0, green: 22/255.0, blue: 40/255.0, alpha: 0.3)
        view.addSubview(progressView)
        view.bringSubviewToFront(progressView)

        NSLayoutConstraint.activate([
            progressView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            progressView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            progressView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            progressView.heightAnchor.constraint(equalToConstant: 2)
        ])
    }

    // MARK: - Pull to Refresh
    func setupPullToRefresh() {
        refreshControl = UIRefreshControl()
        refreshControl.tintColor = .white
        refreshControl.addTarget(self, action: #selector(handleRefresh), for: .valueChanged)
        webView.scrollView.refreshControl = refreshControl
    }

    @objc func handleRefresh() { webView.reload() }

    // MARK: - Observers
    func setupObservers() {
        progressObservation = webView.observe(\.estimatedProgress) { [weak self] webView, _ in
            let progress = Float(webView.estimatedProgress)
            self?.progressView.setProgress(progress, animated: true)
            self?.progressView.isHidden = progress >= 1.0
        }
        canGoBackObservation = webView.observe(\.canGoBack) { [weak self] webView, _ in
            self?.backButton.isEnabled = webView.canGoBack
        }
        canGoForwardObservation = webView.observe(\.canGoForward) { [weak self] webView, _ in
            self?.forwardButton.isEnabled = webView.canGoForward
        }
    }

    // MARK: - Toolbar Actions
    @objc func goBack() { webView.goBack() }
    @objc func goForward() { webView.goForward() }
    @objc func goHome() { loadApp() }
    @objc func sharePage() {
        guard let url = webView.url else { return }
        let shareVC = UIActivityViewController(activityItems: [url], applicationActivities: nil)
        shareVC.popoverPresentationController?.barButtonItem = toolbar.items?.last
        present(shareVC, animated: true)
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { return .lightContent }

    deinit {
        progressObservation?.invalidate()
        canGoBackObservation?.invalidate()
        canGoForwardObservation?.invalidate()
        transactionObserver?.cancel()
    }
}

// MARK: - StoreKit 2 — Purchases
extension ViewController {

    /// Listen for transactions that may have been initiated outside the app (e.g. ask-to-buy)
    func listenForTransactions() {
        transactionObserver = Task.detached {
            for await result in Transaction.updates {
                do {
                    let transaction = try self.checkVerified(result)
                    await self.notifyWebView(purchased: true)
                    await transaction.finish()
                } catch {
                    print("[StoreKit] Unverified transaction: \(error)")
                }
            }
        }
    }

    /// Purchase the monthly subscription
    func handlePurchase() {
        Task {
            do {
                let products = try await Product.products(for: [subscriptionProductID])
                guard let product = products.first else {
                    print("[StoreKit] Product not found: \(subscriptionProductID)")
                    await notifyWebView(purchased: false, error: "Product not found")
                    return
                }

                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    let transaction = try checkVerified(verification)
                    await transaction.finish()
                    await notifyWebView(purchased: true)
                case .userCancelled:
                    print("[StoreKit] User cancelled")
                case .pending:
                    print("[StoreKit] Purchase pending (ask-to-buy)")
                @unknown default:
                    break
                }
            } catch {
                print("[StoreKit] Purchase error: \(error)")
                await notifyWebView(purchased: false, error: error.localizedDescription)
            }
        }
    }

    /// Restore purchases
    func handleRestore() {
        Task {
            do {
                try await AppStore.sync()
                // Check current entitlements
                var hasActive = false
                for await result in Transaction.currentEntitlements {
                    if let transaction = try? checkVerified(result) {
                        if transaction.productID == subscriptionProductID {
                            hasActive = true
                        }
                    }
                }
                await notifyWebView(purchased: hasActive, restored: true)
            } catch {
                print("[StoreKit] Restore error: \(error)")
                await notifyWebView(purchased: false, error: "Restore failed: \(error.localizedDescription)")
            }
        }
    }

    func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified(_, let error):
            throw error
        case .verified(let safe):
            return safe
        }
    }

    @MainActor
    func notifyWebView(purchased: Bool, restored: Bool = false, error: String? = nil) {
        if purchased {
            let fn = restored ? "handleRestoreSuccess" : "handlePurchaseSuccess"
            webView.evaluateJavaScript("window.\(fn) && window.\(fn)()")
        } else if let error = error {
            let escaped = error.replacingOccurrences(of: "'", with: "\\'")
            webView.evaluateJavaScript("window.handlePurchaseError && window.handlePurchaseError('\(escaped)')")
        }
    }
}

// MARK: - URL Scheme Handling
extension ViewController {

    func handleEdgeScheme(_ url: URL) {
        guard let host = url.host else { return }

        switch host {
        case "purchase":
            handlePurchase()

        case "restore":
            handleRestore()

        case "open":
            // theedge://open?url=https://theedge.guru/privacy.html
            if let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
               let urlParam = components.queryItems?.first(where: { $0.name == "url" })?.value,
               let openURL = URL(string: urlParam) {
                let safariVC = SFSafariViewController(url: openURL)
                safariVC.preferredBarTintColor = UIColor(red: 10/255.0, green: 22/255.0, blue: 40/255.0, alpha: 1)
                safariVC.preferredControlTintColor = UIColor(red: 26/255.0, green: 115/255.0, blue: 232/255.0, alpha: 1)
                present(safariVC, animated: true)
            }

        default:
            print("[TheEdge] Unknown scheme action: \(host)")
        }
    }
}

// MARK: - Splash Screen
extension ViewController {
    func showSplash() {
        splashView = SplashView(frame: view.bounds)
        splashView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(splashView)
        view.bringSubviewToFront(splashView)
    }

    func hideSplash() {
        guard splashView != nil && splashView.superview != nil else { return }
        UIView.animate(withDuration: 0.5, delay: 0.3, options: .curveEaseOut, animations: {
            self.splashView.alpha = 0
        }, completion: { _ in
            self.splashView.removeFromSuperview()
            self.splashView = nil
        })
    }
}

// MARK: - WKNavigationDelegate
extension ViewController: WKNavigationDelegate {

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        hideSplash()
        refreshControl.endRefreshing()
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!,
                 withError error: Error) {
        let nsError = error as NSError
        let networkErrorCodes: Set<Int> = [
            NSURLErrorNotConnectedToInternet,
            NSURLErrorNetworkConnectionLost,
            NSURLErrorTimedOut,
            NSURLErrorCannotFindHost,
            NSURLErrorCannotConnectToHost,
            NSURLErrorDNSLookupFailed,
        ]
        guard networkErrorCodes.contains(nsError.code) else { return }
        hideSplash()
        showOfflineView()
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        let nsError = error as NSError
        if nsError.code == NSURLErrorCancelled { return }
        print("Navigation error: \(error.localizedDescription)")
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.allow); return
        }

        // Allow internal schemes (about:, blob:, data:)
        if url.absoluteString.hasPrefix("about:") || url.scheme == "blob" || url.scheme == "data" {
            decisionHandler(.allow); return
        }

        // Intercept theedge:// custom scheme
        if url.scheme == "theedge" {
            handleEdgeScheme(url)
            decisionHandler(.cancel); return
        }

        // Non-HTTP schemes (tel:, mailto:, etc.) — hand off to system
        if let scheme = url.scheme, scheme != "http" && scheme != "https" {
            UIApplication.shared.open(url)
            decisionHandler(.cancel); return
        }

        // Allow theedge.guru and all subdomains
        if let host = url.host, host == "theedge.guru" || host.hasSuffix(".theedge.guru") {
            decisionHandler(.allow); return
        }

        // External links tapped by user → open in Safari
        if navigationAction.navigationType == .linkActivated {
            UIApplication.shared.open(url)
            decisionHandler(.cancel)
        } else {
            decisionHandler(.allow)
        }
    }
}

// MARK: - WKUIDelegate
extension ViewController: WKUIDelegate {
    func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                 initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType,
                 decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        decisionHandler(.grant)
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction,
                 windowFeatures: WKWindowFeatures) -> WKWebView? {
        if navigationAction.targetFrame == nil {
            if let url = navigationAction.request.url,
               let host = url.host,
               host == "theedge.guru" || host.hasSuffix(".theedge.guru") {
                webView.load(navigationAction.request)
            } else if let url = navigationAction.request.url {
                UIApplication.shared.open(url)
            }
        }
        return nil
    }
}

// MARK: - Offline View
extension ViewController {
    func showOfflineView() {
        let offlineVC = OfflineViewController()
        offlineVC.retryAction = { [weak self] in
            self?.dismiss(animated: true)
            self?.loadApp()
        }
        offlineVC.modalPresentationStyle = .overFullScreen
        offlineVC.modalTransitionStyle = .crossDissolve
        present(offlineVC, animated: true)
        refreshControl.endRefreshing()
    }
}

// MARK: - Splash View
class SplashView: UIView {
    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = UIColor(red: 10/255.0, green: 22/255.0, blue: 40/255.0, alpha: 1)

        let logoLabel = UILabel()
        logoLabel.text = "THE EDGE"
        logoLabel.font = UIFont.systemFont(ofSize: 42, weight: .bold)
        logoLabel.textColor = .white
        logoLabel.textAlignment = .center
        logoLabel.translatesAutoresizingMaskIntoConstraints = false
        addSubview(logoLabel)

        let subtitleLabel = UILabel()
        subtitleLabel.text = "Mental Conditioning"
        subtitleLabel.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        subtitleLabel.textColor = UIColor(red: 26/255.0, green: 115/255.0, blue: 232/255.0, alpha: 1)
        subtitleLabel.textAlignment = .center
        subtitleLabel.translatesAutoresizingMaskIntoConstraints = false
        addSubview(subtitleLabel)

        let spinner = UIActivityIndicatorView(style: .large)
        spinner.color = .white
        spinner.startAnimating()
        spinner.translatesAutoresizingMaskIntoConstraints = false
        addSubview(spinner)

        NSLayoutConstraint.activate([
            logoLabel.centerXAnchor.constraint(equalTo: centerXAnchor),
            logoLabel.centerYAnchor.constraint(equalTo: centerYAnchor, constant: -30),
            subtitleLabel.centerXAnchor.constraint(equalTo: centerXAnchor),
            subtitleLabel.topAnchor.constraint(equalTo: logoLabel.bottomAnchor, constant: 8),
            spinner.centerXAnchor.constraint(equalTo: centerXAnchor),
            spinner.topAnchor.constraint(equalTo: subtitleLabel.bottomAnchor, constant: 30),
        ])
    }
    required init?(coder: NSCoder) { fatalError() }
}

// MARK: - Offline View Controller
class OfflineViewController: UIViewController {
    var retryAction: (() -> Void)?

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 10/255.0, green: 22/255.0, blue: 40/255.0, alpha: 1)

        let stack = UIStackView()
        stack.axis = .vertical
        stack.spacing = 16
        stack.alignment = .center
        stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)

        let icon = UILabel()
        icon.text = "📡"
        icon.font = .systemFont(ofSize: 64)
        stack.addArrangedSubview(icon)

        let title = UILabel()
        title.text = "No Connection"
        title.font = .systemFont(ofSize: 24, weight: .bold)
        title.textColor = .white
        stack.addArrangedSubview(title)

        let message = UILabel()
        message.text = "Check your internet connection\nand try again."
        message.font = .systemFont(ofSize: 16)
        message.textColor = .lightGray
        message.numberOfLines = 0
        message.textAlignment = .center
        stack.addArrangedSubview(message)

        let retry = UIButton(type: .system)
        retry.setTitle("Retry", for: .normal)
        retry.titleLabel?.font = .systemFont(ofSize: 18, weight: .semibold)
        retry.setTitleColor(.white, for: .normal)
        retry.backgroundColor = UIColor(red: 26/255.0, green: 115/255.0, blue: 232/255.0, alpha: 1)
        retry.layer.cornerRadius = 12
        retry.contentEdgeInsets = UIEdgeInsets(top: 14, left: 40, bottom: 14, right: 40)
        retry.addTarget(self, action: #selector(retryTapped), for: .touchUpInside)
        stack.addArrangedSubview(retry)

        NSLayoutConstraint.activate([
            stack.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: view.centerYAnchor),
        ])
    }

    @objc func retryTapped() { retryAction?() }
}
