package com.danipinion.sobatwiff.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "user_cache")
data class UserCache(
    @PrimaryKey val id: String,
    val idNumber: String?,
    val name: String,
    val phone: String,
    val role: String,
    val abonemen: Float,
    val address: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val notifBilling: Boolean = true,
    val notifPromo: Boolean = true,
    val lastSync: Long = System.currentTimeMillis()
)
