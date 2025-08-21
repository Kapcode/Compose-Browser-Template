package com.kapcode.ComposeBrowserTemplate
import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.ApplicationInfo
import android.os.Build
import android.util.Log
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.google.accompanist.web.AccompanistWebViewClient
import com.google.accompanist.web.rememberWebViewState
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.annotation.RequiresPermission
import androidx.compose.ui.platform.LocalContext
import com.kapcode.ComposeBrowserTemplate.ui.theme.LearnWithAiTheme // Make sure this theme path is correct
import java.io.IOException
import androidx.compose.runtime.saveable.rememberSaveable // Import this
import androidx.compose.ui.graphics.Color
import androidx.webkit.WebViewAssetLoader
import com.google.accompanist.web.WebContent
import com.google.accompanist.web.rememberWebViewNavigator

@SuppressLint("StaticFieldLeak")//I am setting null on dispose
private var internalWebView: android.webkit.WebView? = null
@SuppressLint("StaticFieldLeak")
private var androidBridge: Any = Any()
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (0 != (applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE)) {
            Log.d("MainActivityWebViewDebug", "Enabling WebView debugging.")
            WebView.setWebContentsDebuggingEnabled(true)
        } else {
            Log.d("MainActivityWebViewDebug", "WebView debugging NOT enabled (release build).")
        }
// In your Activity or a class accessible from where WebView is configured

        // When setting up your WebView (e.g., in onCreated):
        // webViewInstance.addJavascriptInterface(WebAppInterface(applicationContext), "AndroidBridge")


        setContent {
            LearnWithAiTheme { // Or your app's theme
                // Here you would call your Composable
                HtmlViewer(mainActivityInstance = this)
            }
        }
    }

    inner class WebAppInterface(private val context: Context) {
        // ... ALL WebAppInterface code ...
// Inside MainActivity.WebAppInterface
        @RequiresPermission(Manifest.permission.VIBRATE)
        @JavascriptInterface
        fun vibrateWithPattern(patternMillisCsv: String) {
            Log.d("WebAppInterface", "JS called vibrateWithPattern with: $patternMillisCsv")

            // 1. Parse the CSV string into a LongArray for the pattern
            val patternArray: LongArray = try {
                patternMillisCsv.split(',')
                    .mapNotNull { it.trim().toLongOrNull() }
                    .toLongArray()
            } catch (e: NumberFormatException) {
                Log.e("WebAppInterface", "Invalid number format in pattern: $patternMillisCsv", e)
                return // Invalid pattern, do nothing
            }

            if (patternArray.isEmpty()) {
                Log.w("WebAppInterface", "Pattern array is empty after parsing: $patternMillisCsv")
                return // Empty pattern, do nothing
            }

            // 2. Get the Vibrator service
            val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                // For Android 12 (API 31) and above, use VibratorManager
                val vibratorManager = this.context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                vibratorManager.defaultVibrator // Get the default system vibrator
            } else {
                // For older versions, directly get Vibrator service (deprecated in API 31)
                @Suppress("DEPRECATION")
                this.context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            }

            // 3. Create the VibrationEffect and Vibrate
            // The VibrationEffect API was added in Android Oreo (API 26)--*/kvm-ok
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                // The second argument to createWaveform is the repeat index:
                // -1 means do not repeat. 0 means repeat from the beginning of the pattern.
                val vibrationEffect = VibrationEffect.createWaveform(patternArray, -1)
                vibrator.vibrate(vibrationEffect)
                Log.d("WebAppInterface", "Vibrating with effect (API 26+)")
            } else {
                // For versions older than Oreo (API < 26), use the older vibrate method
                // This method also takes a repeat index.
                @Suppress("DEPRECATION")
                vibrator.vibrate(patternArray, -1)
                Log.d("WebAppInterface", "Vibrating with pattern (API < 26)")
            }
        }

        @JavascriptInterface
        fun showToast(message: String) {
            Toast.makeText(this.context, message, Toast.LENGTH_SHORT).show()
        }

        // ...

        fun sendDataToJavaScript(message: String, count: Int) {
            // Check if the WebView instance is available
            internalWebView?.let { webView ->
                // Construct the JavaScript function call as a string.
                // Ensure string arguments are properly quoted and escaped for JavaScript.
                val escapedMessage = message
                    .replace("\\", "\\\\") // Escape backslashes
                    .replace("'", "\\'")   // Escape single quotes
                    .replace("\n", "\\n")  // Escape newlines (though less common in simple messages)
                // Add other escapes if your strings can contain them (e.g., double quotes if you use them in JS)

                val script = "updateDisplayFromAndroid('$escapedMessage', $count);"

                // Log what you're about to send (good for debugging)
                Log.d("KotlinToJs", "Evaluating script: $script")

                // Crucial: Ensure evaluateJavascript is called on the Android UI thread.
                // If this function 'sendDataToJavaScript' can be called from a background thread,
                // you MUST post it to the WebView's UI thread.
                webView.post {
                    // This block will execute on the Android UI thread.
                    webView.evaluateJavascript(script) { result ->
                        // This ValueCallback lambda also executes on the Android UI thread.
                        // 'result' is the value returned by the JavaScript function (JSON encoded string).
                        // e.g., if JS returns "Done", result will be "\"Done\"".
                        // e.g., if JS returns 5, result will be "5".
                        // e.g., if JS returns nothing (undefined), result will be "null".
                        Log.d("KotlinToJs", "JavaScript execution result: $result")
                        // You can process the result here if needed.
                    }
                }
            } ?: run {
                Log.w("KotlinToJs", "WebView instance is null. Cannot send data to JavaScript.")
            }
        }
    }

}



