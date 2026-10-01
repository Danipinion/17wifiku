package com.danipinion.sobatwiff.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.Date

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "session_prefs")

class SessionManager(private val context: Context) {

    companion object {
        private val TOKEN_KEY = stringPreferencesKey("auth_token")
        private val LOGIN_TIME_KEY = longPreferencesKey("login_time")
        private val USER_ID_KEY = stringPreferencesKey("user_id")
        private val USER_NAME_KEY = stringPreferencesKey("user_name")
        private val SAVED_IDENTIFIER = stringPreferencesKey("saved_identifier")
        private val REMEMBER_ME_KEY = booleanPreferencesKey("remember_me")
        private val FAILED_ATTEMPTS_KEY = intPreferencesKey("failed_attempts")
        private val BLOCK_EXPIRY_KEY = longPreferencesKey("block_expiry")
        private val LAST_PROCESSED_ID_KEY = intPreferencesKey("last_processed_gotify_id")
        private val HAS_SEEN_ONBOARDING = booleanPreferencesKey("has_seen_onboarding")
  // private val SESSION_DURATION = 15 * 60 * 1000 // Removed session timeout
    }

    suspend fun setHasSeenOnboarding(seen: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[HAS_SEEN_ONBOARDING] = seen
        }
    }

    val hasSeenOnboarding: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[HAS_SEEN_ONBOARDING] ?: false
    }

    suspend fun saveSession(token: String, userId: String, userName: String) {
        context.dataStore.edit { preferences ->
            preferences[TOKEN_KEY] = token
            preferences[LOGIN_TIME_KEY] = System.currentTimeMillis()
            preferences[USER_ID_KEY] = userId
            preferences[USER_NAME_KEY] = userName
        }
    }

    val authToken: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[TOKEN_KEY]
    }

    val isSessionValid: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[TOKEN_KEY] != null
    }

    suspend fun clearSession() {
        context.dataStore.edit { preferences ->
            // Only clear session-specific data, keep remember-me and onboarding status
            preferences.remove(TOKEN_KEY)
            preferences.remove(LOGIN_TIME_KEY)
            preferences.remove(USER_ID_KEY)
            preferences.remove(USER_NAME_KEY)
        }
    }

    suspend fun updateActivity() {
        context.dataStore.edit { preferences ->
            if (preferences[TOKEN_KEY] != null) {
                preferences[LOGIN_TIME_KEY] = System.currentTimeMillis()
            }
        }
    }

    suspend fun saveRememberMe(enabled: Boolean, identifier: String?) {
        context.dataStore.edit { preferences ->
            preferences[REMEMBER_ME_KEY] = enabled
            if (enabled && identifier != null) {
                preferences[SAVED_IDENTIFIER] = identifier
            } else {
                preferences.remove(SAVED_IDENTIFIER)
            }
        }
    }

    val rememberMe: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[REMEMBER_ME_KEY] ?: false
    }

    val savedIdentifier: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[SAVED_IDENTIFIER]
    }

    suspend fun incrementFailedAttempts() {
        context.dataStore.edit { preferences ->
            val attempts = (preferences[FAILED_ATTEMPTS_KEY] ?: 0) + 1
            preferences[FAILED_ATTEMPTS_KEY] = attempts
            
            if (attempts >= 5) {
                val baseBlockMillis = 30L * 60L * 1000L
                val multiplier = (attempts - 4).toLong()
                val blockDuration = baseBlockMillis * multiplier
                preferences[BLOCK_EXPIRY_KEY] = System.currentTimeMillis() + blockDuration
            }
        }
    }

    suspend fun resetFailedAttempts() {
        context.dataStore.edit { preferences ->
            preferences[FAILED_ATTEMPTS_KEY] = 0
            preferences[BLOCK_EXPIRY_KEY] = 0L
        }
    }

    val failedAttempts: Flow<Int> = context.dataStore.data.map { preferences ->
        preferences[FAILED_ATTEMPTS_KEY] ?: 0
    }

    val userId: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[USER_ID_KEY]
    }

    val blockExpiry: Flow<Long> = context.dataStore.data.map { preferences ->
        preferences[BLOCK_EXPIRY_KEY] ?: 0L
    }

    val lastProcessedId: Flow<Int> = context.dataStore.data.map { preferences ->
        preferences[LAST_PROCESSED_ID_KEY] ?: 0
    }

    suspend fun setLastProcessedId(id: Int) {
        context.dataStore.edit { preferences ->
            preferences[LAST_PROCESSED_ID_KEY] = id
        }
    }
}
