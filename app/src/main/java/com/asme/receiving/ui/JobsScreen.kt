package com.asme.receiving.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalConfiguration
import androidx.lifecycle.viewmodel.compose.viewModel
import com.asme.receiving.R
import com.asme.receiving.data.JobItem
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JobsScreen(
    onJobClick: (String) -> Unit,
    viewModel: JobsViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showAddDialog by remember { mutableStateOf(false) }
    var saveError by remember { mutableStateOf<String?>(null) }
    var jobToDelete by remember { mutableStateOf<JobItem?>(null) }
    val scope = rememberCoroutineScope()

    Scaffold(
        containerColor = Color(0xFFF1F3F6)
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .padding(innerPadding)
                .fillMaxSize()
                .background(Color(0xFFF1F3F6))
        ) {
            val screenHeight = LocalConfiguration.current.screenHeightDp.dp
            val logoSize = (screenHeight * 0.25f).coerceIn(96.dp, 160.dp)

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 20.dp)
            ) {
                Spacer(modifier = Modifier.height(24.dp))
                Image(
                    painter = painterResource(id = R.drawable.material_guardian_512),
                    contentDescription = "Material Guardian Logo",
                    modifier = Modifier
                        .align(Alignment.CenterHorizontally)
                        .size(logoSize)
                )
                Spacer(modifier = Modifier.height(20.dp))
                Button(
                    onClick = { showAddDialog = true },
                    modifier = Modifier
                        .align(Alignment.CenterHorizontally)
                        .fillMaxWidth(0.75f)
                        .height(54.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF22324A),
                        contentColor = Color(0xFFF2F4F7)
                    ),
                    elevation = ButtonDefaults.buttonElevation(
                        defaultElevation = 6.dp,
                        pressedElevation = 2.dp
                    )
                ) {
                    Text(
                        text = "Create New Job",
                        style = TextStyle(
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                            letterSpacing = 0.5.sp
                        )
                    )
                }
                Spacer(modifier = Modifier.height(20.dp))
                HorizontalDivider(
                    color = Color(0xFFCDD4DE),
                    thickness = 1.dp,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(12.dp))

                if (uiState.loading) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(
                            "Loading jobs...",
                            color = Color(0xFF566173)
                        )
                    }
                } else if (uiState.items.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(
                            "No jobs yet. Create your first job above.",
                            textAlign = TextAlign.Center,
                            color = Color(0xFF7B8794)
                        )
                    }
                } else {
                    LazyColumn(
                        contentPadding = PaddingValues(vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(uiState.items) { job ->
                            JobLinkRow(
                                job = job,
                                onClick = { onJobClick(job.jobNumber) },
                                onDelete = { jobToDelete = job }
                            )
                        }
                    }
                }
            }
        }
    }

    if (showAddDialog) {
        AddJobDialog(
            onDismiss = { showAddDialog = false },
            onConfirm = { number, desc, notes ->
                scope.launch {
                    saveError = null
                    try {
                        viewModel.save(number, desc, notes)
                        showAddDialog = false
                    } catch (error: Exception) {
                        saveError = error.message ?: "Unable to save job."
                    }
                }
            },
            errorMessage = saveError
        )
    }

    if (jobToDelete != null) {
        val target = jobToDelete!!
        val deleteMessage = if (target.exportedAt == null) {
            "This job has not been exported yet. Deleting will remove it and its materials from this device."
        } else {
            "This job was already exported. Delete the local copy?"
        }
        AlertDialog(
            onDismissRequest = { jobToDelete = null },
            title = { Text("Delete job?") },
            text = { Text(deleteMessage) },
            confirmButton = {
                TextButton(onClick = {
                    scope.launch {
                        viewModel.delete(target.jobNumber)
                        jobToDelete = null
                    }
                }) {
                    Text("Delete", color = Color(0xFFB00020))
                }
            },
            dismissButton = {
                TextButton(onClick = { jobToDelete = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun JobLinkRow(job: JobItem, onClick: () -> Unit, onDelete: () -> Unit) {
    val linkColor = Color(0xFF1E3A5F)
    val descriptionColor = Color(0xFF2E3A4B)
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Job# ${job.jobNumber}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = linkColor,
                        textDecoration = TextDecoration.Underline
                    )
                    if (job.description.isNotBlank()) {
                        Text(
                            text = job.description,
                            style = MaterialTheme.typography.bodyMedium,
                            color = descriptionColor,
                            textDecoration = TextDecoration.Underline
                        )
                    }
                    val exportStatus = if (job.exportedAt == null) {
                        "Not exported"
                    } else {
                        "Exported"
                    }
                    Text(
                        text = exportStatus,
                        style = MaterialTheme.typography.labelMedium,
                        color = if (job.exportedAt == null) Color(0xFF9A3412) else Color(0xFF166534)
                    )
                }
                Button(
                    onClick = onDelete,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFFB00020),
                        contentColor = Color.White
                    ),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text("Delete", style = MaterialTheme.typography.labelLarge)
                }
            }
        }
    }
}

@Composable
fun AddJobDialog(
    onDismiss: () -> Unit,
    onConfirm: (String, String, String) -> Unit,
    errorMessage: String?
) {
    var jobNumber by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create New Job") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = jobNumber,
                    onValueChange = { jobNumber = it },
                    label = { Text("Job Number") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description") }
                )
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes") }
                )
                if (!errorMessage.isNullOrBlank()) {
                    Text(
                        text = errorMessage,
                        color = Color(0xFFB00020),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(jobNumber, description, notes) },
                enabled = jobNumber.isNotBlank()
            ) {
                Text("Create")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
