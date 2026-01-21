package com.medication.system

import android.os.Bundle
import android.view.View
import android.content.Intent
import android.widget.Button
import android.widget.ProgressBar
import android.widget.Toast
import android.net.http.SslError
import android.net.Uri
import android.app.Activity
import android.content.ActivityNotFoundException
import androidx.appcompat.app.AppCompatActivity
import android.webkit.*
import org.json.JSONArray
import android.Manifest
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private val FILE_CHOOSER_RESULT_CODE = 1

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.anatomyWebView)
        progressBar = findViewById(R.id.progressBar)
        
        findViewById<Button>(R.id.btnOpenChat).setOnClickListener {
            startActivity(Intent(this, ChatActivity::class.java))
        }

        setupWebView()
        requestPermissions()
    }

    private fun requestPermissions() {
        val permissions = mutableListOf(Manifest.permission.CAMERA)
        
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.READ_MEDIA_IMAGES)
            permissions.add(Manifest.permission.READ_MEDIA_VIDEO)
        } else {
            permissions.add(Manifest.permission.READ_EXTERNAL_STORAGE)
            permissions.add(Manifest.permission.WRITE_EXTERNAL_STORAGE)
        }

        val listPermissionsNeeded = mutableListOf<String>()
        for (p in permissions) {
            if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
                listPermissionsNeeded.add(p)
            }
        }
        if (listPermissionsNeeded.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, listPermissionsNeeded.toTypedArray(), 100)
        }
    }

    private fun setupWebView() {
        webView = findViewById(R.id.anatomyWebView)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.allowFileAccess = true
        webView.settings.allowContentAccess = true
        
        // Spoof User-Agent to bypass Google's 'disallowed_useragent' block
        webView.settings.userAgentString = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36"
        
        webView.addJavascriptInterface(object : Any() {
            @JavascriptInterface
            fun onBridgeReady() {
                runOnUiThread {
                    Toast.makeText(this@MainActivity, "3D Biological Interface Online", Toast.LENGTH_SHORT).show()
                }
            }

            @JavascriptInterface
            fun onMeshSelected(meshName: String) {
                runOnUiThread {
                    Toast.makeText(this@MainActivity, "Selected: $meshName", Toast.LENGTH_LONG).show()
                }
            }

            @JavascriptInterface
            fun triggerFilePicker() {
                runOnUiThread {
                    Toast.makeText(this@MainActivity, "Manual Picker Triggered", Toast.LENGTH_SHORT).show()
                    // This forces the file picker to open even if the HTML input fails
                    // However, we need a way to pass the callback back. 
                    // This is harder via JS bridge, so we'll sticking to the HTML input fix.
                }
            }
        }, "AndroidApp")

        webView.loadUrl("https://medication-system.vercel.app/?portal=patient")

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                progressBar.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                progressBar.visibility = View.GONE
                syncAnatomyState()
                
                // Localtunnel Bypass Script: Automatically click the 'Click to Continue' button if present
                webView.evaluateJavascript("""
                    (function() {
                        const btns = document.querySelectorAll('button, a');
                        for (let b of btns) {
                            if (b.innerText.toLowerCase().includes('click to continue')) {
                                b.click();
                            }
                        }
                    })();
                """.trimIndent(), null)
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                progressBar.visibility = View.GONE
                Toast.makeText(this@MainActivity, "Connection Error: Check if server is running", Toast.LENGTH_LONG).show()
            }

            override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler?, error: SslError?) {
                handler?.proceed()
            }
        }

        // Handle JS Alerts, Console, and File Chooser
        webView.webChromeClient = object : WebChromeClient() {
            override fun onJsAlert(
                view: WebView?,
                url: String?,
                message: String?,
                result: JsResult?
            ): Boolean {
                runOnUiThread {
                    Toast.makeText(this@MainActivity, "JS Alert: $message", Toast.LENGTH_LONG).show()
                }
                result?.confirm()
                return true
            }

            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                val msg = consoleMessage?.message() ?: ""
                if (msg.contains("DEBUG") || msg.contains("Error")) {
                    runOnUiThread {
                        Toast.makeText(this@MainActivity, "Web: $msg", Toast.LENGTH_SHORT).show()
                    }
                }
                return true
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                runOnUiThread {
                    Toast.makeText(this@MainActivity, "📎 Neural Link: Opening File Selector...", Toast.LENGTH_SHORT).show()
                }
                
                if (this@MainActivity.filePathCallback != null) {
                    this@MainActivity.filePathCallback?.onReceiveValue(null)
                }
                this@MainActivity.filePathCallback = filePathCallback

                val contentIntent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "*/*"
                    val mimetypes = arrayOf("image/*", "application/pdf")
                    putExtra(Intent.EXTRA_MIME_TYPES, mimetypes)
                }

                val chooserIntent = Intent(Intent.ACTION_CHOOSER).apply {
                    putExtra(Intent.EXTRA_INTENT, contentIntent)
                    putExtra(Intent.EXTRA_TITLE, "Select Medical File")
                }

                try {
                    startActivityForResult(chooserIntent, FILE_CHOOSER_RESULT_CODE)
                } catch (e: Exception) {
                    this@MainActivity.filePathCallback?.onReceiveValue(null)
                    this@MainActivity.filePathCallback = null
                    runOnUiThread {
                        Toast.makeText(this@MainActivity, "❌ Permission or System Error. Please check settings.", Toast.LENGTH_LONG).show()
                    }
                    return false
                }
                return true
            }

            override fun onPermissionRequest(request: PermissionRequest?) {
                runOnUiThread {
                    Toast.makeText(this@MainActivity, "Neural Link: Granting Web Permissions", Toast.LENGTH_SHORT).show()
                }
                request?.grant(request?.resources)
            }
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == FILE_CHOOSER_RESULT_CODE) {
            if (filePathCallback == null) {
                runOnUiThread {
                    Toast.makeText(this@MainActivity, "⚠️ File Picker: System callback lost", Toast.LENGTH_SHORT).show()
                }
                return
            }
            val results = WebChromeClient.FileChooserParams.parseResult(resultCode, data)
            if (results != null) {
                runOnUiThread {
                    Toast.makeText(this@MainActivity, "✅ File Selected Successfully", Toast.LENGTH_SHORT).show()
                }
            } else {
                runOnUiThread {
                    Toast.makeText(this@MainActivity, "⚠️ No file selected", Toast.LENGTH_SHORT).show()
                }
            }
            filePathCallback?.onReceiveValue(results)
            filePathCallback = null
        }
    }

    private fun syncAnatomyState() {
        val markers = JSONArray() 
        val highlights = JSONArray()
        webView.evaluateJavascript("window.updateAnatomy('$markers', '$highlights')", null)
    }
}
