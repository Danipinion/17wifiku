package com.danipinion.sobatwiff

import android.app.Application
import com.danipinion.sobatwiff.di.DatabaseModule

class SobatMulyaApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Initialize Database Singleton
        DatabaseModule.initialize(this)
        // Initialize Network Singleton
        com.danipinion.sobatwiff.di.NetworkModule.init(this)
    }
}
