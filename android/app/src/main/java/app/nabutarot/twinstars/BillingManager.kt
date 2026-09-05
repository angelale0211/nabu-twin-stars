package app.nabutarot.twinstars

import android.app.Activity
import com.android.billingclient.api.AcknowledgePurchaseParams
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.ConsumeParams
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import org.json.JSONArray
import org.json.JSONObject

/**
 * Google Play Billing for the five products. Moonstone packs are consumed
 * (buy again any time); "remove_ads" and "starter_pack" are owned once and
 * acknowledged. Product ids must match Play Console and CONFIG.skus.
 */
class BillingManager(private val activity: Activity, private val send: (JSONObject) -> Unit) : PurchasesUpdatedListener {

    companion object {
        val CONSUMABLES = setOf("moonstones_60", "moonstones_200", "moonstones_500")
        val ONE_TIME = setOf("remove_ads", "starter_pack")
        val ALL = CONSUMABLES + ONE_TIME
    }

    private val client: BillingClient = BillingClient.newBuilder(activity)
        .setListener(this)
        .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
        .build()
    private val details = HashMap<String, ProductDetails>()
    private var ready = false

    fun start() {
        client.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
                ready = result.responseCode == BillingClient.BillingResponseCode.OK
                if (ready) { queryProducts(); restore() }
            }
            override fun onBillingServiceDisconnected() { ready = false }
        })
    }

    fun close() { client.endConnection() }

    fun queryProducts() {
        if (!ready) return
        val list = ALL.map {
            QueryProductDetailsParams.Product.newBuilder().setProductId(it).setProductType(BillingClient.ProductType.INAPP).build()
        }
        client.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(list).build()) { result, products ->
            if (result.responseCode != BillingClient.BillingResponseCode.OK) return@queryProductDetailsAsync
            val arr = JSONArray()
            for (p in products) {
                details[p.productId] = p
                val price = p.oneTimePurchaseOfferDetails?.formattedPrice ?: continue
                arr.put(JSONObject().put("sku", p.productId).put("price", price))
            }
            send(JSONObject().put("type", "products").put("items", arr))
        }
    }

    fun buy(sku: String) {
        val p = details[sku]
        if (!ready || p == null) {
            send(JSONObject().put("type", "purchase").put("sku", sku).put("ok", false).put("error", "unavailable"))
            queryProducts()
            return
        }
        val params = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(listOf(BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(p).build()))
            .build()
        val r = client.launchBillingFlow(activity, params)
        if (r.responseCode != BillingClient.BillingResponseCode.OK) {
            send(JSONObject().put("type", "purchase").put("sku", sku).put("ok", false).put("error", r.debugMessage))
        }
    }

    override fun onPurchasesUpdated(result: BillingResult, purchases: MutableList<Purchase>?) {
        if (result.responseCode == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (p in purchases) handle(p, fromRestore = false)
        } else {
            // Cancelled or failed: tell the page so the button stops waiting.
            for (sku in ALL) send(JSONObject().put("type", "purchase").put("sku", sku).put("ok", false).put("error", result.debugMessage))
        }
    }

    /** Owned one-time products (and any unconsumed packs) -> grant again. */
    fun restore() {
        if (!ready) return
        client.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build()) { result, purchases ->
            if (result.responseCode != BillingClient.BillingResponseCode.OK) return@queryPurchasesAsync
            val owned = JSONArray()
            for (p in purchases) {
                if (p.purchaseState != Purchase.PurchaseState.PURCHASED) continue
                for (sku in p.products) if (sku in ONE_TIME) owned.put(sku)
                handle(p, fromRestore = true)
            }
            send(JSONObject().put("type", "restore").put("owned", owned))
        }
    }

    private fun handle(p: Purchase, fromRestore: Boolean) {
        if (p.purchaseState != Purchase.PurchaseState.PURCHASED) return
        for (sku in p.products) {
            if (sku in CONSUMABLES) {
                client.consumeAsync(ConsumeParams.newBuilder().setPurchaseToken(p.purchaseToken).build()) { r, _ ->
                    if (r.responseCode == BillingClient.BillingResponseCode.OK)
                        send(JSONObject().put("type", "purchase").put("sku", sku).put("ok", true))
                }
            } else if (sku in ONE_TIME) {
                if (!p.isAcknowledged) {
                    client.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(p.purchaseToken).build()) { }
                }
                if (!fromRestore) send(JSONObject().put("type", "purchase").put("sku", sku).put("ok", true))
            }
        }
    }
}
