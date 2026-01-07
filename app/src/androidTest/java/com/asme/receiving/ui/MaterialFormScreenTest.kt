package com.asme.receiving.ui

import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.test.core.app.ApplicationProvider
import com.asme.receiving.AppContextHolder
import com.asme.receiving.data.local.AppDatabaseProvider
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import java.io.File

class MaterialFormScreenTest {

    @get:Rule
    val composeRule = createComposeRule()

    @Before
    fun setup() {
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()
        AppContextHolder.init(context)
        AppDatabaseProvider.resetForTests()
        File(context.getDatabasePath("material_guardian.db").path).delete()
    }

    @Test
    fun saveButtonDisabledWithoutMaterialDescription() {
        composeRule.setContent {
            MaterialFormScreen(jobNumber = "JOB-1", onNavigateBack = {})
        }

        composeRule.onNodeWithText("Save Material").assertIsNotEnabled()
    }
}