@SuppressLint("SetJavaScriptEnabled", "JavascriptInterface")
@Composable
fun HtmlAssetView(
    assetFileName: String,
    webViewClient: AccompanistWebViewClient, // You are already passing this
    mainActivityInstance: MainActivity, // OPTION A: Pass MainActivity instance
    // OR
    // appContext: Context, // OPTION B: Pass application context (safer if WebAppInterface doesn't need MainActivity specific things)
    modifier: Modifier = Modifier
) {
    val initialUrl = "https://appassets.androidplatform.net/$assetFileName"
    val webViewState = rememberWebViewState(url = initialUrl)
    val navigator = rememberWebViewNavigator()

    LaunchedEffect(initialUrl) { // Use assetFileName or initialUrl as key
        if (webViewState.lastLoadedUrl != initialUrl || webViewState.content is WebContent.NavigatorOnly) {
            // The NavigatorOnly check helps if the webview was previously blank
            Log.d("HtmlAssetView", "Loading URL: $initialUrl")
            navigator.loadUrl(initialUrl)
        } else {
            Log.d("HtmlAssetView", "URL $initialUrl already loaded or in progress.")
        }
    }

    com.google.accompanist.web.WebView(
        state = webViewState,
        navigator = navigator,
        modifier = modifier.background(Color.Green), // Apply the passed modifier AND add a background
        // to see the WebView's actual bounds
        client = webViewClient, // Using your custom client
// Inside HtmlAssetView's onCreated lambda for the WebView
        onCreated = { webViewInstance ->
            internalWebView = webViewInstance
            Log.d("WebViewSetup", "WebView instance created. JS Enabled. DOM Storage Enabled.")
            webViewInstance.settings.javaScriptEnabled = true // Essential
            webViewInstance.settings.domStorageEnabled = true

            // Instantiate and add the interface
            androidBridge =
                mainActivityInstance.WebAppInterface(webViewInstance.context) // or localContext.applicationContext
            webViewInstance.addJavascriptInterface(
                androidBridge,
                "AndroidBridge"
            ) // "AndroidBridge" is the name JS will use
            Log.d("WebViewSetup", "AndroidBridge interface added to WebView.")
        },
        onDispose = {
            internalWebView = null // Clear reference on dispose
            androidBridge = Any() // Clear reference on dispose
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HtmlViewer(mainActivityInstance: MainActivity) {
    val context = LocalContext.current
    // ... (get htmlFiles, currentFileIndex state, etc. as before) ...
    val htmlFiles = remember {
        try {
            // Get all files from the root of the assets directory
            val allAssetFiles = context.assets.list("") ?: emptyArray()

            // Filter for .html files and map to their names
            val htmlFileNames = allAssetFiles
                .filter { it.endsWith(".html", ignoreCase = true) }
                .sorted() // Optional: sort them alphabetically or by a custom logic
                .toList() // Convert Array<String> to List<String>

            Log.d("HtmlFiles", "Found HTML files: $htmlFileNames")
            htmlFileNames
        } catch (e: IOException) {
            Log.e("HtmlFiles", "Error listing assets", e)
            emptyList<String>() // Return an empty list in case of error
        }
    }
    var currentFileIndex by rememberSaveable { mutableStateOf(0) }

    // --- WebViewAssetLoader Setup (Stays in the parent) ---
    val assetLoader = remember {
        WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/", WebViewAssetLoader.AssetsPathHandler(context))
            .build()
    }

    // --- Custom WebView Client using the AssetLoader (Stays in the parent) ---
    val customWebViewClient = remember(assetLoader) { // Recreate if assetLoader changes
        object : AccompanistWebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView?,
                request: WebResourceRequest?
            ): WebResourceResponse? {
                // ... your interception logic ...
                return if (view != null && request?.url != null &&
                    request.url.scheme == "https" &&
                    request.url.host == "appassets.androidplatform.net") {
                    Log.d("WebViewIntercept", "AssetLoader handling: ${request.url}")
                    assetLoader.shouldInterceptRequest(request.url)
                } else {
                    Log.d("WebViewIntercept", "Super handling: ${request?.url}")
                    super.shouldInterceptRequest(view, request)
                }
            }

            override fun onPageFinished(view: WebView, url: String?) {
                super.onPageFinished(view, url)
                Log.d("WebViewLoading", "Page finished in custom client: $url")
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url
                if (url != null && url.host == "appassets.androidplatform.net") {
                    return false // Let WebView handle (which means shouldInterceptRequest will get it)
                }
                return super.shouldOverrideUrlLoading(view, request) // Default behavior
            }
        }
    }

    Scaffold(
        modifier = Modifier.background(Color.Cyan),
        //topBar = { /* ... Your TopAppBar ... */ },
       // bottomBar = { /* ... Your BottomAppBar for navigation ... */ }
    ) { innerPadding ->
        Column(  modifier = Modifier
            .padding(innerPadding) // Apply padding from Scaffold
            .fillMaxSize()
            .background(Color.Blue)) {
            if (htmlFiles.isNotEmpty() && currentFileIndex in htmlFiles.indices) {
                val currentFileName = htmlFiles[currentFileIndex]
                HtmlAssetView(
                    assetFileName = currentFileName,
                    webViewClient = customWebViewClient, // <--- PASS IT HERE
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxSize(),
                mainActivityInstance = mainActivityInstance // Ensure HtmlAssetView fills available space
                )
            } else {
                // Handle case where there are no files or index is out of bounds
                Box(modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp), contentAlignment = Alignment.Center) {
                    Text("No HTML file selected or available.")
                }
            }
        }
    }


}


