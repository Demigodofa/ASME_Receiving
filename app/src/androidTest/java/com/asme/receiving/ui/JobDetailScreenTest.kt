package com.asme.receiving.ui

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.test.core.app.ApplicationProvider
import com.asme.receiving.AppContextHolder
import com.asme.receiving.data.JobItem
import com.asme.receiving.data.JobRepository
import com.asme.receiving.data.local.AppDatabaseProvider
import kotlinx.coroutines.runBlocking
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import java.io.File

class JobDetailScreenTest {

    @get:Rule
    val composeRule = createComposeRule()

    @Before
    fun setup() {
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()
        AppContextHolder.init(context)
        AppDatabaseProvider.resetForTests()
        File(context.getDatabasePath("material_guardian.db").path).delete()
        runBlocking {
            JobRepository().upsert(JobItem(jobNumber = "JOB-88", description = "Detail test"))
        }
    }

    @Test
    fun jobDetailShowsExportAndAddButtons() {
        composeRule.setContent {
            JobDetailScreen(
                jobNumber = "JOB-88",
                onNavigateBack = {},
                onAddMaterial = {},
                onJobRenamed = {}
            )
        }

        composeRule.onNodeWithText("Export Job").assertIsDisplayed()
        composeRule.onNodeWithText("Add Receiving Report").assertIsDisplayed()
    }
}
