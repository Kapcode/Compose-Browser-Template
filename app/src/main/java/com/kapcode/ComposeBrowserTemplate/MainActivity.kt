package com.kapcode.ComposeBrowserTemplate
import android.annotation.SuppressLint
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

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            LearnWithAiTheme { // Or your app's theme
                // Here you would call your Composable
                HtmlViewerWithBottomControls()
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
    assetFileName: String,
    webViewClient: AccompanistWebViewClient,
    modifier: Modifier = Modifier // This modifier should have .weight(1f) from parent
) {
    // Log.d("HtmlAssetView", "Composing with asset: $assetFileName, Modifier has weight? (Check manually)")
    val assetUrl = "file:///android_asset/$assetFileName" // Check case sensitivity here again!
    // Log.d("HtmlAssetView", "Asset URL: $assetUrl")
    val webViewState = rememberWebViewState(url = assetUrl)

    // Add logging for WebViewClient callbacks if not already present
    // (onPageStarted, onPageFinished, onReceivedError)

    com.google.accompanist.web.WebView(
        state = webViewState,
        modifier = modifier, // <<<<< CRUCIAL: Use the passed-in modifier
        client = webViewClient,
        onCreated = { webView ->
             Log.d("HtmlAssetView", "WebView created for $assetFileName")
            webView.settings.javaScriptEnabled = true
            webView.settings.domStorageEnabled = true
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
fun HtmlViewerWithBottomControls() {
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
            modifier = Modifier.fillMaxSize().padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            Text("No HTML lessons found in assets.", textAlign = TextAlign.Center)
        }
        return
    }

    var currentFileIndex by rememberSaveable { mutableStateOf(0) }
    LaunchedEffect(htmlFiles) {
        if (currentFileIndex !in htmlFiles.indices && htmlFiles.isNotEmpty()) {
            currentFileIndex = 0
        }
    }

    val pageTitles = remember(htmlFiles) {
        htmlFiles.map { fileName -> formatFileNameAsTitle(fileName) }
    }



    // --- VV KEY CHANGES START HERE VV ---

    val customWebViewClient = remember(htmlFiles, currentFileIndex) { // Re-create if htmlFiles changes
        object : AccompanistWebViewClient() { // Or android.webkit.WebViewClient
            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val url = request?.url?.toString()
                Log.d("WebViewLinkClick", "Attempting to load URL: $url")

                if (url != null && url.startsWith("file:///android_asset/")) {
                    val clickedFileName = url.substringAfterLast('/')
                        .substringBefore("?") // Remove query parameters if any
                        .substringBefore("#")  // Remove fragment identifiers if any

                    val newIndex = htmlFiles.indexOf(clickedFileName)

                    if (newIndex != -1) {
                        Log.d("WebViewLinkClick", "Local asset: $clickedFileName found at index $newIndex")
                        if (currentFileIndex != newIndex) {
                            currentFileIndex = newIndex // << THE CRUCIAL STATE UPDATE
                        }
                        // Important: Return true to indicate you've handled the URL.
                        // The recomposition due to currentFileIndex changing will cause
                        // HtmlAssetView (thanks to its `key`) to load the new page.
                        return true
                    } else {
                        Log.w("WebViewLinkClick", "Local asset $clickedFileName not in known htmlFiles list.")
                        // If it's an asset but not in your managed list, you might decide
                        // to load it anyway, but currentFileIndex won't track it.
                        // For this use case, we probably want to return false or true
                        // without changing index if it's not part of the managed lessons.
                        // Returning false here would let WebView try, but it might navigate away
                        // from your managed flow.
                        return false // Or true if you want to block navigation to unmanaged local files
                    }
                }
                Log.d("WebViewLinkClick", "Not a recognized local asset link, letting WebView proceed (e.g., http link).")
                // Let the WebView handle other URLs (e.g., http, https, or mailto links)
                return false
            }

            // Optional: Deprecated version for compatibility if not relying solely on Accompanist's base
            @Deprecated("Use shouldOverrideUrlLoading(WebView, WebResourceRequest)", ReplaceWith("false"))
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                if (url != null && url.startsWith("file:///android_asset/")) {
                    val clickedFileName = url.substringAfterLast('/')
                        .substringBefore("?")
                        .substringBefore("#")
                    val newIndex = htmlFiles.indexOf(clickedFileName)
                    if (newIndex != -1) {
                        if (currentFileIndex != newIndex) {
                            currentFileIndex = newIndex
                        }
                        return true
                    }
                }
                return false
            }

            override fun onPageFinished(view: WebView, url: String?) {
                super.onPageFinished(view, url)
                Log.d("HtmlAssetView", "Page finished loading in WebView: $url")
                // You could also try to get the title from view.title here if needed for other purposes
            }
        }
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
                            var accumulatedDragX = 0f // Make sure this is correctly scoped if not already
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
                                        Log.d("SwipeDebug", "Column Dragging: $accumulatedDragX, changeId: ${change.id}")
                                    },
                                    onDragEnd = {
                                        val velocity = velocityTracker.calculateVelocity().x
                                        Log.d("SwipeDebug", "Column DragEnd: accumulatedDragX=$accumulatedDragX, velocity=$velocity")

                                        // Check your thresholds
                                        val absAccumulatedDragX = abs(accumulatedDragX)
                                        val absVelocity = abs(velocity)

                                        if (absAccumulatedDragX > swipeThresholdPx || absVelocity > velocityThresholdPx) {
                                            if (accumulatedDragX < 0 /* Swipe Left */) { // Simplified condition for clarity
                                                if (canGoNext) {
                                                    currentFileIndex++
                                                    Log.d("SwipeDebug", "Swiped Left to Next (Index: $currentFileIndex)")
                                                } else {
                                                    Log.d("SwipeDebug", "Swipe Left: Cannot go next.")
                                                }
                                            } else if (accumulatedDragX > 0 /* Swipe Right */) { // Simplified condition
                                                if (currentFileIndex > 0) {// Simplified condition fixed odd bug caused by canGoPrevious Quirk
                                                    currentFileIndex--
                                                    Log.d("SwipeDebug", "Swiped Right to Previous (Index: $currentFileIndex)")
                                                } else {
                                                    Log.d("SwipeDebug", "Swipe Right: Cannot go previous.")
                                                }
                                            }
                                        } else {
                                            Log.d("SwipeDebug", "Column DragEnd: Swipe below threshold.")
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



