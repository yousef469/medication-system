package com.medication.system

import android.os.Bundle
import android.view.View
import android.content.Intent
import android.widget.Button
import android.widget.ProgressBar
import android.widget.Toast
import android.net.http.SslError
import androidx.appcompat.app.AppCompatActivity
import android.webkit.*
import org.json.JSONArray

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar

    // Change this to your Computer's Local IP (e.g., 192.168.1.5) if testing on a physical phone!
    private val BASE_URL = "https://sharp-clouds-decide.loca.lt" 

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
        
        // The Bridge: Connects JS 'AndroidApp' to this class
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

        // Point to your hosted web application (Load full Patient Portal)
        webView.loadUrl("$BASE_URL/")

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
                Toast.makeText(this@MainActivity, "Connection Error: Check if server is running at $BASE_URL", Toast.LENGTH_LONG).show()
            }

            override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler?, error: SslError?) {
                handler?.proceed()
            }
        }
    }

    private fun syncAnatomyState() {
        // Example: Push markers from Kotlin to JS
        val markers = JSONArray() 
        val highlights = JSONArray()
        
        webView.evaluateJavascript("window.updateAnatomy('$markers', '$highlights')", null)
    }
}
