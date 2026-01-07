package com.asme.receiving.data.export

import android.content.ContentValues
import android.content.Context
import android.os.Environment
import android.provider.MediaStore
import android.os.Build
import com.asme.receiving.AppContextHolder
import com.asme.receiving.data.JobItem
import com.asme.receiving.data.MaterialItem
import com.asme.receiving.data.MaterialRepository
import com.asme.receiving.data.JobRepository
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.pdmodel.PDPage
import com.tom_roush.pdfbox.pdmodel.PDPageContentStream
import com.tom_roush.pdfbox.pdmodel.common.PDRectangle
import com.tom_roush.pdfbox.pdmodel.font.PDType1Font
import com.tom_roush.pdfbox.android.PDFBoxResourceLoader
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlinx.coroutines.flow.first

class ExportService(
    private val context: Context = AppContextHolder.appContext,
    private val jobRepository: JobRepository = JobRepository(),
    private val materialRepository: MaterialRepository = MaterialRepository()
) {
    private val dateFormatter = SimpleDateFormat("MM/dd/yyyy", Locale.US)

    suspend fun exportJob(jobNumber: String): String {
        PDFBoxResourceLoader.init(context)
        val job = jobRepository.get(jobNumber) ?: throw IllegalStateException("Job not found")
        val materials = materialRepository.streamMaterialsForJob(jobNumber).first()
        val exportRoot = File(context.filesDir, "exports/${sanitize(job.jobNumber)}")
        exportRoot.mkdirs()

        val receivingDir = File(exportRoot, "receiving_reports").also { it.mkdirs() }
        val scanDir = File(exportRoot, "mtr_scans").also { it.mkdirs() }

        materials.forEachIndexed { index, material ->
            val suffix = material.description.ifBlank { "material_${index + 1}" }
            val baseName = truncate(sanitize("${job.jobNumber}_$suffix"), 40)
            val outputFile = File(receivingDir, "${baseName}_receiving.pdf")
            generateReceivingReport(job, material, outputFile)
            exportScans(material, scanDir, baseName)
            exportPhotos(material, exportRoot, baseName)
        }

        writeExportNotice(exportRoot, job)
        copyToDownloads(exportRoot, job.jobNumber)
        jobRepository.updateExportStatus(job.jobNumber, exportRoot.absolutePath)
        return exportRoot.absolutePath
    }

    private fun generateReceivingReport(job: JobItem, material: MaterialItem, outputFile: File) {
        PDDocument().use { document ->
            val page = PDPage(PDRectangle.LETTER)
            document.addPage(page)
            PDPageContentStream(document, page).use { stream ->
                val margin = 36f
                val width = PDRectangle.LETTER.width - margin * 2
                var y = PDRectangle.LETTER.height - margin

                stream.setFont(PDType1Font.HELVETICA_BOLD, 16f)
                drawText(stream, margin, y, "RECEIVING INSPECTION REPORT")
                y -= 20f
                stream.setFont(PDType1Font.HELVETICA, 11f)
                drawText(stream, margin, y, "Job#: ${job.jobNumber}")
                y -= 16f

                y = drawSectionTitle(stream, margin, y, "Material Details")
                y = drawLabelBoxRow(
                    stream,
                    margin,
                    y,
                    width,
                    listOf(
                        LabelValue("Material Description", material.description, 0.6f),
                        LabelValue("PO#", material.poNumber, 0.2f),
                        LabelValue("Vendor", material.vendor, 0.2f)
                    )
                )
                y = drawLabelBoxRow(
                    stream,
                    margin,
                    y,
                    width,
                    listOf(
                        LabelValue("Qty", material.quantity, 0.15f),
                        LabelValue("Product", material.productType, 0.25f),
                        LabelValue("Specification", material.specificationPrefix.ifBlank { material.specificationNumbers }, 0.2f),
                        LabelValue("Grade/Type", material.gradeType, 0.2f),
                        LabelValue("Fitting", listOf(material.fittingStandard, material.fittingSuffix)
                            .filter { it.isNotBlank() }.joinToString("."), 0.2f)
                    )
                )

                y = drawSectionTitle(stream, margin, y, "Dimensions")
                y = drawToggleRow(
                    stream,
                    margin,
                    y,
                    "Unit",
                    listOf(
                        Toggle("Imperial", material.dimensionUnit == "imperial"),
                        Toggle("Metric", material.dimensionUnit == "metric")
                    )
                )
                y = drawLabelBoxRow(
                    stream,
                    margin,
                    y,
                    width,
                    listOf(
                        LabelValue("TH 1", material.thickness1, 0.25f),
                        LabelValue("TH 2", material.thickness2, 0.25f),
                        LabelValue("TH 3", material.thickness3, 0.25f),
                        LabelValue("TH 4", material.thickness4, 0.25f)
                    )
                )
                y = drawLabelBoxRow(
                    stream,
                    margin,
                    y,
                    width,
                    listOf(
                        LabelValue("Width", material.width, 0.25f),
                        LabelValue("Length", material.length, 0.25f),
                        LabelValue("Diameter", material.diameter, 0.25f),
                        LabelValue("O.D./I.D.", material.diameterType, 0.25f)
                    )
                )

                y = drawSectionTitle(stream, margin, y, "Inspection")
                y = drawToggleRow(
                    stream,
                    margin,
                    y,
                    "Visual Inspection Acceptable",
                    listOf(
                        Toggle("Yes", material.visualInspectionAcceptable),
                        Toggle("No", !material.visualInspectionAcceptable)
                    )
                )
                y = drawLabelBoxRow(
                    stream,
                    margin,
                    y,
                    width,
                    listOf(
                        LabelValue("B16 Dimensions Acceptable", material.b16DimensionsAcceptable, 0.5f),
                        LabelValue("Marking Actual", material.markings, 0.5f)
                    ),
                    boxHeight = 48f
                )
                y = drawToggleRow(
                    stream,
                    margin,
                    y,
                    "Marking Acceptable to Code/Standard",
                    listOf(
                        Toggle("Yes", material.markingAcceptable && !material.markingAcceptableNa),
                        Toggle("No", !material.markingAcceptable && !material.markingAcceptableNa),
                        Toggle("N/A", material.markingAcceptableNa)
                    )
                )
                y = drawToggleRow(
                    stream,
                    margin,
                    y,
                    "MTR/CoC Acceptable to Specification",
                    listOf(
                        Toggle("Yes", material.mtrAcceptable && !material.mtrAcceptableNa),
                        Toggle("No", !material.mtrAcceptable && !material.mtrAcceptableNa),
                        Toggle("N/A", material.mtrAcceptableNa)
                    )
                )
                y = drawToggleRow(
                    stream,
                    margin,
                    y,
                    "Disposition",
                    listOf(
                        Toggle("Accept", material.acceptanceStatus == "accept"),
                        Toggle("Reject", material.acceptanceStatus == "reject")
                    )
                )

                y = drawSectionTitle(stream, margin, y, "Comments")
                val commentText = listOf(material.comments, material.description)
                    .filter { it.isNotBlank() }
                    .joinToString(" | ")
                y = drawMultiLineBox(stream, margin, y, width, commentText, 48f)

                y = drawSectionTitle(stream, margin, y, "Quality Control")
                y = drawLabelBoxRow(
                    stream,
                    margin,
                    y,
                    width,
                    listOf(
                        LabelValue("Initials", material.qcInitials, 0.25f),
                        LabelValue("Date", dateFormatter.format(Date(material.qcDate)), 0.25f),
                        LabelValue("Material Approval", material.materialApproval, 0.5f)
                    )
                )

                y = drawSectionTitle(stream, margin, y, "QC Manager")
                drawLabelBoxRow(
                    stream,
                    margin,
                    y,
                    width,
                    listOf(
                        LabelValue("QC Manager", material.qcManager, 0.5f),
                        LabelValue("Initials", material.qcManagerInitials, 0.2f),
                        LabelValue("Date", dateFormatter.format(Date(material.qcManagerDate)), 0.3f)
                    )
                )
            }
            FileOutputStream(outputFile).use { out ->
                document.save(out)
            }
        }
    }

    private fun drawSectionTitle(
        stream: PDPageContentStream,
        x: Float,
        y: Float,
        title: String
    ): Float {
        stream.setFont(PDType1Font.HELVETICA_BOLD, 12f)
        drawText(stream, x, y, title)
        return y - 14f
    }

    private fun drawLabelBoxRow(
        stream: PDPageContentStream,
        x: Float,
        y: Float,
        totalWidth: Float,
        items: List<LabelValue>,
        boxHeight: Float = 28f
    ): Float {
        val spacing = 8f
        var cursor = x
        stream.setFont(PDType1Font.HELVETICA, 9f)
        items.forEach { item ->
            val boxWidth = (totalWidth - spacing * (items.size - 1)) * item.widthFraction
            drawText(stream, cursor, y, item.label)
            drawRect(stream, cursor, y - 2f - boxHeight, boxWidth, boxHeight)
            stream.setFont(PDType1Font.HELVETICA, 10f)
            drawWrappedText(stream, cursor + 4f, y - 16f, boxWidth - 8f, item.value)
            stream.setFont(PDType1Font.HELVETICA, 9f)
            cursor += boxWidth + spacing
        }
        return y - (boxHeight + 22f)
    }

    private fun drawToggleRow(
        stream: PDPageContentStream,
        x: Float,
        y: Float,
        label: String,
        toggles: List<Toggle>
    ): Float {
        stream.setFont(PDType1Font.HELVETICA, 10f)
        drawText(stream, x, y, label)
        var cursor = x + 200f
        toggles.forEach { toggle ->
            drawRect(stream, cursor, y - 12f, 12f, 12f)
            if (toggle.selected) {
                drawText(stream, cursor + 3f, y - 2f, "X")
            }
            drawText(stream, cursor + 18f, y, toggle.label)
            cursor += 90f
        }
        return y - 18f
    }

    private fun drawMultiLineBox(
        stream: PDPageContentStream,
        x: Float,
        y: Float,
        width: Float,
        text: String,
        height: Float
    ): Float {
        drawRect(stream, x, y - height, width, height)
        stream.setFont(PDType1Font.HELVETICA, 10f)
        drawWrappedText(stream, x + 4f, y - 14f, width - 8f, text)
        return y - (height + 16f)
    }

    private fun drawRect(stream: PDPageContentStream, x: Float, y: Float, w: Float, h: Float) {
        stream.addRect(x, y, w, h)
        stream.stroke()
    }

    private fun drawText(stream: PDPageContentStream, x: Float, y: Float, text: String) {
        stream.beginText()
        stream.newLineAtOffset(x, y)
        stream.showText(text)
        stream.endText()
    }

    private fun drawWrappedText(
        stream: PDPageContentStream,
        x: Float,
        y: Float,
        width: Float,
        text: String
    ) {
        if (text.isBlank()) return
        val words = text.split(" ")
        var line = ""
        var offsetY = 0f
        words.forEach { word ->
            val test = if (line.isBlank()) word else "$line $word"
            val testWidth = PDType1Font.HELVETICA.getStringWidth(test) / 1000f * 10f
            if (testWidth > width && line.isNotBlank()) {
                drawText(stream, x, y - offsetY, line)
                offsetY += 12f
                line = word
            } else {
                line = test
            }
        }
        if (line.isNotBlank()) {
            drawText(stream, x, y - offsetY, line)
        }
    }

    private data class LabelValue(
        val label: String,
        val value: String,
        val widthFraction: Float
    )

    private data class Toggle(
        val label: String,
        val selected: Boolean
    )

    private fun exportPhotos(material: MaterialItem, exportRoot: File, baseName: String) {
        val photoPaths = material.photoPaths.split("|").filter { it.isNotBlank() }
        if (photoPaths.isEmpty()) return
        val photoDir = File(exportRoot, "photos").also { it.mkdirs() }
        photoPaths.forEachIndexed { index, path ->
            val source = File(path)
            if (!source.exists()) return@forEachIndexed
            val target = File(photoDir, "${baseName}_photo_${index + 1}.jpg")
            source.copyTo(target, overwrite = true)
        }
    }

    private fun exportScans(material: MaterialItem, scanDir: File, baseName: String) {
        val scanPaths = material.scanPaths.split("|").filter { it.isNotBlank() }
        if (scanPaths.isEmpty()) return
        val target = File(scanDir, "${baseName}_mtr.pdf")
        PDDocument().use { document ->
            scanPaths.forEach { path ->
                val file = File(path)
                if (!file.exists()) return@forEach
                if (path.endsWith(".pdf", true)) {
                    PDDocument.load(file).use { source ->
                        source.pages.forEach { page ->
                            document.importPage(page)
                        }
                    }
                } else {
                    val image = com.tom_roush.pdfbox.pdmodel.graphics.image.PDImageXObject.createFromFile(
                        file.absolutePath,
                        document
                    )
                    val page = PDPage(PDRectangle.LETTER)
                    document.addPage(page)
                    PDPageContentStream(document, page).use { stream ->
                        val scale = minOf(
                            PDRectangle.LETTER.width / image.width,
                            PDRectangle.LETTER.height / image.height
                        )
                        val width = image.width * scale
                        val height = image.height * scale
                        val x = (PDRectangle.LETTER.width - width) / 2
                        val y = (PDRectangle.LETTER.height - height) / 2
                        stream.drawImage(image, x, y, width, height)
                    }
                }
            }
            if (document.numberOfPages > 0) {
                FileOutputStream(target).use { out -> document.save(out) }
            }
        }
    }

    private fun writeExportNotice(exportRoot: File, job: JobItem) {
        val notice = File(exportRoot, "export_info.txt")
        val content = buildString {
            appendLine("Job Export")
            appendLine("Job: ${job.jobNumber}")
            appendLine("Description: ${job.description}")
            appendLine("Exported: ${dateFormatter.format(Date())}")
        }
        notice.writeText(content)
    }

    private fun copyToDownloads(exportRoot: File, jobNumber: String) {
        val downloadDir = "MaterialGuardian/${sanitize(jobNumber)}"
        val rootPath = exportRoot.absolutePath
        exportRoot.walkTopDown().forEach { file ->
            if (file.isDirectory) return@forEach
            val relativePath = file.absolutePath.removePrefix(rootPath).trimStart(File.separatorChar)
            val displayName = relativePath.replace(File.separatorChar, '_')
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val values = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, displayName)
                    put(MediaStore.MediaColumns.MIME_TYPE, guessMimeType(file.name))
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/$downloadDir")
                }
                val resolver = context.contentResolver
                val uri = resolver.insert(MediaStore.Files.getContentUri("external"), values)
                if (uri != null) {
                    resolver.openOutputStream(uri)?.use { output ->
                        file.inputStream().use { it.copyTo(output) }
                    }
                }
            } else {
                val legacyDir = File(
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                    downloadDir
                )
                legacyDir.mkdirs()
                val target = File(legacyDir, displayName)
                file.copyTo(target, overwrite = true)
            }
        }
    }

    private fun guessMimeType(name: String): String {
        return when {
            name.endsWith(".pdf", true) -> "application/pdf"
            name.endsWith(".jpg", true) || name.endsWith(".jpeg", true) -> "image/jpeg"
            else -> "application/octet-stream"
        }
    }

    private fun sanitize(value: String): String {
        return value.lowercase()
            .replace(Regex("[^a-z0-9]+"), "_")
            .trim('_')
    }

    private fun truncate(value: String, length: Int): String {
        return if (value.length <= length) value else value.substring(0, length)
    }
}
