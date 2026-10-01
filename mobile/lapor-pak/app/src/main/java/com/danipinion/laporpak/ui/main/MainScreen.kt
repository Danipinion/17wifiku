package com.danipinion.laporpak.ui.main

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.navigation.*
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.*
import com.danipinion.laporpak.ui.history.HistoryScreen
import com.danipinion.laporpak.ui.home.HomeScreen
import com.danipinion.laporpak.ui.navigation.Screen
import com.danipinion.laporpak.ui.submit_job.SubmitJobScreen

sealed class BottomNavItem(val title: String, val icon: ImageVector, val route: String) {
    object Home : BottomNavItem("Home", Icons.Default.Home, Screen.Home.route)
    object AddJob : BottomNavItem("Lapor", Icons.Default.Add, Screen.SubmitJob.createRoute())
    object History : BottomNavItem("History", Icons.AutoMirrored.Filled.List, Screen.History.route)
}

@Composable
fun MainScreen(
    modifier: Modifier = Modifier,
    onLogout: () -> Unit = {}
) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination
    
    val items = listOf(
        BottomNavItem.Home,
        BottomNavItem.AddJob,
        BottomNavItem.History
    )

    Scaffold(
        modifier = modifier,
        bottomBar = {
            NavigationBar(
                containerColor = androidx.compose.ui.graphics.Color.White,
                tonalElevation = 8.dp
            ) {
                items.forEach { item ->
                    val isSelected = currentDestination?.route?.contains(item.route.substringBefore("?")) == true
                    
                    NavigationBarItem(
                        icon = { 
                            Icon(
                                imageVector = item.icon, 
                                contentDescription = item.title,
                                tint = if (isSelected) androidx.compose.ui.graphics.Color(0xFF0D47A1) else androidx.compose.ui.graphics.Color.Gray
                            ) 
                        },
                        label = { 
                            Text(
                                text = item.title,
                                fontWeight = if (isSelected) androidx.compose.ui.text.font.FontWeight.Bold else androidx.compose.ui.text.font.FontWeight.Normal,
                                color = if (isSelected) androidx.compose.ui.graphics.Color(0xFF0D47A1) else androidx.compose.ui.graphics.Color.Gray
                            ) 
                        },
                        selected = isSelected,
                        onClick = {
                            if (!isSelected) {
                                navController.navigate(item.route) {
                                    navController.graph.startDestinationRoute?.let { route ->
                                        popUpTo(route) {
                                            saveState = true
                                        }
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        },
                        colors = NavigationBarItemDefaults.colors(
                            indicatorColor = androidx.compose.ui.graphics.Color(0xFFE3F2FD)
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Home.route,
            modifier = Modifier.padding(bottom = innerPadding.calculateBottomPadding()),
            enterTransition = { androidx.compose.animation.EnterTransition.None },
            exitTransition = { androidx.compose.animation.ExitTransition.None },
            popEnterTransition = { androidx.compose.animation.EnterTransition.None },
            popExitTransition = { androidx.compose.animation.ExitTransition.None }
        ) {
            composable(Screen.Home.route) {
                HomeScreen(
                    onLogout = onLogout,
                    onTaskClick = { jobId ->
                        navController.navigate(Screen.SubmitJob.createRoute(jobId)) {
                            // Ensure we don't build a huge backstack
                            launchSingleTop = true
                        }
                    }
                )
            }
            composable(
                route = Screen.SubmitJob.route,
                arguments = listOf(
                    androidx.navigation.navArgument("jobId") {
                        type = androidx.navigation.NavType.StringType
                        nullable = true
                        defaultValue = null
                    }
                )
            ) { backStackEntry ->
                val jobId = backStackEntry.arguments?.getString("jobId")
                SubmitJobScreen(jobId = jobId)
            }
            composable(Screen.History.route) {
                HistoryScreen()
            }
        }
    }
}
