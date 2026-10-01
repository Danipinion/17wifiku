package com.danipinion.sobatwiff.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.danipinion.sobatwiff.model.Notification
import com.danipinion.sobatwiff.ui.theme.*

@Composable
fun DashboardScreen(onLogout: () -> Unit = {}) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val sessionManager = remember { com.danipinion.sobatwiff.di.ServiceLocator.provideSessionManager(context) }
    val userRepository = remember { com.danipinion.sobatwiff.di.ServiceLocator.provideUserRepository(context) }
    
    val homeViewModel: com.danipinion.sobatwiff.ui.viewmodels.HomeViewModel = viewModel(
        factory = object : androidx.lifecycle.ViewModelProvider.Factory {
            override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
                return com.danipinion.sobatwiff.ui.viewmodels.HomeViewModel(userRepository) as T
            }
        }
    )

    val historyViewModel: com.danipinion.sobatwiff.ui.viewmodels.HistoryViewModel = viewModel(
        factory = object : androidx.lifecycle.ViewModelProvider.Factory {
            override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
                return com.danipinion.sobatwiff.ui.viewmodels.HistoryViewModel(userRepository) as T
            }
        }
    )
    val profileViewModel: com.danipinion.sobatwiff.ui.viewmodels.ProfileViewModel = viewModel(
        factory = object : androidx.lifecycle.ViewModelProvider.Factory {
            override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
                return com.danipinion.sobatwiff.ui.viewmodels.ProfileViewModel(userRepository) as T
            }
        }
    )
    
    val securityViewModel: com.danipinion.sobatwiff.ui.viewmodels.SecurityViewModel = viewModel(
        factory = object : androidx.lifecycle.ViewModelProvider.Factory {
            override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
                return com.danipinion.sobatwiff.ui.viewmodels.SecurityViewModel(userRepository) as T
            }
        }
    )

    val notificationViewModel: com.danipinion.sobatwiff.ui.viewmodels.NotificationViewModel = viewModel(
        factory = object : androidx.lifecycle.ViewModelProvider.Factory {
            override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
                return com.danipinion.sobatwiff.ui.viewmodels.NotificationViewModel(userRepository) as T
            }
        }
    )
    val referralViewModel: com.danipinion.sobatwiff.ui.viewmodels.ReferralViewModel = viewModel(
        factory = object : androidx.lifecycle.ViewModelProvider.Factory {
            override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
                return com.danipinion.sobatwiff.ui.viewmodels.ReferralViewModel(com.danipinion.sobatwiff.di.NetworkModule.apiService) as T
            }
        }
    )
    val routerViewModel: com.danipinion.sobatwiff.ui.viewmodels.RouterViewModel = viewModel(
        factory = object : androidx.lifecycle.ViewModelProvider.Factory {
            override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
                return com.danipinion.sobatwiff.ui.viewmodels.RouterViewModel(
                    com.danipinion.sobatwiff.di.NetworkModule.apiService,
                    com.danipinion.sobatwiff.util.WifiHelper(context)
                ) as T
            }
        }
    )
    
    var selectedTab by remember { mutableStateOf(DashboardTab.Home) }
    
    LaunchedEffect(selectedTab) {
        userRepository.updateActivity()
    }
    var showSpeedtest by remember { mutableStateOf(false) }
    var showReferral by remember { mutableStateOf(false) }
    var showNotifications by remember { mutableStateOf(false) }
    var showPayment by remember { mutableStateOf<String?>(null) }
    var showDataDiri by remember { mutableStateOf(false) }
    var showSecurity by remember { mutableStateOf(false) }
    var showNotificationSettings by remember { mutableStateOf(false) }
    var showHelp by remember { mutableStateOf(false) }
    var showPolicies by remember { mutableStateOf(false) }
    var showQrisInstructions by remember { mutableStateOf(false) }
    var showDevelopment by remember { mutableStateOf<String?>(null) }
    var selectedNotification by remember { mutableStateOf<com.danipinion.sobatwiff.data.remote.model.NotificationDto?>(null) }

    // --- Consolidated Back Navigation Management ---
    val isSubScreenVisible = showSpeedtest || showReferral || showNotifications || 
                            (showPayment != null) || showDataDiri || showSecurity || showNotificationSettings ||
                            showHelp || showPolicies || showQrisInstructions || selectedNotification != null || showDevelopment != null
    
    BackHandler(enabled = isSubScreenVisible || selectedTab != DashboardTab.Home) {
        when {
            showDataDiri -> showDataDiri = false
            showSecurity -> showSecurity = false
            showNotificationSettings -> showNotificationSettings = false
            showHelp -> showHelp = false
            showPolicies -> showPolicies = false
            showQrisInstructions -> showQrisInstructions = false
            selectedNotification != null -> {
                selectedNotification = null
                showNotifications = true
            }
            showNotifications -> showNotifications = false
            showSpeedtest -> showSpeedtest = false
            showReferral -> showReferral = false
            showPayment != null -> showPayment = null
            showDevelopment != null -> showDevelopment = null
            selectedTab != DashboardTab.Home -> selectedTab = DashboardTab.Home
        }
    }

    if (showSpeedtest) {
        SpeedtestScreen(onBack = { showSpeedtest = false })
        return
    }

    if (showReferral) {
        ReferralScreen(
            viewModel = referralViewModel,
            onBack = { showReferral = false }
        )
        return
    }

    if (!showPayment.isNullOrEmpty()) {
        val paymentViewModel: com.danipinion.sobatwiff.ui.viewmodels.PaymentViewModel = viewModel(
            factory = object : androidx.lifecycle.ViewModelProvider.Factory {
                override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
                    return com.danipinion.sobatwiff.ui.viewmodels.PaymentViewModel(userRepository) as T
                }
            }
        )
        PaymentScreen(
            invoiceId = showPayment!!,
            viewModel = paymentViewModel,
            onBack = { showPayment = null },
            onFinish = {
                showPayment = null
                historyViewModel.fetchInvoices() // Refresh history after payment is done
            }
        )
        return
    }

    if (showDataDiri) {
        DataDiriScreen(
            viewModel = profileViewModel,
            onBack = { showDataDiri = false }
        )
        return
    }

    if (showSecurity) {
        SecurityScreen(
            viewModel = securityViewModel,
            onBack = { showSecurity = false }
        )
        return
    }

    if (showNotificationSettings) {
        NotificationSettingsScreen(
            viewModel = notificationViewModel,
            onBack = { showNotificationSettings = false }
        )
        return
    }

    if (showHelp) {
        HelpSupportScreen(onBack = { showHelp = false })
        return
    }

    if (showPolicies) {
        PrivacyPolicyScreen(onBack = { showPolicies = false })
        return
    }

    if (showQrisInstructions) {
        QrisInstructionScreen(onBack = { showQrisInstructions = false })
        return
    }

    if (showNotifications) {
        NotificationScreen(
            viewModel = notificationViewModel,
            onBack = { showNotifications = false },
            onNotificationClick = { 
                selectedNotification = it 
                showNotifications = false
            }
        )
        return
    }

    selectedNotification?.let {
        NotificationDetailScreen(
            notification = it,
            onBack = { 
                selectedNotification = null
                showNotifications = true
            },
            onMarkRead = { id -> notificationViewModel.markAsRead(id) },
            onDelete = { id -> notificationViewModel.deleteNotification(id) }
        )
        return
    }

    showDevelopment?.let { title ->
        DevelopmentScreen(
            title = title,
            onBack = { showDevelopment = null }
        )
        return
    }

    Scaffold(
        bottomBar = {
            CustomBottomNavigation(
                selectedTab = selectedTab,
                onTabSelected = { selectedTab = it }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = paddingValues.calculateBottomPadding())
        ) {
            when (selectedTab) {
                DashboardTab.Home -> HomeScreen(
                    viewModel = homeViewModel,
                    notificationViewModel = notificationViewModel,
                    onNavigateToSpeedtest = { showSpeedtest = true },
                    onNavigateToReferral = { showReferral = true },
                    onNavigateToNotifications = { showNotifications = true },
                    onNavigateToPayment = { invoiceId: String -> showPayment = invoiceId },
                    routerViewModel = routerViewModel
                )
                DashboardTab.Router -> RouterScreen(
                    viewModel = routerViewModel,
                    onNavigateToDevelopment = { showDevelopment = it }
                )
                DashboardTab.History -> HistoryScreen(
                    viewModel = historyViewModel,
                    onNavigateToPayment = { invoiceId: String -> showPayment = invoiceId }
                )
                DashboardTab.Profile -> ProfileScreen(
                    name = homeViewModel.userProfile?.name ?: "User",
                    customerId = homeViewModel.userProfile?.idNumber ?: homeViewModel.userProfile?.id?.takeLast(8)?.uppercase() ?: "---",
                    isRefreshing = homeViewModel.isLoading,
                    onRefresh = { 
                        homeViewModel.loadData()
                        notificationViewModel.fetchNotifications()
                    },
                    onNavigateToEditProfile = { showDataDiri = true },
                    onNavigateToSecurity = { showSecurity = true },
                    onNavigateToNotifications = { showNotificationSettings = true },
                    onNavigateToPolicies = { showPolicies = true },
                    onNavigateToHelp = { showHelp = true },
                    onNavigateToQris = { showQrisInstructions = true },
                    onLogout = onLogout
                )
            }
        }
    }
}

