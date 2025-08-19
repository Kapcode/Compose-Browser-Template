package com.kapcode.ComposeBrowserTemplate
import android.annotation.SuppressLint
import android.content.pm.ApplicationInfo
import android.util.Log
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.google.accompanist.web.AccompanistWebViewClient
import com.google.accompanist.web.rememberWebViewState
import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.ui.platform.LocalContext
import com.kapcode.ComposeBrowserTemplate.ui.theme.LearnWithAiTheme // Make sure this theme path is correct
import java.io.IOException
import androidx.compose.runtime.saveable.rememberSaveable // Import this
import androidx.compose.ui.input.pointer.util.VelocityTracker // For fling detection (optional but good)
import androidx.compose.ui.input.pointer.util.addPointerInputChange
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.style.TextOverflow
import kotlinx.coroutines.coroutineScope
import kotlin.math.abs
import androidx.webkit.WebViewAssetLoader
import com.google.accompanist.web.rememberWebViewNavigator

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (0 != (applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE)) {
            Log.d("MainActivityWebViewDebug", "Enabling WebView debugging.")
            WebView.setWebContentsDebuggingEnabled(true)
        } else {
            Log.d("MainActivityWebViewDebug", "WebView debugging NOT enabled (release build).")
        }

        setContent {
            LearnWithAiTheme { // Or your app's theme
                // Here you would call your Composable
                HtmlViewer()
            }
        }
    }
}
fun formatFileNameAsTitle(fileName: String): String {
    return fileName
        .removeSuffix(".html") // Remove .html extension
        .replace('-', ' ')    // Replace underscores with spaces
    // Optional: Capitalize words if needed, though this might be too aggressive
    // depending on your exact filename convention.
    // .split(" ")
    // .joinToString(" ") { it.replaceFirstChar(Char::titlecase) }
    // You might want more sophisticated logic if there are numbers and then text,
    // e.g., to ensure "01" doesn't become "01 " if followed by a capital.
    // For simple cases, the first two replacements are often enough.
}

// Your HtmlAssetView remains the same
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun HtmlAssetView(
    assetFileName: String, // You might use this to dynamically set initialUrl
    webViewClient: AccompanistWebViewClient, // <--- Already here, perfect!
    modifier: Modifier = Modifier
) {
    // Use assetFileName to construct the initialUrl
    val initialUrl = "https://appassets.androidplatform.net/$assetFileName"
    Log.d("HtmlViewer", "HtmlAssetView Initial WebView URL to: $initialUrl for file: $assetFileName")

    val webViewState = rememberWebViewState(url = initialUrl)
    val navigator = rememberWebViewNavigator()

    LaunchedEffect(initialUrl) { // Use assetFileName or initialUrl as key
        if (webViewState.lastLoadedUrl != initialUrl || webViewState.content is com.google.accompanist.web.WebContent.NavigatorOnly) {
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
        modifier = modifier.fillMaxSize(), // Apply the passed modifier
        client = webViewClient, // <--- Use the passed webViewClient
        onCreated = { webViewInstance ->
            Log.d("WebViewSetup", "WebView instance created in HtmlAssetView. JS Enabled. DOM Storage Enabled.")
            webViewInstance.settings.javaScriptEnabled = true
            webViewInstance.settings.domStorageEnabled = true
        }
    )
}



// ... other imports

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TopBarWithPagePicker(
    pageTitles: List<String>,
    currentSelectedPageIndex: Int,
    onPageSelected: (Int) -> Unit,
    onNavigateUp: (() -> Unit)? = null
) {
    var menuExpanded by remember { mutableStateOf(false) }

    TopAppBar(
        title = {
            Text(
                text = if (pageTitles.isNotEmpty() && currentSelectedPageIndex in pageTitles.indices) {
                    pageTitles[currentSelectedPageIndex]
                } else {
                    "Learn With AI" // Default or loading title
                },
                maxLines = 1, // Prevent title from wrapping too much
                overflow = TextOverflow.Ellipsis // Add ellipsis if too long
            )
        },
        navigationIcon = {
            if (onNavigateUp != null) {
                IconButton(onClick = onNavigateUp) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack, // Use AutoMirrored if available
                        contentDescription = "Navigate back"
                    )
                }
            }
        },
        actions = {
            if (pageTitles.size > 1) {
                Box(modifier = Modifier.wrapContentSize(Alignment.TopEnd)) {
                    IconButton(onClick = { menuExpanded = true }) {
                        Icon(
                            imageVector = Icons.Filled.MoreVert,
                            contentDescription = "Select Page"
                        )
                    }
                    DropdownMenu(
                        expanded = menuExpanded,
                        onDismissRequest = { menuExpanded = false }
                    ) {
                        pageTitles.forEachIndexed { index, title ->
                            DropdownMenuItem(
                                text = { Text(title) },
                                onClick = {
                                    onPageSelected(index)
                                    menuExpanded = false
                                }
                            )
                        }
                    }
                }
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer,
            titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer,
            actionIconContentColor = MaterialTheme.colorScheme.onPrimaryContainer,
            navigationIconContentColor = MaterialTheme.colorScheme.onPrimaryContainer
        )
    )
}




