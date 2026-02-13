package com.medication.system

import android.os.Bundle
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import org.json.JSONObject

class ChatActivity : AppCompatActivity() {

    private lateinit var chatRecyclerView: RecyclerView
    private lateinit var messageInput: EditText
    private lateinit var sendButton: Button
    private lateinit var progressBar: ProgressBar
    
    private val apiService = ClinicalApiService()
    private val messages = mutableListOf<ClinicalChatMessage>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_chat)

        chatRecyclerView = findViewById(R.id.chatRecyclerView)
        messageInput = findViewById(R.id.messageInput)
        sendButton = findViewById(R.id.sendButton)
        progressBar = findViewById(R.id.chatProgress)

        setupRecyclerView()

        sendButton.setOnClickListener {
            val text = messageInput.text.toString()
            if (text.isNotBlank()) {
                sendMessage(text)
            }
        }
    }

    private fun setupRecyclerView() {
        chatRecyclerView.layoutManager = LinearLayoutManager(this)
        // In a real app, you'd use a dedicated Adapter class here
    }

    private fun sendMessage(text: String) {
        // Add user message to UI
        messages.add(ClinicalChatMessage(text, true))
        messageInput.setText("")
        
        progressBar.visibility = View.VISIBLE
        
        apiService.analyzeClinicalRequest(text) { responseJson ->
            runOnUiThread {
                progressBar.visibility = View.GONE
                if (responseJson != null) {
                    try {
                        val obj = JSONObject(responseJson)
                        val aiContent = obj.optString("analysis", "Consultation complete.")
                        messages.add(ClinicalChatMessage(aiContent, false))
                        // Notify adapter here
                        Toast.makeText(this@ChatActivity, "Gemini analysis received", Toast.LENGTH_SHORT).show()
                    } catch (e: Exception) {
                        Toast.makeText(this@ChatActivity, "Error parsing AI response", Toast.LENGTH_SHORT).show()
                    }
                } else {
                    Toast.makeText(this@ChatActivity, "Connection Failed", Toast.LENGTH_LONG).show()
                }
            }
        }
    }
}
