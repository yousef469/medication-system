package com.medication.system

import okhttp3.*
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException

class ClinicalApiService {

    private val client = OkHttpClient()
    private val BASE_URL = "http://10.0.2.2:8001" // Local server for Android Emulator

    fun analyzeClinicalRequest(text: String, callback: (String?) -> Unit) {
        val formBody = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart("request_text", text)
            .addFormDataPart("history_json", "[]")
            .build()

        val request = Request.Builder()
            .url("$BASE_URL/api/analyze_clinical_request")
            .post(formBody)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback(null)
            }

            override fun onResponse(call: Call, response: Response) {
                if (response.isSuccessful) {
                    callback(response.body?.string())
                } else {
                    callback(null)
                }
            }
        })
    }
}
