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
import org.junit.Ignore
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.SQLiteMode
import java.io.File

@RunWith(RobolectricTestRunner::class)
@org.robolectric.annotation.Config(sdk = [33])
@SQLiteMode(SQLiteMode.Mode.NATIVE)
class ExportServiceTest {

    @Before
    fun setup() {
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()
        AppContextHolder.init(context)
        AppDatabaseProvider.resetForTests()
        File(context.getDatabasePath("material_guardian.db").path).delete()
    }

    @Ignore("PDFBox requires Android resources; run as instrumented test.")
    @Test
    fun exportCreatesReceivingPdf() = runBlocking {
        val jobRepo = JobRepository()
        val materialRepo = MaterialRepository()
        val job = JobItem(jobNumber = "JOB-99", description = "Export test")
        jobRepo.upsert(job)
        materialRepo.addMaterial(
            MaterialItem(
                jobNumber = "JOB-99",
                description = "Plate",
                quantity = "2"
            )
        )

        val exportPath = ExportService().exportJob("JOB-99")
        val exportDir = File(exportPath, "receiving_reports")
        val files = exportDir.listFiles()?.toList().orEmpty()

        assertTrue(exportDir.exists())
        assertTrue(files.any { it.name.endsWith("_receiving.pdf") })
    }
}