// ... (formatFileNameAsTitle, TopBarWithPagePicker, HtmlAssetView should be defined as before) ...

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HtmlViewerWithBottomControlsOLD() {
    val context = LocalContext.current
    val assetManager = context.assets
    val htmlFiles = remember {
        try {
            val files = assetManager.list("")?.filter { it.endsWith(".html", ignoreCase = false) }?.sorted()?.toList() ?: emptyList()
            Log.d("HtmlViewer", "Found HTML files: $files") // << LOG THIS
            files
        } catch (e: IOException) {
            Log.e("HtmlViewer", "Error listing assets", e)
            emptyList<String>()
        }
    }

    if (htmlFiles.isEmpty()) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            Text("No HTML lessons found in assets.", textAlign = TextAlign.Center)
        }
        return
    }

    var currentFileIndex by rememberSaveable { mutableStateOf(0) }


    // --- WebViewAssetLoader Setup ---
    val assetLoader = remember {
        androidx.webkit.WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net") /*
 Crucial: Set a domain
 Path handler for your /assets/ folder
 The first parameter in addPathHandler is the virtual path segment in your special domain URL
 The second parameter is how to find those files locally.
 */
            .addPathHandler("/", androidx.webkit.WebViewAssetLoader.AssetsPathHandler(context))
            .addPathHandler("/assets/", androidx.webkit.WebViewAssetLoader.AssetsPathHandler(context))
            // You can add more handlers if you have assets in res/raw, for example:
            // .addPathHandler("/res/", WebViewAssetLoader.ResourcesPathHandler(context))
            .build()
    }





    // --- Custom WebView Client using the AssetLoader ---
    val customWebViewClient = remember(assetLoader, htmlFiles) { // Recreate if assetLoader or htmlFiles change
        object : AccompanistWebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView?, // Nullable as per Accompanist
                request: WebResourceRequest?
            ): WebResourceResponse? {
                // Let the assetLoader try to handle the request if the URL matches its domain
                return if (view != null && request?.url != null) {
                    // Log.d("WebViewClientDebug", "Intercepting: ${request.url}")
                    assetLoader.shouldInterceptRequest(request.url) // Pass the full URI
                } else {
                    // Log.d("WebViewClientDebug", "Not intercepting, view or request or URL is null")
                    super.shouldInterceptRequest(view, request)
                }
            }

            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val urlString = request?.url?.toString()
                Log.d("WebViewClientDebug", "shouldOverrideUrlLoading: $urlString")

                if (urlString != null) {
                    // If it's an appassets URL, let the WebView load it (it will be intercepted by shouldInterceptRequest)
                    if (request.url.host == "appassets.androidplatform.net") {
                        Log.d("WebViewClientDebug", "Letting WebView handle appassets URL: $urlString")
                        return false // false means WebView handles it
                    }

                    // Your existing logic for handling internal file:///android_asset/ links (if any remain, or for other schemes)
                    // This part might become less relevant if all internal navigation uses the assetLoader's domain.
                    if (urlString.startsWith("file:///android_asset/")) {
                        val clickedFileName = urlString.substringAfterLast('/')
                            .substringBefore("?")
                            .substringBefore("#")
                        val newIndex = htmlFiles.indexOf(clickedFileName)
                        if (newIndex != -1) {
                            Log.d("WebViewLinkClick", "Handled internal asset link: $clickedFileName")
                            // currentFileIndex = newIndex // Make sure this state update causes recomposition
                            return true // true because we've handled it
                        }
                    }
                    // Handle other external links (http, https, mailto, etc.)
                    // Example: Open in external browser - this needs more robust handling
                    // if (!urlString.startsWith("http:") && !urlString.startsWith("https:")) { ... }
                }
                Log.d("WebViewClientDebug", "Super will handle or block: $urlString")
                return super.shouldOverrideUrlLoading(view, request) // Default handling
            }

            override fun onPageFinished(view: WebView, url: String?) {
                super.onPageFinished(view, url)
                Log.d("WebViewClientDebug", "Page finished loading: $url")
            }
        }
    }

    // --- Determine initial URL ---
    // Make sure htmlFiles is not empty and currentFileIndex is valid

    val initialUrl = if (htmlFiles.isNotEmpty() && currentFileIndex in htmlFiles.indices) {
        val fileName = htmlFiles[currentFileIndex]
        // Construct the URL using the assetLoader's domain
        // Ensure your HTML files are directly in 'assets' or specify the subfolder e.g., "/assets/lessons/$fileName"
        "https://appassets.androidplatform.net/assets/$fileName"
    } else {
        "https://appassets.androidplatform.net/assets/error_page.html" // A fallback or empty page
    }
    Log.d("HtmlViewer", "Initial WebView URL: $initialUrl")

    val webViewState = rememberWebViewState(url = initialUrl)
    val navigator = rememberWebViewNavigator();
    LaunchedEffect(initialUrl) { // Reload if initialUrl changes due to currentFileIndex
        if (webViewState.lastLoadedUrl != initialUrl) {
            navigator.loadUrl(initialUrl)
        }
    }


    // --- Your Scaffold and Column structure ---
    // Scaffold(...) { innerPadding ->
    //  Column(modifier = Modifier.padding(innerPadding).fillMaxSize()) {

    if (htmlFiles.isNotEmpty() && currentFileIndex in htmlFiles.indices) {
        // Log.d("HtmlViewerLayout", "Displaying HtmlAssetView for ${htmlFiles[currentFileIndex]}")
        key(initialUrl) { // Keying with initialUrl ensures WebView reloads if URL changes
            com.google.accompanist.web.WebView(
                state = webViewState,
                modifier = Modifier.fillMaxWidth(), // Example modifier
                client = customWebViewClient, // Your client with assetLoader logic
                // captureBackPresses = true, // If you want WebView to handle back for its history
                onCreated = { webViewInstance ->
                    Log.d("WebViewSetup", "WebView instance created. JS Enabled. DOM Storage Enabled.")
                    webViewInstance.settings.javaScriptEnabled = true
                    webViewInstance.settings.domStorageEnabled = true
                    // IMPORTANT for local development with `file:///` if not using assetLoader for everything
                    // OR if loading mixed content, though appassets.androidplatform.net is https
                    // webViewInstance.settings.allowFileAccess = true
                    // webViewInstance.settings.allowContentAccess = true
                    // For JS modules from file:/// (less effective than WebViewAssetLoader for modules):
                    // webViewInstance.settings.allowFileAccessFromFileURLs = true
                    // webViewInstance.settings.allowUniversalAccessFromFileURLs = true
                }
            )
        }
    } else {
        // Fallback content if no HTML files or index out of bounds
        // Text("No HTML content available or index out of bounds.")
    }

    LaunchedEffect(htmlFiles) {
        if (currentFileIndex !in htmlFiles.indices && htmlFiles.isNotEmpty()) {
            currentFileIndex = 0
        }
    }

    val pageTitles = remember(htmlFiles) {
        htmlFiles.map { fileName -> formatFileNameAsTitle(fileName) }
    }

    val canGoPrevious = currentFileIndex > 0

    val canGoNext = currentFileIndex < htmlFiles.size - 1

    // Swipe gesture state
    val swipeThresholdPx = with(LocalDensity.current) { 100.dp.toPx() } // Minimum swipe distance in pixels
    val velocityThresholdPx = with(LocalDensity.current) { 150.dp.toPx() } // Minimum fling velocity in pixels per second


    Scaffold(
        modifier = Modifier.fillMaxSize(),
        topBar = {
            if (htmlFiles.isNotEmpty()) {
                TopBarWithPagePicker(
                    pageTitles = pageTitles,
                    currentSelectedPageIndex = currentFileIndex,
                    onPageSelected = { newIndex -> currentFileIndex = newIndex }
                )
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .padding(innerPadding)
                .fillMaxSize()
                // Apply swipe detection to the Column containing the WebView

        )
 {
            //TODO RE READ THIS,, GO OVER IT
     if (htmlFiles.isNotEmpty() && currentFileIndex in htmlFiles.indices) {
         Log.d("HtmlViewerLayout", "Displaying HtmlAssetView for ${htmlFiles[currentFileIndex]}")
         key(htmlFiles[currentFileIndex]) { // Keying is good for forcing WebView reload on page change
             HtmlAssetView(
                 assetFileName = htmlFiles[currentFileIndex],
                 webViewClient = customWebViewClient, // Make sure customWebViewClient is remembered correctly
                 modifier = Modifier
                     .fillMaxWidth()
                     .weight(1f)
             )
         }
     } else {

         // This is the fallback if no files or index is out of bounds
         Log.d("HtmlViewerLayout", "Displaying Fallback. htmlFiles empty: ${htmlFiles.isEmpty()}, currentFileIndex: $currentFileIndex")
         Box(
             modifier = Modifier
                 .fillMaxWidth()
                 .weight(1f)
                 .padding(16.dp),
             contentAlignment = Alignment.Center
         ) {
             Text(
                 when {
                     htmlFiles.isEmpty() && currentFileIndex == 0 -> "Loading lessons..." // Or specific message for initial empty state
                     htmlFiles.isEmpty() -> "No HTML lessons found in assets."
                     else -> "Error: Selected lesson index ($currentFileIndex) is out of bounds. Files available: ${htmlFiles.size}."
                 }
             )
         }
     }

// ...
            // The bottom bar Row:
            if (htmlFiles.size > 1) {
                // REMOVED: var dragAmountY by remember { mutableStateOf(0f) }
                // REMOVED: val swipeUpThresholdPx = with(LocalDensity.current) { -75.dp.toPx() }

                Row(
                    modifier = Modifier // The .pointerInput modifier for vertical swipe is REMOVED from here
                        .fillMaxWidth()
                        .height(72.dp)
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.95f))
                        .padding(horizontal = 8.dp)
                        .pointerInput(Unit) { // HORIZONTAL SWIPE FOR PAGE TURNING
                            var accumulatedDragX =
                                0f // Make sure this is correctly scoped if not already
                            val velocityTracker = VelocityTracker() // And this

                            // It's good practice to ensure this coroutineScope is properly managed,
                            // though for simple detect gestures it's usually fine.
                            coroutineScope {
                                detectHorizontalDragGestures(
                                    onDragStart = {
                                        accumulatedDragX = 0f
                                        velocityTracker.resetTracking()
                                        Log.d("SwipeDebug", "Column DragStart")
                                    },
                                    onHorizontalDrag = { change, dragAmount ->
                                        // VERY IMPORTANT: Ensure 'change.consume()' is being called effectively.
                                        // If the WebView is somehow consuming touch events before this,
                                        // this might not get called as expected for drags over the WebView.
                                        change.consume()
                                        accumulatedDragX += dragAmount
                                        velocityTracker.addPointerInputChange(change)
                                        Log.d(
                                            "SwipeDebug",
                                            "Column Dragging: $accumulatedDragX, changeId: ${change.id}"
                                        )
                                    },
                                    onDragEnd = {
                                        val velocity = velocityTracker.calculateVelocity().x
                                        Log.d(
                                            "SwipeDebug",
                                            "Column DragEnd: accumulatedDragX=$accumulatedDragX, velocity=$velocity"
                                        )

                                        // Check your thresholds
                                        val absAccumulatedDragX = abs(accumulatedDragX)
                                        val absVelocity = abs(velocity)

                                        if (absAccumulatedDragX > swipeThresholdPx || absVelocity > velocityThresholdPx) {
                                            if (accumulatedDragX < 0 /* Swipe Left */) { // Simplified condition for clarity
                                                if (canGoNext) {
                                                    currentFileIndex++
                                                    Log.d(
                                                        "SwipeDebug",
                                                        "Swiped Left to Next (Index: $currentFileIndex)"
                                                    )
                                                } else {
                                                    Log.d(
                                                        "SwipeDebug",
                                                        "Swipe Left: Cannot go next."
                                                    )
                                                }
                                            } else if (accumulatedDragX > 0 /* Swipe Right */) { // Simplified condition
                                                if (currentFileIndex > 0) {// Simplified condition fixed odd bug caused by canGoPrevious Quirk
                                                    currentFileIndex--
                                                    Log.d(
                                                        "SwipeDebug",
                                                        "Swiped Right to Previous (Index: $currentFileIndex)"
                                                    )
                                                } else {
                                                    Log.d(
                                                        "SwipeDebug",
                                                        "Swipe Right: Cannot go previous."
                                                    )
                                                }
                                            }
                                        } else {
                                            Log.d(
                                                "SwipeDebug",
                                                "Column DragEnd: Swipe below threshold."
                                            )
                                        }
                                        accumulatedDragX = 0f // Reset
                                    },
                                    // onDragCancel = { accumulatedDragX = 0f /* Also reset on cancel */ } // Good to have
                                )
                            }
                        },
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically

                ) {
                    // IconButton for Previous
                    IconButton(
                        onClick = { if (canGoPrevious) currentFileIndex-- },
                        enabled = canGoPrevious
                    ) {
                        Icon(
                            Icons.AutoMirrored.Filled.KeyboardArrowLeft, "Previous Page",
                            modifier = Modifier.size(36.dp),
                            tint = if (canGoPrevious) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.38f)
                        )
                    }

                    Text(
                        text = if (htmlFiles.isNotEmpty()) "${currentFileIndex + 1} / ${htmlFiles.size}" else "0 / 0",
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.weight(0.5f)
                    )

                    // IconButton for Next
                    IconButton(
                        onClick = { if (canGoNext) currentFileIndex++ },
                        enabled = canGoNext
                    ) {
                        Icon(
                            Icons.AutoMirrored.Filled.KeyboardArrowRight, "Next Page",
                            modifier = Modifier.size(36.dp),
                            tint = if (canGoNext) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.38f)
                        )
                    }
                }
            }

        }
    }
}







