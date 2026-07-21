package guru.theedge.twa

import android.app.Activity
import android.util.Log
import com.android.billingclient.api.*
import kotlinx.coroutines.*

/**
 * Manages Google Play Billing for The Edge subscription.
 * Product ID: guru.theedge.monthly ($19.99/mo with 7-day free trial)
 * Updated for Billing Library v8.0.0+
 */
class BillingManager(private val activity: MainActivity) : PurchasesUpdatedListener {

    companion object {
        private const val TAG = "EdgeBilling"
        const val PRODUCT_ID = "guru.theedge.monthly"
    }

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    private val billingClient: BillingClient = BillingClient.newBuilder(activity)
        .setListener(this)
        .enablePendingPurchases(
            PendingPurchasesParams.newBuilder()
                .enableOneTimeProducts()
                .enablePrepaidPlans()
                .build()
        )
        .build()

    var isSubscribed = false
        private set

    private var productDetails: ProductDetails? = null

    init {
        connectBillingClient()
    }

    private fun connectBillingClient() {
        billingClient.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
                if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                    Log.d(TAG, "Billing client connected")
                    queryProductDetails()
                    queryExistingPurchases()
                } else {
                    Log.e(TAG, "Billing setup failed: ${result.debugMessage}")
                }
            }

            override fun onBillingServiceDisconnected() {
                Log.w(TAG, "Billing service disconnected, will retry on next action")
            }
        })
    }

    private fun queryProductDetails() {
        val productList = listOf(
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(PRODUCT_ID)
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        )

        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(productList)
            .build()

        billingClient.queryProductDetailsAsync(params) { result, detailsList ->
            if (result.responseCode == BillingClient.BillingResponseCode.OK && detailsList.isNotEmpty()) {
                productDetails = detailsList[0]
                Log.d(TAG, "Product details loaded: ${productDetails?.title}")
            } else {
                Log.e(TAG, "Failed to load product details: ${result.debugMessage}")
            }
        }
    }

    private fun queryExistingPurchases() {
        billingClient.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        ) { result, purchases ->
            if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                val hasActive = purchases.any { purchase ->
                    purchase.purchaseState == Purchase.PurchaseState.PURCHASED &&
                        purchase.products.contains(PRODUCT_ID)
                }
                isSubscribed = hasActive
                activity.notifySubscriptionStatus(hasActive)
                Log.d(TAG, "Subscription status: $hasActive")

                // Acknowledge any unacknowledged purchases
                purchases.filter {
                    it.purchaseState == Purchase.PurchaseState.PURCHASED && !it.isAcknowledged
                }.forEach { acknowledgePurchase(it) }
            }
        }
    }

    fun launchSubscription(callingActivity: Activity) {
        val details = productDetails
        if (details == null) {
            Log.e(TAG, "Product details not loaded yet")
            // Retry connection
            if (billingClient.connectionState != BillingClient.ConnectionState.CONNECTED) {
                connectBillingClient()
            } else {
                queryProductDetails()
            }
            return
        }

        // Get the subscription offer
        val offerToken = details.subscriptionOfferDetails?.firstOrNull()?.offerToken
        if (offerToken == null) {
            Log.e(TAG, "No offer token available")
            return
        }

        val productDetailsParams = BillingFlowParams.ProductDetailsParams.newBuilder()
            .setProductDetails(details)
            .setOfferToken(offerToken)
            .build()

        val billingFlowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(listOf(productDetailsParams))
            .build()

        val result = billingClient.launchBillingFlow(callingActivity, billingFlowParams)
        Log.d(TAG, "Launch billing flow result: ${result.responseCode}")
    }

    fun restorePurchases(callingActivity: Activity) {
        queryExistingPurchases()
    }

    fun checkSubscription(callingActivity: MainActivity) {
        if (billingClient.connectionState == BillingClient.ConnectionState.CONNECTED) {
            queryExistingPurchases()
        } else {
            connectBillingClient()
        }
    }

    override fun onPurchasesUpdated(result: BillingResult, purchases: MutableList<Purchase>?) {
        when (result.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                purchases?.forEach { purchase ->
                    if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
                        isSubscribed = true
                        activity.notifySubscriptionStatus(true)
                        if (!purchase.isAcknowledged) {
                            acknowledgePurchase(purchase)
                        }
                    }
                }
            }
            BillingClient.BillingResponseCode.USER_CANCELED -> {
                Log.d(TAG, "User cancelled purchase")
            }
            else -> {
                Log.e(TAG, "Purchase error: ${result.responseCode} - ${result.debugMessage}")
            }
        }
    }

    private fun acknowledgePurchase(purchase: Purchase) {
        val params = AcknowledgePurchaseParams.newBuilder()
            .setPurchaseToken(purchase.purchaseToken)
            .build()

        billingClient.acknowledgePurchase(params) { result ->
            if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                Log.d(TAG, "Purchase acknowledged")
            } else {
                Log.e(TAG, "Acknowledge failed: ${result.debugMessage}")
            }
        }
    }

    fun destroy() {
        scope.cancel()
        billingClient.endConnection()
    }
}
