package com.medication.system

import android.os.Bundle
import android.webkit.*
import androidx.appcompat.app.AppCompatActivity
import android.widget.Toast
import org.json.JSONArray

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

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
                    // Here you can trigger Gemini analysis via ClinicalApiService
                }
            }
        }, "AndroidApp")

        // Point to your hosted web application with the ?mobile=true flag
        // Replace with your actual local IP (e.g., http://10.0.2.2:5173 for emulator vs localhost)
        webView.loadUrl("http://10.0.2.2:5173/?mobile=true")

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                syncAnatomyState()
            }
        }
    }

    private fun syncAnatomyState() {
        // Example: Push markers from Kotlin to JS
        val markers = JSONArray() // Fetch this from your Supabase/Python API
        val highlights = JSONArray()
        
        webView.evaluateJavascript("window.updateAnatomy('$markers', '$highlights')", null)
    }
}