@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HtmlViewer() {
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
                // Consider opening external links in a browser
                // try {
                //     val intent = Intent(Intent.ACTION_VIEW, url)
                //     context.startActivity(intent)
                //     return true // We've handled it
                // } catch (e: Exception) {
                //     Log.e("WebViewOverride", "Could not open external link $url", e)
                //     return true // Block if it can't be opened
                // }
                return super.shouldOverrideUrlLoading(view, request) // Default behavior
            }
        }
    }

    Scaffold(
        topBar = { /* ... Your TopAppBar ... */ },
        bottomBar = { /* ... Your BottomAppBar for navigation ... */ }
    ) { innerPadding ->
        Column(modifier = Modifier.padding(innerPadding)) {
            if (htmlFiles.isNotEmpty() && currentFileIndex in htmlFiles.indices) {
                val currentFileName = htmlFiles[currentFileIndex]
                HtmlAssetView(
                    assetFileName = currentFileName,
                    webViewClient = customWebViewClient, // <--- PASS IT HERE
                    modifier = Modifier.weight(1f) // Ensure HtmlAssetView fills available space
                )
            } else {
                // Handle case where there are no files or index is out of bounds
                Box(modifier = Modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.Center) {
                    Text("No HTML file selected or available.")
                }
            }
        }
    }
}


