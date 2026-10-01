package com.danipinion.sobatwiff.di

import android.content.Context
import com.danipinion.sobatwiff.data.local.SessionManager
import com.danipinion.sobatwiff.data.repository.UserRepository

object RepositoryModule {
    private var userRepository: UserRepository? = null

    fun provideUserRepository(context: Context): UserRepository {
        return userRepository ?: synchronized(this) {
            val repo = UserRepository(
                context,
                NetworkModule.apiService,
                DatabaseModule.userDao,
                SessionManager(context)
            )
            userRepository = repo
            repo
        }
    }
}
