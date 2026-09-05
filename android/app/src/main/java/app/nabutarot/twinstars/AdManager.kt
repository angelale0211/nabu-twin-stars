package app.nabutarot.twinstars

import android.app.Activity
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import com.google.android.ump.ConsentInformation
import com.google.android.ump.ConsentRequestParameters
import com.google.android.ump.UserMessagingPlatform
import org.json.JSONObject
import java.util.concurrent.atomic.AtomicBoolean

/**
 * AdMob rewarded + interstitial ads, behind the UMP consent form (required
 * for players in the EU/UK). Ads are preloaded so they show at once.
 */
class AdManager(private val activity: Activity, private val send: (JSONObject) -> Unit) {

    private var rewarded: RewardedAd? = null
    private var interstitial: InterstitialAd? = null
    private val initialized = AtomicBoolean(false)
    private lateinit var consent: ConsentInformation

    fun start() {
        consent = UserMessagingPlatform.getConsentInformation(activity)
        val params = ConsentRequestParameters.Builder().setTagForUnderAgeOfConsent(false).build()
        consent.requestConsentInfoUpdate(activity, params, {
            UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity) { _ ->
                if (consent.canRequestAds()) initAds()
                notifyPrivacy()
            }
        }, { _ ->
            // Consent info unavailable (offline); still try with whatever is cached.
            if (consent.canRequestAds()) initAds()
        })
        if (consent.canRequestAds()) initAds()
    }

    private fun initAds() {
        if (!initialized.compareAndSet(false, true)) return
        Thread {
            MobileAds.initialize(activity) {
                activity.runOnUiThread { loadRewarded(); loadInterstitial() }
            }
        }.start()
    }

    fun privacyOptionsRequired(): Boolean =
        ::consent.isInitialized && consent.privacyOptionsRequirementStatus == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED

    fun showPrivacyOptions() {
        UserMessagingPlatform.showPrivacyOptionsForm(activity) { _ -> notifyPrivacy() }
    }

    private fun notifyPrivacy() {
        send(JSONObject().put("type", "privacy").put("required", privacyOptionsRequired()))
    }

    private fun notifyReady() {
        send(JSONObject().put("type", "adReady").put("rewarded", rewarded != null).put("interstitial", interstitial != null))
    }

    private fun loadRewarded() {
        RewardedAd.load(activity, activity.getString(R.string.admob_rewarded), AdRequest.Builder().build(), object : RewardedAdLoadCallback() {
            override fun onAdLoaded(ad: RewardedAd) { rewarded = ad; notifyReady() }
            override fun onAdFailedToLoad(error: LoadAdError) { rewarded = null; notifyReady() }
        })
    }

    private fun loadInterstitial() {
        InterstitialAd.load(activity, activity.getString(R.string.admob_interstitial), AdRequest.Builder().build(), object : InterstitialAdLoadCallback() {
            override fun onAdLoaded(ad: InterstitialAd) { interstitial = ad; notifyReady() }
            override fun onAdFailedToLoad(error: LoadAdError) { interstitial = null; notifyReady() }
        })
    }

    fun showRewarded(placement: String) {
        val ad = rewarded
        if (ad == null) {
            send(JSONObject().put("type", "reward").put("placement", placement).put("ok", false))
            if (initialized.get()) loadRewarded()
            return
        }
        var earned = false
        ad.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                rewarded = null
                send(JSONObject().put("type", "reward").put("placement", placement).put("ok", earned))
                loadRewarded()
            }
            override fun onAdFailedToShowFullScreenContent(error: AdError) {
                rewarded = null
                send(JSONObject().put("type", "reward").put("placement", placement).put("ok", false))
                loadRewarded()
            }
        }
        ad.show(activity) { earned = true }
    }

    fun showInterstitial() {
        val ad = interstitial
        if (ad == null) {
            send(JSONObject().put("type", "interstitial").put("ok", false))
            if (initialized.get()) loadInterstitial()
            return
        }
        ad.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                interstitial = null
                send(JSONObject().put("type", "interstitial").put("ok", true))
                loadInterstitial()
            }
            override fun onAdFailedToShowFullScreenContent(error: AdError) {
                interstitial = null
                send(JSONObject().put("type", "interstitial").put("ok", false))
                loadInterstitial()
            }
        }
        ad.show(activity)
    }
}