@Composable
fun CustomBottomNavigation(
    selectedTab: DashboardTab,
    onTabSelected: (DashboardTab) -> Unit
) {
    val tabs = DashboardTab.entries
    val selectedIndex = tabs.indexOf(selectedTab)

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(SurfaceBlue)
            .windowInsetsPadding(WindowInsets.navigationBars)
            .height(72.dp)
    ) {
        // Sliding Background Indicator (Limited to Icon Area)
        BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
            val tabWidth = maxWidth / tabs.size
            val animatedOffset by animateDpAsState(
                targetValue = tabWidth * selectedIndex,
                animationSpec = spring(dampingRatio = Spring.DampingRatioLowBouncy, stiffness = Spring.StiffnessLow),
                label = "indicator"
            )

            Box(
                modifier = Modifier
                    .offset(x = animatedOffset)
                    .width(tabWidth)
                    .padding(top = 8.dp), // Position behind icon
                contentAlignment = Alignment.TopCenter
            ) {
                Box(
                    modifier = Modifier
                        .height(36.dp)
                        .width(64.dp)
                        .clip(RoundedCornerShape(18.dp))
                        .background(BluePrimary.copy(alpha = 0.15f)) // Softer background as pill
                )
            }
        }

        Row(
            modifier = Modifier.fillMaxSize(),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            tabs.forEach { tab ->
                val isSelected = selectedTab == tab
                
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null,
                            onClick = { onTabSelected(tab) }
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Box(
                            modifier = Modifier.height(36.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (isSelected) tab.filledIcon else tab.outlinedIcon,
                                contentDescription = tab.label,
                                tint = if (isSelected) BluePrimary else TextLocked,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                        
                        AnimatedVisibility(
                            visible = isSelected,
                            enter = fadeIn() + expandVertically(),
                            exit = fadeOut() + shrinkVertically()
                        ) {
                            Text(
                                text = tab.label,
                                color = BluePrimary,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(top = 2.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PlaceholderScreen(title: String) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundBlue),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                imageVector = Icons.Default.Construction,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = BluePrimary.copy(alpha = 0.3f)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Halaman $title",
                color = TextMedium,
                fontSize = 18.sp,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = "Sedang dalam tahap pengembangan",
                color = TextLocked,
                fontSize = 14.sp
            )
        }
    }
}

enum class DashboardTab(
    val label: String,
    val outlinedIcon: ImageVector,
    val filledIcon: ImageVector
) {
    Home("Home", Icons.Outlined.Home, Icons.Filled.Home),
    Router("Router", Icons.Outlined.Router, Icons.Filled.Router),
    History("History", Icons.Outlined.History, Icons.Filled.History),
    Profile("Profile", Icons.Outlined.Person, Icons.Filled.Person)
}
