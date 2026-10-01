package com.danipinion.sobatwiff.di

import com.danipinion.sobatwiff.data.local.SessionManager
import com.danipinion.sobatwiff.data.local.UserDao
import com.danipinion.sobatwiff.data.repository.UserRepository
import android.content.Context

object ServiceLocator {
    private var userRepository: UserRepository? = null
    private var sessionManager: SessionManager? = null

    fun provideUserRepository(context: Context): UserRepository {
        return userRepository ?: synchronized(this) {
            val repo = UserRepository(
                context,
                NetworkModule.apiService,
                DatabaseModule.userDao,
                provideSessionManager(context)
            )
            userRepository = repo
            repo
        }
    }

    fun provideSessionManager(context: Context): SessionManager {
        return sessionManager ?: synchronized(this) {
            val manager = SessionManager(context)
            sessionManager = manager
            manager
        }
    }
}
