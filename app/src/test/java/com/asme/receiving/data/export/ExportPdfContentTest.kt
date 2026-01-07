package com.asme.receiving.data.export

import androidx.test.core.app.ApplicationProvider
import com.asme.receiving.AppContextHolder
import com.asme.receiving.data.JobItem
import com.asme.receiving.data.JobRepository
import com.asme.receiving.data.MaterialItem
import com.asme.receiving.data.MaterialRepository
import com.asme.receiving.data.local.AppDatabaseProvider
import com.tom_roush.pdfbox.android.PDFBoxResourceLoader
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.text.PDFTextStripper
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
class ExportPdfContentTest {

    @Before
    fun setup() {
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()
        AppContextHolder.init(context)
        PDFBoxResourceLoader.init(context)
        AppDatabaseProvider.resetForTests()
        File(context.getDatabasePath("material_guardian.db").path).delete()
    }

    @Ignore("PDFBox requires Android resources; run as instrumented test.")
    @Test
    fun receivingPdfContainsHeaderAndComments() = runBlocking {
        val jobRepo = JobRepository()
        val materialRepo = MaterialRepository()
        jobRepo.upsert(JobItem(jobNumber = "JOB-77", description = "Test"))
        materialRepo.addMaterial(
            MaterialItem(
                jobNumber = "JOB-77",
                description = "Steel Plate",
                comments = "Looks good"
            )
        )

        val exportPath = ExportService().exportJob("JOB-77")
        val exportDir = File(exportPath, "receiving_reports")
        val pdfFile = exportDir.listFiles()?.firstOrNull { it.name.endsWith("_receiving.pdf") }
        requireNotNull(pdfFile)

        val text = PDDocument.load(pdfFile).use { doc ->
            PDFTextStripper().getText(doc)
        }

        assertTrue(text.contains("RECEIVING INSPECTION REPORT"))
        assertTrue(text.contains("Looks good"))
        assertTrue(text.contains("Steel Plate"))
    }
}
