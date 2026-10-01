package com.danipinion.sobatwiff.di

import android.content.Context
import com.danipinion.sobatwiff.data.local.AppDatabase
import com.danipinion.sobatwiff.data.local.UserDao

object DatabaseModule {
    private var database: AppDatabase? = null

    fun initialize(context: Context) {
        if (database == null) {
            database = AppDatabase.getDatabase(context)
        }
    }

    val userDao: UserDao
        get() = database?.userDao() ?: throw IllegalStateException("Database not initialized. Call initialize(context) first.")
}
