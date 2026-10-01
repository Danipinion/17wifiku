package com.danipinion.laporpak.domain.model

data class VersionResponse(
    val versionCode: Int,
    val versionName: String,
    val downloadUrl: String,
    val forceUpdate: Boolean,
    val releaseNotes: String
)
