package com.danipinion.sobatwiff.model

import androidx.annotation.Keep
import com.google.gson.annotations.SerializedName

@Keep
data class GotifyMessage(
    @SerializedName("id") val id: Int,
    @SerializedName("appid") val appid: Int,
    @SerializedName("message") val message: String,
    @SerializedName("title") val title: String,
    @SerializedName("priority") val priority: Int,
    @SerializedName("extras") val extras: Map<String, Any>? = null,
    @SerializedName("date") val date: String
)
