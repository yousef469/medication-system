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
        }, "AndroidApp")

        webView.loadUrl("https://medication-system.vercel.app/?portal=patient")

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                progressBar.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                progressBar.visibility = View.GONE
                syncAnatomyState()
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                progressBar.visibility = View.GONE
                Toast.makeText(this@MainActivity, "Connection Error: Check if server is running", Toast.LENGTH_LONG).show()
            }

            override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler?, error: SslError?) {
                handler?.proceed()
            }
        }

        // Handle File Chooser (Crucial for Uploads)
        webView.webChromeClient = object : WebChromeClient() {
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

                // Try standard Params Intent
                var intent = fileChooserParams?.createIntent()
                
                // Fallback Intent if params fail (often more robust on older Android)
                if (intent == null) {
                    intent = Intent(Intent.ACTION_GET_CONTENT)
                    intent.addCategory(Intent.CATEGORY_OPENABLE)
                    intent.type = "*/*"
                }

                try {
                    startActivityForResult(intent!!, FILE_CHOOSER_RESULT_CODE)
                } catch (e: Exception) {
                    this@MainActivity.filePathCallback = null
                    runOnUiThread {
                        Toast.makeText(this@MainActivity, "❌ Error: Cannot open file gallery", Toast.LENGTH_LONG).show()
                    }
                    return false
                }
                return true
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
