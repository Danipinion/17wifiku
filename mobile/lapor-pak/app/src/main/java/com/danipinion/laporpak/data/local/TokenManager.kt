package com.danipinion.laporpak.data.local

import android.content.Context
import android.content.SharedPreferences
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TokenManager @Inject constructor(@ApplicationContext context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("lapor_pak_prefs", Context.MODE_PRIVATE)

    fun saveToken(token: String) {
        prefs.edit().putString("jwt_token", token).apply()
    }

    fun getToken(): String? {
        return prefs.getString("jwt_token", null)
    }

    fun clearToken() {
        prefs.edit().remove("jwt_token").apply()
    }

    fun saveRememberMe(identifier: String, pass: String) {
        prefs.edit()
            .putString("remembered_identifier", identifier)
            .putString("remembered_password", pass)
            .apply()
    }

    fun getRememberedIdentifier(): String {
        return prefs.getString("remembered_identifier", "") ?: ""
    }

    fun getRememberedPassword(): String {
        return prefs.getString("remembered_password", "") ?: ""
    }

    fun clearRememberMe() {
        prefs.edit()
            .remove("remembered_identifier")
            .remove("remembered_password")
            .apply()
    }
}
