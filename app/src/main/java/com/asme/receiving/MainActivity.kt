package com.asme.receiving

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.*
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.asme.receiving.ui.JobDetailScreen
import com.asme.receiving.ui.JobsScreen
import com.asme.receiving.ui.MaterialFormScreen
import com.asme.receiving.ui.SplashScreen
import com.asme.receiving.ui.theme.MaterialGuardianTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MaterialGuardianTheme {
                AppNavigation()
            }
        }
    }
}

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    var showSplash by remember { mutableStateOf(true) }

    if (showSplash) {
        SplashScreen(onTimeout = { showSplash = false })
    } else {
        NavHost(
            navController = navController,
            startDestination = "jobs"
        ) {
            composable("jobs") {
                JobsScreen(
                    onJobClick = { jobNumber ->
                        navController.navigate("job_detail/$jobNumber")
                    }
                )
            }

            composable("job_detail/{jobNumber}") { backStackEntry ->
                val jobNumber = backStackEntry.arguments?.getString("jobNumber") ?: ""
                JobDetailScreen(
                    jobNumber = jobNumber,
                    onNavigateBack = { navController.popBackStack() },
                    onAddMaterial = { targetJob ->
                        navController.navigate("material_form/$targetJob")
                    },
                    onJobRenamed = { newJob ->
                        navController.navigate("job_detail/$newJob") {
                            popUpTo("job_detail/$jobNumber") { inclusive = true }
                        }
                    }
                )
            }

            composable("material_form/{jobNumber}") { backStackEntry ->
                val jobNumber = backStackEntry.arguments?.getString("jobNumber") ?: ""
                MaterialFormScreen(
                    jobNumber = jobNumber,
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }
    }
}
