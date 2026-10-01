package com.danipinion.laporpak.ui.navigation

sealed class Screen(val route: String) {
    object Splash : Screen("splash")
    object Login : Screen("login")
    object Main : Screen("main")
    
    // Bottom Nav Screens
    object Home : Screen("home")
    object SubmitJob : Screen("submit_job?jobId={jobId}") {
        fun createRoute(jobId: String? = null) = if (jobId != null) "submit_job?jobId=$jobId" else "submit_job"
    }
    object History : Screen("history")
}
