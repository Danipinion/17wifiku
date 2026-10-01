package com.danipinion.sobatwiff.di

import android.content.Context
import com.danipinion.sobatwiff.data.local.SessionManager
import com.danipinion.sobatwiff.data.remote.ApiService
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object NetworkModule {
    const val BASE_URL = "https://billing.tokomulya.my.id/api/"
    // const val BASE_URL = "http://localhost:3000/api/"

    private fun provideLoggingInterceptor() = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private fun provideAuthInterceptor(sessionManager: SessionManager) = Interceptor { chain ->
        val token = runBlocking { sessionManager.authToken.first() }
        val request = chain.request().newBuilder()
        if (token != null) {
            request.addHeader("Authorization", "Bearer $token")
        }
        chain.proceed(request.build())
    }

    fun provideApiService(sessionManager: SessionManager): ApiService {
        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(provideLoggingInterceptor())
            .addInterceptor(provideAuthInterceptor(sessionManager))
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()

        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }

    // Lazy initialization for non-auth requests if needed, but we'll mostly use the one with SessionManager
    lateinit var apiService: ApiService
        private set

    fun init(context: Context) {
        val sessionManager = SessionManager(context)
        apiService = provideApiService(sessionManager)
    }
}
