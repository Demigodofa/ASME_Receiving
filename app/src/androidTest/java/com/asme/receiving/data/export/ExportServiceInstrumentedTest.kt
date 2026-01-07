package com.asme.receiving.data.export

import androidx.test.core.app.ApplicationProvider
import com.asme.receiving.AppContextHolder
import com.asme.receiving.data.JobItem
import com.asme.receiving.data.JobRepository
import com.asme.receiving.data.MaterialItem
import com.asme.receiving.data.MaterialRepository
import com.asme.receiving.data.local.AppDatabaseProvider
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.io.File

class ExportServiceInstrumentedTest {

    @Before
    fun setup() {
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()
        AppContextHolder.init(context)
        AppDatabaseProvider.resetForTests()
        File(context.getDatabasePath("material_guardian.db").path).delete()
    }

    @Test
    fun exportCreatesReceivingPdf() = runBlocking {
        val jobRepo = JobRepository()
        val materialRepo = MaterialRepository()
        jobRepo.upsert(JobItem(jobNumber = "JOB-77", description = "Instrumented"))
        materialRepo.addMaterial(
            MaterialItem(
                jobNumber = "JOB-77",
                description = "Plate",
                comments = "Looks good"
            )
        )

        val exportPath = ExportService().exportJob("JOB-77")
        val exportDir = File(exportPath, "receiving_reports")
        val files = exportDir.listFiles()?.toList().orEmpty()

        assertTrue(exportDir.exists())
        assertTrue(files.any { it.name.endsWith("_receiving.pdf") })
    }
}
