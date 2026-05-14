import Foundation
import StoreKit

@MainActor
class SubscriptionManager {
    static let shared = SubscriptionManager()

    let productID = "guru.theedge.monthly"
    private(set) var isSubscribed = false
    private var updateListenerTask: Task<Void, Never>?

    private init() {
        updateListenerTask = listenForTransactions()
    }

    deinit {
        updateListenerTask?.cancel()
    }

    /// Load product and initiate purchase — StoreKit 2 presents the native sheet automatically
    func purchase() async throws -> Bool {
        let products = try await Product.products(for: [productID])
        guard let product = products.first else {
            throw StoreError.productNotFound
        }
        let result = try await product.purchase()
        switch result {
        case .success(let verification):
            switch verification {
            case .verified(let transaction):
                await transaction.finish()
                isSubscribed = true
                return true
            case .unverified:
                return false
            }
        case .pending:
            return false
        case .userCancelled:
            return false
        @unknown default:
            return false
        }
    }

    /// Restore existing Apple subscription
    func restorePurchases() async {
        try? await AppStore.sync()
        await updateSubscriptionStatus()
    }

    /// Check current entitlements and update isSubscribed flag
    func updateSubscriptionStatus() async {
        var found = false
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result,
               transaction.productID == productID,
               transaction.revocationDate == nil {
                found = true
                break
            }
        }
        isSubscribed = found
    }

    /// Background listener for real-time transaction updates (renewals, refunds)
    private func listenForTransactions() -> Task<Void, Never> {
        Task.detached(priority: .background) { [weak self] in
            for await result in Transaction.updates {
                if case .verified(let transaction) = result {
                    await transaction.finish()
                    await self?.updateSubscriptionStatus()
                }
            }
        }
    }

    enum StoreError: Error {
        case productNotFound
    }
}
