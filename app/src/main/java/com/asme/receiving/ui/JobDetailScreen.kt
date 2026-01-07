package com.asme.receiving.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import com.asme.receiving.data.MaterialItem
import com.asme.receiving.data.export.ExportService
import kotlinx.coroutines.launch

@Composable
fun JobDetailScreen(
    jobNumber: String,
    onNavigateBack: () -> Unit,
    onAddMaterial: (String) -> Unit,
    onEditMaterial: (String, String) -> Unit,
    onJobRenamed: (String) -> Unit,
    viewModel: JobDetailViewModel = viewModel()
) {
    val scope = rememberCoroutineScope()
    val uiStateFlow = remember(jobNumber) { viewModel.observe(jobNumber) }
    val uiState by uiStateFlow.collectAsState()
    val job = uiState.job

    var showEditDescription by remember { mutableStateOf(false) }
    var showEditJobNumber by remember { mutableStateOf(false) }
    var showExportConfirm by remember { mutableStateOf(false) }
    var exportError by remember { mutableStateOf<String?>(null) }
    var exportSuccess by remember { mutableStateOf<String?>(null) }
    var descriptionDraft by remember { mutableStateOf("") }
    var jobNumberDraft by remember { mutableStateOf("") }

    LaunchedEffect(showEditDescription, job?.description) {
        if (showEditDescription && job != null) {
            descriptionDraft = job.description
        }
    }

    LaunchedEffect(showEditJobNumber, job?.jobNumber) {
        if (showEditJobNumber && job != null) {
            jobNumberDraft = job.jobNumber
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF6F7F9))
            .statusBarsPadding()
            .padding(horizontal = 18.dp, vertical = 16.dp)
    ) {
        JobHeader(onBack = onNavigateBack)

        Spacer(modifier = Modifier.height(14.dp))

        Text(
            text = "JOB DETAILS",
            style = MaterialTheme.typography.titleSmall,
            fontSize = 26.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.sp,
            color = Color(0xFF4B5563)
            ,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(12.dp))

        if (job != null) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Job# ${job.jobNumber}",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = Color(0xFF1E3A5F),
                    textDecoration = TextDecoration.Underline,
                    modifier = Modifier.clickable { showEditJobNumber = true }
                )
                val statusText = if (job.exportedAt == null) "Not exported" else "Exported"
                Text(
                    text = statusText,
                    style = MaterialTheme.typography.labelMedium,
                    color = if (job.exportedAt == null) Color(0xFF9A3412) else Color(0xFF166534)
                )
            }

            if (job.description.isNotBlank()) {
                Text(
                    text = job.description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFF2E3A4B),
                    textDecoration = TextDecoration.Underline,
                    modifier = Modifier
                        .padding(top = 6.dp)
                        .clickable { showEditDescription = true }
                )
            } else {
                Text(
                    text = "Add job description",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFF1E3A5F),
                    textDecoration = TextDecoration.Underline,
                    modifier = Modifier
                        .padding(top = 6.dp)
                        .clickable { showEditDescription = true }
                )
            }
        }

        Spacer(modifier = Modifier.height(26.dp))

        Button(
            onClick = { onAddMaterial(jobNumber) },
            modifier = Modifier
                .align(Alignment.CenterHorizontally)
                .fillMaxWidth(0.8f)
                .height(50.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFF22324A),
                contentColor = Color(0xFFF2F4F7)
            )
        ) {
            Text("Add Receiving Report")
        }

        Spacer(modifier = Modifier.height(28.dp))

        Text(
            text = "Materials Received",
            style = MaterialTheme.typography.titleMedium,
            color = Color(0xFF1C2430)
        )

        Spacer(modifier = Modifier.height(8.dp))

        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(uiState.materials) { material ->
                MaterialSummaryRow(
                    material = material,
                    onClick = { onEditMaterial(jobNumber, material.id) }
                )
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        Button(
            onClick = { showExportConfirm = true },
            modifier = Modifier
                .align(Alignment.CenterHorizontally)
                .fillMaxWidth(0.75f)
                .height(52.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFF1C3F5B),
                contentColor = Color.White
            )
        ) {
            Text("Export Job")
        }
    }

    if (showEditDescription && job != null) {
        AlertDialog(
            onDismissRequest = { showEditDescription = false },
            title = { Text("Edit job description") },
            text = {
                OutlinedTextField(
                    value = descriptionDraft,
                    onValueChange = { descriptionDraft = it.take(120) },
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    scope.launch { viewModel.updateDescription(job.jobNumber, descriptionDraft) }
                    showEditDescription = false
                }) {
                    Text("Save")
                }
            },
            dismissButton = {
                TextButton(onClick = { showEditDescription = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    if (showEditJobNumber && job != null) {
        AlertDialog(
            onDismissRequest = { showEditJobNumber = false },
            title = { Text("Edit job number") },
            text = {
                OutlinedTextField(
                    value = jobNumberDraft,
                    onValueChange = { jobNumberDraft = it.take(30) },
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    scope.launch {
                        val success = viewModel.renameJob(job.jobNumber, jobNumberDraft)
                        if (success) {
                            onJobRenamed(jobNumberDraft)
                        }
                    }
                    showEditJobNumber = false
                }) {
                    Text("Save")
                }
            },
            dismissButton = {
                TextButton(onClick = { showEditJobNumber = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    if (showExportConfirm && job != null) {
        val warning = if (job.exportedAt == null) {
            "Export job files to local storage and Downloads?"
        } else {
            "This job was already exported. Export again?"
        }
        AlertDialog(
            onDismissRequest = { showExportConfirm = false },
            title = { Text("Export job") },
            text = { Text(warning) },
            confirmButton = {
                TextButton(onClick = {
                    scope.launch {
                        try {
                            val exportPath = ExportService().exportJob(job.jobNumber)
                            viewModel.markExported(job.jobNumber, exportPath)
                            exportSuccess = exportPath
                        } catch (e: Exception) {
                            exportError = e.message ?: "Export failed."
                        }
                    }
                    showExportConfirm = false
                }) {
                    Text("Export")
                }
            },
            dismissButton = {
                TextButton(onClick = { showExportConfirm = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    if (exportError != null) {
        AlertDialog(
            onDismissRequest = { exportError = null },
            title = { Text("Export failed") },
            text = { Text(exportError ?: "Export failed.") },
            confirmButton = {
                TextButton(onClick = { exportError = null }) {
                    Text("OK")
                }
            }
        )
    }

    if (exportSuccess != null) {
        AlertDialog(
            onDismissRequest = { exportSuccess = null },
            title = { Text("Export complete") },
            text = { Text("Saved to: ${exportSuccess ?: ""}") },
            confirmButton = {
                TextButton(onClick = { exportSuccess = null }) {
                    Text("OK")
                }
            }
        )
    }
}

@Composable
private fun JobHeader(onBack: () -> Unit) {
    val context = LocalContext.current
    val logoResId = remember(context) {
        context.resources.getIdentifier(
            "material_guardian_512",
            "drawable",
            context.packageName
        )
    }
    Box(modifier = Modifier.fillMaxWidth()) {
        Surface(
            modifier = Modifier
                .size(60.dp)
                .shadow(9.dp, CircleShape)
                .clickable(onClick = onBack),
            shape = CircleShape,
            color = Color(0xFFE5E7EB)
        ) {
            Box(contentAlignment = Alignment.Center) {
                androidx.compose.material3.Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back"
                )
            }
        }

        androidx.compose.foundation.Image(
            painter = painterResource(
                id = if (logoResId != 0) logoResId else android.R.drawable.sym_def_app_icon
            ),
            contentDescription = "Material Guardian Logo",
            modifier = Modifier
                .size(72.dp)
                .align(Alignment.CenterEnd)
                .padding(end = 4.dp)
        )
    }
}

@Composable
private fun MaterialSummaryRow(material: MaterialItem, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .background(Color.White, RoundedCornerShape(10.dp))
            .padding(horizontal = 14.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = material.description.ifBlank { "Material" },
            style = MaterialTheme.typography.bodyMedium,
            color = Color(0xFF1F2937)
        )
        Text(
            text = material.quantity.ifBlank { "-" },
            style = MaterialTheme.typography.bodyMedium,
            color = Color(0xFF475569)
        )
    }
}
