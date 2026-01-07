package com.asme.receiving.ui

import android.graphics.BitmapFactory
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.PopupProperties
import androidx.compose.ui.platform.LocalDensity
import androidx.lifecycle.viewmodel.compose.viewModel
import com.asme.receiving.R
import com.asme.receiving.data.MaterialItem
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult
import kotlinx.coroutines.launch
import java.io.File
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MaterialFormScreen(
    jobNumber: String,
    materialId: String? = null,
    onNavigateBack: () -> Unit,
    viewModel: MaterialViewModel = viewModel()
) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()

    var materialDescription by remember { mutableStateOf("") }
    var poNumber by remember { mutableStateOf("") }
    var vendor by remember { mutableStateOf("") }
    var quantity by remember { mutableStateOf("") }
    var productType by remember { mutableStateOf("") }
    var specificationPrefix by remember { mutableStateOf("") }
    var gradeType by remember { mutableStateOf("") }
    var fittingStandard by remember { mutableStateOf("N/A") }
    var fittingSuffix by remember { mutableStateOf("") }
    var dimensionUnit by remember { mutableStateOf("imperial") }
    var thickness1 by remember { mutableStateOf("") }
    var thickness2 by remember { mutableStateOf("") }
    var thickness3 by remember { mutableStateOf("") }
    var thickness4 by remember { mutableStateOf("") }
    var width by remember { mutableStateOf("") }
    var length by remember { mutableStateOf("") }
    var diameter by remember { mutableStateOf("") }
    var diameterType by remember { mutableStateOf("") }
    var visualInspectionAcceptable by remember { mutableStateOf(true) }
    var b16DimensionsAcceptable by remember { mutableStateOf("") }
    var markings by remember { mutableStateOf("") }
    var markingAcceptable by remember { mutableStateOf(true) }
    var mtrAcceptable by remember { mutableStateOf(true) }
    var acceptanceStatus by remember { mutableStateOf("accept") }
    var comments by remember { mutableStateOf("") }
    var qcInitials by remember { mutableStateOf("") }
    var qcDate by remember { mutableStateOf(LocalDate.now()) }
    var materialApproval by remember { mutableStateOf("approved") }
    var qcManager by remember { mutableStateOf("") }
    var qcManagerInitials by remember { mutableStateOf("") }
    var qcManagerDate by remember { mutableStateOf(LocalDate.now()) }
    var receivedAt by remember { mutableStateOf(System.currentTimeMillis()) }
    var offloadStatus by remember { mutableStateOf("pending") }
    var pdfStatus by remember { mutableStateOf("pending") }
    var pdfStoragePath by remember { mutableStateOf("") }
    val photoPaths = remember { mutableStateListOf<String>() }
    val scanCaptures = remember { mutableStateListOf<ScanCapture>() }
    var activeCapture by remember { mutableStateOf<CaptureType?>(null) }
    var replaceIndex by remember { mutableStateOf<Int?>(null) }
    var replaceType by remember { mutableStateOf<CaptureType?>(null) }

    var showDiscardDialog by remember { mutableStateOf(false) }
    var showSaveSuccess by remember { mutableStateOf(false) }
    var saveError by remember { mutableStateOf<String?>(null) }
    var showMediaActionDialog by remember { mutableStateOf(false) }
    var selectedMediaIndex by remember { mutableStateOf<Int?>(null) }
    var selectedMediaType by remember { mutableStateOf<CaptureType?>(null) }
    var showScanLimitDialog by remember { mutableStateOf(false) }
    var showScanFallbackDialog by remember { mutableStateOf(false) }
    val scanLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartIntentSenderForResult()
    ) { result ->
        val data = result.data ?: return@rememberLauncherForActivityResult
        val scanResult = GmsDocumentScanningResult.fromActivityResultIntent(data)
        val pdf = scanResult?.pdf
        if (pdf != null && scanCaptures.size < 8) {
            val target = buildScanPdfFile(
                context = context,
                jobNumber = jobNumber,
                materialDescription = materialDescription,
                index = scanCaptures.size + 1
            )
            context.contentResolver.openInputStream(pdf.uri)?.use { input ->
                target.outputStream().use { output -> input.copyTo(output) }
            }
            val previewPath = scanResult.pages?.firstOrNull()?.imageUri?.let { uri ->
                val previewFile = buildScanPreviewFile(
                    context = context,
                    jobNumber = jobNumber,
                    materialDescription = materialDescription,
                    index = scanCaptures.size + 1
                )
                context.contentResolver.openInputStream(uri)?.use { input ->
                    previewFile.outputStream().use { output -> input.copyTo(output) }
                }
                previewFile.absolutePath
            } ?: ""
            scanCaptures.add(
                ScanCapture(
                    pdfPath = target.absolutePath,
                    previewPath = previewPath
                )
            )
        }
    }

    val isDirty = materialDescription.isNotBlank() || poNumber.isNotBlank() || vendor.isNotBlank() ||
        quantity.isNotBlank() || productType.isNotBlank() || specificationPrefix.isNotBlank() ||
        gradeType.isNotBlank() || fittingStandard != "N/A" || fittingSuffix.isNotBlank() ||
        thickness1.isNotBlank() || thickness2.isNotBlank() || thickness3.isNotBlank() ||
        thickness4.isNotBlank() || width.isNotBlank() || length.isNotBlank() ||
        diameter.isNotBlank() || markings.isNotBlank() || comments.isNotBlank() ||
        qcInitials.isNotBlank() || qcManager.isNotBlank() || qcManagerInitials.isNotBlank() ||
        !visualInspectionAcceptable || !markingAcceptable || !mtrAcceptable ||
        acceptanceStatus != "accept" || materialApproval != "approved" ||
        dimensionUnit != "imperial" || diameterType != "O.D." ||
        b16DimensionsAcceptable.isNotBlank() || photoPaths.isNotEmpty() || scanCaptures.isNotEmpty()

    BackHandler(enabled = isDirty) {
        showDiscardDialog = true
    }

    LaunchedEffect(materialId) {
        if (!materialId.isNullOrBlank()) {
            viewModel.load(materialId)
        }
    }

    LaunchedEffect(uiState.material?.id) {
        val material = uiState.material ?: return@LaunchedEffect
        if (material.id != materialId) return@LaunchedEffect
        applyMaterialToState(
            material = material,
            onDescription = { materialDescription = it },
            onPo = { poNumber = it },
            onVendor = { vendor = it },
            onQty = { quantity = it },
            onProduct = { productType = it },
            onSpecPrefix = { specificationPrefix = it },
            onGrade = { gradeType = it },
            onFittingStandard = { fittingStandard = it },
            onFittingSuffix = { fittingSuffix = it },
            onDimensionUnit = { dimensionUnit = it },
            onThickness1 = { thickness1 = it },
            onThickness2 = { thickness2 = it },
            onThickness3 = { thickness3 = it },
            onThickness4 = { thickness4 = it },
            onWidth = { width = it },
            onLength = { length = it },
            onDiameter = { diameter = it },
            onDiameterType = { diameterType = it },
            onVisual = { visualInspectionAcceptable = it },
            onB16 = { b16DimensionsAcceptable = it },
            onMarkings = { markings = it },
            onMarkingAcceptable = { markingAcceptable = it },
            onMtrAcceptable = { mtrAcceptable = it },
            onAcceptance = { acceptanceStatus = it },
            onComments = { comments = it },
            onQcInitials = { qcInitials = it },
            onQcDate = { qcDate = it },
            onMaterialApproval = { materialApproval = it },
            onQcManager = { qcManager = it },
            onQcManagerInitials = { qcManagerInitials = it },
            onQcManagerDate = { qcManagerDate = it },
            onReceivedAt = { receivedAt = it },
            onOffloadStatus = { offloadStatus = it },
            onPdfStatus = { pdfStatus = it },
            onPdfStoragePath = { pdfStoragePath = it }
        )
        photoPaths.clear()
        photoPaths.addAll(decodePaths(material.photoPaths))
        scanCaptures.clear()
        scanCaptures.addAll(decodeScanCaptures(material.scanPaths))
    }

    LaunchedEffect(fittingStandard, fittingSuffix) {
        if (fittingStandard != "B16") {
            fittingSuffix = ""
        }
        if (fittingStandard == "B16" && fittingSuffix.isNotBlank()) {
            if (b16DimensionsAcceptable.isBlank()) {
                b16DimensionsAcceptable = "Yes"
            }
        } else {
            b16DimensionsAcceptable = ""
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF6F7F9))
            .verticalScroll(rememberScrollState())
            .statusBarsPadding()
            .padding(horizontal = 18.dp, vertical = 16.dp)
    ) {
        HeaderBar(
            onBack = {
                if (isDirty) {
                    showDiscardDialog = true
                } else {
                    onNavigateBack()
                }
            }
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "RECEIVING INSPECTION\nREPORT",
            style = MaterialTheme.typography.titleSmall,
            fontSize = 26.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.sp,
            lineHeight = 30.sp,
            color = Color(0xFF4B5563),
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(16.dp))

        LabeledField("Material Description") {
            OutlinedTextField(
                value = materialDescription,
                onValueChange = { materialDescription = it.take(40) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            LabeledField("PO #", modifier = Modifier.weight(1f)) {
                OutlinedTextField(
                    value = poNumber,
                    onValueChange = { poNumber = it.take(20) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            }
            LabeledField("Vendor", modifier = Modifier.weight(1f)) {
                OutlinedTextField(
                    value = vendor,
                    onValueChange = { vendor = it.take(20) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            LabeledField("Qty", modifier = Modifier.weight(0.6f)) {
                OutlinedTextField(
                    value = quantity,
                    onValueChange = { quantity = it.take(6) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            }
            LabeledField("Product", modifier = Modifier.weight(1f)) {
                DropdownField(
                    value = productType,
                    options = listOf("Tube", "Pipe", "Plate", "Fitting", "Bar", "Other"),
                    placeholder = "Select"
                ) { productType = it }
            }
            LabeledField("A/SA", modifier = Modifier.weight(0.9f)) {
                DropdownField(
                    value = specificationPrefix,
                    options = listOf("A", "SA"),
                    placeholder = ""
                ) { specificationPrefix = it }
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            LabeledField("Spec/Grade", modifier = Modifier.weight(1f)) {
                OutlinedTextField(
                    value = gradeType,
                    onValueChange = { gradeType = it.take(12) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            }
            LabeledField("Fitting", modifier = Modifier.weight(0.8f)) {
                DropdownField(
                    value = fittingStandard,
                    options = listOf("N/A", "B16"),
                    placeholder = "N/A"
                ) { fittingStandard = it }
            }
            LabeledField("", modifier = Modifier.weight(0.6f)) {
                DropdownField(
                    value = fittingSuffix,
                    options = listOf("5", "9", "11", "34"),
                    placeholder = "",
                    enabled = fittingStandard == "B16"
                ) { fittingSuffix = it }
            }
        }

        LabeledField("Dimensions") {
            Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                XToggle(
                    label = "Imperial",
                    selected = dimensionUnit == "imperial"
                ) { dimensionUnit = "imperial" }
                XToggle(
                    label = "Metric",
                    selected = dimensionUnit == "metric"
                ) { dimensionUnit = "metric" }
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            LabeledField("TH 1", modifier = Modifier.weight(1f)) {
                OutlinedTextField(
                    value = thickness1,
                    onValueChange = { thickness1 = it.take(10) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            }
            LabeledField("TH 2", modifier = Modifier.weight(1f)) {
                OutlinedTextField(
                    value = thickness2,
                    onValueChange = { thickness2 = it.take(10) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            }
            LabeledField("TH 3", modifier = Modifier.weight(1f)) {
                OutlinedTextField(
                    value = thickness3,
                    onValueChange = { thickness3 = it.take(10) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            }
            LabeledField("TH 4", modifier = Modifier.weight(1f)) {
                OutlinedTextField(
                    value = thickness4,
                    onValueChange = { thickness4 = it.take(10) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            LabeledField("Width", modifier = Modifier.weight(1f)) {
                OutlinedTextField(
                    value = width,
                    onValueChange = { width = it.take(10) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            }
            LabeledField("Length", modifier = Modifier.weight(1f)) {
                OutlinedTextField(
                    value = length,
                    onValueChange = { length = it.take(10) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            }
            LabeledField("Diameter", modifier = Modifier.weight(1f)) {
                OutlinedTextField(
                    value = diameter,
                    onValueChange = { diameter = it.take(10) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    textStyle = MaterialTheme.typography.bodyMedium.copy(textAlign = TextAlign.End)
                )
            }
            LabeledField("", modifier = Modifier.weight(0.7f)) {
                DropdownField(
                    value = diameterType,
                    options = listOf("", "O.D.", "I.D."),
                    optionLabel = { option -> if (option.isBlank()) "Clear" else option },
                    placeholder = ""
                ) { diameterType = it }
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            LabeledField("Visual inspection acceptable", modifier = Modifier.weight(1.2f)) {
                YesNoToggle(
                    yesSelected = visualInspectionAcceptable,
                    onYes = { visualInspectionAcceptable = true },
                    onNo = { visualInspectionAcceptable = false }
                )
            }

            LabeledField("B16 Dimensions", modifier = Modifier.weight(0.8f)) {
                DropdownField(
                    value = b16DimensionsAcceptable,
                    options = listOf("", "Yes", "No"),
                    optionLabel = { option -> if (option.isBlank()) "Clear" else option },
                    placeholder = ""
                ) { b16DimensionsAcceptable = it }
            }
        }

        LabeledField("Marking actual") {
            OutlinedTextField(
                value = markings,
                onValueChange = { markings = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp),
                maxLines = 5
            )
        }

        LabeledField("Marking acceptable to Code/Standard") {
            YesNoToggle(
                yesSelected = markingAcceptable,
                onYes = { markingAcceptable = true },
                onNo = { markingAcceptable = false }
            )
        }

        LabeledField("MTR/CoC acceptable to specification") {
            YesNoToggle(
                yesSelected = mtrAcceptable,
                onYes = { mtrAcceptable = true },
                onNo = { mtrAcceptable = false }
            )
        }

        LabeledField("Disposition") {
            Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                XToggle(
                    label = "Accept",
                    selected = acceptanceStatus == "accept"
                ) { acceptanceStatus = "accept" }
                XToggle(
                    label = "Reject",
                    selected = acceptanceStatus == "reject"
                ) { acceptanceStatus = "reject" }
            }
        }

        LabeledField("Comments") {
            OutlinedTextField(
                value = comments,
                onValueChange = { comments = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(90.dp),
                maxLines = 2
            )
        }

        LabeledField("Quality Control / Initials / Date") {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = qcInitials,
                    onValueChange = { qcInitials = it.take(4) },
                    modifier = Modifier.weight(0.6f),
                    singleLine = true
                )
                DateField(qcDate, modifier = Modifier.weight(1f)) { qcDate = it }
            }
        }

        LabeledField("Material approval") {
            Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                XToggle(
                    label = "Approved",
                    selected = materialApproval == "approved"
                ) { materialApproval = "approved" }
                XToggle(
                    label = "Rejected",
                    selected = materialApproval == "rejected"
                ) { materialApproval = "rejected" }
            }
        }

        LabeledField("QC Manager / Initials / Date") {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = qcManager,
                    onValueChange = { qcManager = it.take(20) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = qcManagerInitials,
                        onValueChange = { qcManagerInitials = it.take(4) },
                        modifier = Modifier.weight(0.6f),
                        singleLine = true
                    )
                    DateField(qcManagerDate, modifier = Modifier.weight(1f)) { qcManagerDate = it }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        LabeledField("Material photos") {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick = {
                        activeCapture = CaptureType.PHOTO
                        replaceIndex = null
                        replaceType = null
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                ) {
                    Text(
                        text = "Take up to 4 material photos (${photoPaths.size}/4)",
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                ThumbnailRow(
                    paths = photoPaths,
                    maxCount = 4,
                    onTap = { index ->
                        selectedMediaIndex = index
                        selectedMediaType = CaptureType.PHOTO
                        showMediaActionDialog = true
                    }
                )
            }
        }

        LabeledField("MTR/CoC scans") {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick = {
                        if (scanCaptures.size >= 8) {
                            showScanLimitDialog = true
                        } else {
                            launchScanCapture(
                                context = context,
                                jobNumber = jobNumber,
                                materialDescription = materialDescription,
                                scanLauncher = scanLauncher,
                                onFallback = {
                                    showScanFallbackDialog = true
                                    activeCapture = CaptureType.SCAN
                                    replaceIndex = null
                                    replaceType = null
                                }
                            )
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                ) {
                    Text(
                        text = "Scan MTR/CoC PDFs (${scanCaptures.size}/8)",
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                ThumbnailRow(
                    paths = scanCaptures.map { it.previewPath },
                    maxCount = 8,
                    onTap = { index ->
                        selectedMediaIndex = index
                        selectedMediaType = CaptureType.SCAN
                        showMediaActionDialog = true
                    }
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Button(
            onClick = {
                scope.launch {
                    saveError = null
                    val result = viewModel.saveMaterial(
                        materialId = materialId,
                        jobNumber = jobNumber,
                        materialDescription = materialDescription,
                        poNumber = poNumber,
                        vendor = vendor,
                        quantity = quantity,
                        productType = productType,
                        specificationPrefix = specificationPrefix,
                        gradeType = gradeType,
                        fittingStandard = fittingStandard,
                        fittingSuffix = fittingSuffix,
                        dimensionUnit = dimensionUnit,
                        thickness1 = thickness1,
                        thickness2 = thickness2,
                        thickness3 = thickness3,
                        thickness4 = thickness4,
                        width = width,
                        length = length,
                        diameter = diameter,
                        diameterType = diameterType,
                        visualInspectionAcceptable = visualInspectionAcceptable,
                        b16DimensionsAcceptable = b16DimensionsAcceptable,
                        markings = markings,
                        markingAcceptable = markingAcceptable,
                        mtrAcceptable = mtrAcceptable,
                        acceptanceStatus = acceptanceStatus,
                        comments = comments,
                        qcInitials = qcInitials,
                        qcDate = toEpochMillis(qcDate),
                        materialApproval = materialApproval,
                        qcManager = qcManager,
                        qcManagerInitials = qcManagerInitials,
                        qcManagerDate = toEpochMillis(qcManagerDate),
                        receivedAt = receivedAt,
                        offloadStatus = offloadStatus,
                        pdfStatus = pdfStatus,
                        pdfStoragePath = pdfStoragePath,
                        photoPaths = photoPaths,
                        scanPaths = scanCaptures.map { it.pdfPath }
                    )
                    result.onSuccess { showSaveSuccess = true }
                    result.onFailure { saveError = it.message ?: "Unable to save material." }
                }
            },
            modifier = Modifier
                .align(Alignment.CenterHorizontally)
                .fillMaxWidth(0.75f)
                .height(52.dp),
            shape = RoundedCornerShape(14.dp),
            enabled = materialDescription.isNotBlank()
        ) {
            Text("Save Material")
        }

        Spacer(modifier = Modifier.height(24.dp))
    }

    if (showDiscardDialog) {
        ConfirmDiscardDialog(
            onConfirm = {
                showDiscardDialog = false
                onNavigateBack()
            },
            onDismiss = { showDiscardDialog = false }
        )
    }

    if (showSaveSuccess) {
        AlertDialog(
            onDismissRequest = { showSaveSuccess = false },
            title = { Text("Material saved") },
            text = { Text("The receiving report has been saved.") },
            confirmButton = {
                TextButton(onClick = {
                    showSaveSuccess = false
                    onNavigateBack()
                }) {
                    Text("OK")
                }
            }
        )
    }

    if (saveError != null) {
        AlertDialog(
            onDismissRequest = { saveError = null },
            title = { Text("Save failed") },
            text = { Text(saveError ?: "Unable to save material.") },
            confirmButton = {
                TextButton(onClick = { saveError = null }) {
                    Text("OK")
                }
            }
        )
    }

    if (showMediaActionDialog) {
        val targetIndex = selectedMediaIndex
        val targetType = selectedMediaType
        AlertDialog(
            onDismissRequest = { showMediaActionDialog = false },
            title = { Text("Media options") },
            text = { Text("Would you like to retake or delete this file?") },
            confirmButton = {
                TextButton(onClick = {
                    if (targetIndex != null && targetType != null) {
                        if (targetType == CaptureType.PHOTO) {
                            replaceIndex = targetIndex
                            replaceType = targetType
                            activeCapture = targetType
                        } else {
                            val capture = scanCaptures.getOrNull(targetIndex)
                            if (capture != null) {
                                File(capture.pdfPath).delete()
                                if (capture.previewPath.isNotBlank()) {
                                    File(capture.previewPath).delete()
                                }
                                scanCaptures.removeAt(targetIndex)
                            }
                            launchScanCapture(
                                context = context,
                                jobNumber = jobNumber,
                                materialDescription = materialDescription,
                                scanLauncher = scanLauncher,
                                onFallback = {
                                    showScanFallbackDialog = true
                                    replaceIndex = targetIndex
                                    replaceType = CaptureType.SCAN
                                    activeCapture = CaptureType.SCAN
                                }
                            )
                        }
                    }
                    showMediaActionDialog = false
                }) {
                    Text("Retake")
                }
            },
            dismissButton = {
                Row {
                    TextButton(onClick = {
                        if (targetIndex != null && targetType != null) {
                            if (targetType == CaptureType.PHOTO) {
                                val path = photoPaths.getOrNull(targetIndex)
                                if (path != null) {
                                    File(path).delete()
                                    photoPaths.removeAt(targetIndex)
                                }
                            } else {
                                val capture = scanCaptures.getOrNull(targetIndex)
                                if (capture != null) {
                                    File(capture.pdfPath).delete()
                                    if (capture.previewPath.isNotBlank()) {
                                        File(capture.previewPath).delete()
                                    }
                                    scanCaptures.removeAt(targetIndex)
                                }
                            }
                        }
                        showMediaActionDialog = false
                    }) {
                        Text("Delete")
                    }
                    TextButton(onClick = { showMediaActionDialog = false }) {
                        Text("Cancel")
                    }
                }
            }
        )
    }

    val captureType = activeCapture
    if (captureType != null) {
        val maxCount = if (captureType == CaptureType.PHOTO) 4 else 8
        val currentCount = if (captureType == CaptureType.PHOTO) photoPaths.size else scanCaptures.size
        val targetIndex = if (replaceType == captureType) replaceIndex else null
        CameraCaptureOverlay(
            title = if (captureType == CaptureType.PHOTO) "Material Photos" else "MTR/CoC Scans",
            maxCount = maxCount,
            currentCount = currentCount,
            captureIndex = targetIndex?.plus(1),
            onClose = {
                activeCapture = null
                replaceIndex = null
                replaceType = null
            },
            onCreateFile = { index: Int ->
                buildMediaFile(
                    context = context,
                    jobNumber = jobNumber,
                    materialDescription = materialDescription,
                    type = captureType,
                    index = index
                )
            },
            onCaptureAccepted = { file: File, _: Int ->
                if (captureType == CaptureType.PHOTO) {
                    if (targetIndex != null && targetIndex < photoPaths.size) {
                        val oldPath = photoPaths[targetIndex]
                        if (oldPath != file.absolutePath) {
                            File(oldPath).delete()
                        }
                        photoPaths[targetIndex] = file.absolutePath
                    } else if (photoPaths.size < maxCount) {
                        photoPaths.add(file.absolutePath)
                    }
                } else {
                    if (targetIndex != null && targetIndex < scanCaptures.size) {
                        val existing = scanCaptures[targetIndex]
                        if (existing.pdfPath != file.absolutePath) {
                            File(existing.pdfPath).delete()
                        }
                        scanCaptures[targetIndex] = ScanCapture(
                            pdfPath = file.absolutePath,
                            previewPath = file.absolutePath
                        )
                    } else if (scanCaptures.size < maxCount) {
                        scanCaptures.add(
                            ScanCapture(
                                pdfPath = file.absolutePath,
                                previewPath = file.absolutePath
                            )
                        )
                    }
                }
                activeCapture = null
                replaceIndex = null
                replaceType = null
            }
        )
    }

    if (showScanLimitDialog) {
        AlertDialog(
            onDismissRequest = { showScanLimitDialog = false },
            title = { Text("Scan limit reached") },
            text = { Text("You can attach up to 8 scans per material.") },
            confirmButton = {
                TextButton(onClick = { showScanLimitDialog = false }) {
                    Text("OK")
                }
            }
        )
    }

    if (showScanFallbackDialog) {
        AlertDialog(
            onDismissRequest = { showScanFallbackDialog = false },
            title = { Text("Scanner unavailable") },
            text = { Text("Using camera capture instead of the document scanner.") },
            confirmButton = {
                TextButton(onClick = { showScanFallbackDialog = false }) {
                    Text("OK")
                }
            }
        )
    }

}

@Composable
private fun HeaderBar(onBack: () -> Unit) {
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
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back"
                )
            }
        }

        Image(
            painter = painterResource(id = R.drawable.material_guardian_512),
            contentDescription = "Material Guardian Logo",
            modifier = Modifier
                .size(72.dp)
                .align(Alignment.CenterEnd)
                .padding(end = 4.dp)
        )
    }
}

@Composable
private fun LabeledField(
    label: String,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        if (label.isNotBlank()) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelLarge,
                color = Color(0xFF374151)
            )
        } else {
            Spacer(modifier = Modifier.height(18.dp))
        }
        content()
        Spacer(modifier = Modifier.height(6.dp))
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DropdownField(
    value: String,
    options: List<String>,
    placeholder: String,
    enabled: Boolean = true,
    optionLabel: (String) -> String = { it },
    onValueChange: (String) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    var anchorWidth by remember { mutableStateOf(0) }

    Box {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .onGloballyPositioned { coordinates ->
                    anchorWidth = coordinates.size.width
                }
                .border(1.dp, Color(0xFFCBD5E1), RoundedCornerShape(10.dp))
                .background(Color.White, RoundedCornerShape(10.dp))
                .clickable(enabled = enabled) { expanded = true }
                .padding(horizontal = 12.dp, vertical = 14.dp)
        ) {
            val displayText = if (value.isBlank()) placeholder else value
            Text(
                text = displayText,
                color = if (value.isBlank()) Color(0xFF9CA3AF) else Color(0xFF1F2937)
            )
            Icon(
                imageVector = Icons.Filled.ArrowDropDown,
                contentDescription = null,
                modifier = Modifier.align(Alignment.CenterEnd)
            )
        }
        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
            properties = PopupProperties(focusable = true),
            modifier = Modifier.width(with(LocalDensity.current) { anchorWidth.toDp() })
        ) {
            options.forEach { option ->
                DropdownMenuItem(
                    text = { Text(optionLabel(option)) },
                    onClick = {
                        onValueChange(option)
                        expanded = false
                    }
                )
            }
        }
    }
}


@Composable
private fun XToggle(
    label: String,
    selected: Boolean,
    onToggle: () -> Unit
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        XCheckbox(selected = selected, onToggle = onToggle)
        Spacer(modifier = Modifier.width(6.dp))
        Text(text = label, color = Color(0xFF374151))
    }
}

@Composable
private fun XCheckbox(selected: Boolean, onToggle: () -> Unit) {
    Box(
        modifier = Modifier
            .size(22.dp)
            .border(1.dp, Color(0xFF6B7280), RoundedCornerShape(4.dp))
            .clickable(onClick = onToggle),
        contentAlignment = Alignment.Center
    ) {
        if (selected) {
            Text(text = "X", fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun YesNoToggle(
    yesSelected: Boolean,
    onYes: () -> Unit,
    onNo: () -> Unit
) {
    Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
        XToggle(label = "Yes", selected = yesSelected, onToggle = onYes)
        XToggle(label = "No", selected = !yesSelected, onToggle = onNo)
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun DateField(
    date: LocalDate,
    modifier: Modifier = Modifier,
    onDateChange: (LocalDate) -> Unit
) {
    val formatter = remember { DateTimeFormatter.ofPattern("MM/dd/yyyy") }
    var showDialog by remember { mutableStateOf(false) }
    val datePickerState = rememberDatePickerState(
        initialSelectedDateMillis = toEpochMillis(date)
    )

    Box {
        OutlinedTextField(
            value = date.format(formatter),
            onValueChange = {},
            modifier = modifier.fillMaxWidth(),
            readOnly = true,
            singleLine = true,
            textStyle = MaterialTheme.typography.bodyMedium.copy(textAlign = TextAlign.Center)
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .clickable { showDialog = true }
        )
    }

    if (showDialog) {
        DatePickerDialog(
            onDismissRequest = { showDialog = false },
            confirmButton = {
                TextButton(onClick = {
                    val millis = datePickerState.selectedDateMillis
                    if (millis != null) {
                        onDateChange(
                            Instant.ofEpochMilli(millis)
                                .atZone(ZoneId.systemDefault())
                                .toLocalDate()
                        )
                    }
                    showDialog = false
                }) {
                    Text("OK")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDialog = false }) {
                    Text("Cancel")
                }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }
}

@Composable
private fun ThumbnailRow(
    paths: List<String>,
    maxCount: Int,
    onTap: (Int) -> Unit
) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        modifier = Modifier.horizontalScroll(rememberScrollState())
    ) {
        repeat(maxCount) { index ->
            val path = paths.getOrNull(index)
            if (path != null) {
                val bitmap = remember(path) { BitmapFactory.decodeFile(path) }
                if (bitmap != null) {
                    Image(
                        bitmap = bitmap.asImageBitmap(),
                        contentDescription = "Media thumbnail",
                        modifier = Modifier
                            .size(64.dp)
                            .border(1.dp, Color(0xFFCBD5E1), RoundedCornerShape(10.dp))
                            .clickable { onTap(index) },
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .size(64.dp)
                            .background(Color(0xFFE5E7EB), RoundedCornerShape(10.dp))
                            .border(1.dp, Color(0xFFCBD5E1), RoundedCornerShape(10.dp))
                            .clickable { onTap(index) }
                    )
                }
            } else {
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .background(Color(0xFFE5E7EB), RoundedCornerShape(10.dp))
                        .border(1.dp, Color(0xFFCBD5E1), RoundedCornerShape(10.dp))
                )
            }
        }
    }
}

@Composable
private fun ConfirmDiscardDialog(onConfirm: () -> Unit, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Discard changes?") },
        text = { Text("You have unsaved changes. Discard them and go back?") },
        confirmButton = {
            TextButton(onClick = onConfirm) {
                Text("Discard")
            }
        },
        dismissButton = {
            TextButton(onClick = { /* onDismiss() */ }) {
                Text("Keep editing")
            }
        }
    )
}

private fun toEpochMillis(date: LocalDate): Long {
    return date.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli()
}

private fun buildMediaFile(
    context: android.content.Context,
    jobNumber: String,
    materialDescription: String,
    type: CaptureType,
    index: Int
): File {
    val safeJob = sanitizeFileComponent(jobNumber)
    val safeDesc = sanitizeFileComponent(materialDescription).ifBlank { "material" }
    val baseName = safeDesc.take(24)
    val folder = File(context.filesDir, "job_media/$safeJob/${type.folder}")
    folder.mkdirs()
    val fileName = "${baseName}_${type.label}_${index}.jpg"
    return File(folder, fileName)
}

private fun sanitizeFileComponent(value: String): String {
    return value.lowercase()
        .replace(Regex("[^a-z0-9]+"), "_")
        .trim('_')
}

private enum class CaptureType(val folder: String, val label: String) {
    PHOTO("photos", "photo"),
    SCAN("scans", "scan")
}

private fun buildScanPdfFile(
    context: android.content.Context,
    jobNumber: String,
    materialDescription: String,
    index: Int
): File {
    val safeJob = sanitizeFileComponent(jobNumber)
    val safeDesc = sanitizeFileComponent(materialDescription).ifBlank { "material" }
    val baseName = safeDesc.take(24)
    val folder = File(context.filesDir, "job_media/$safeJob/scans")
    folder.mkdirs()
    return File(folder, "${baseName}_scan_${index}.pdf")
}

private fun buildScanPreviewFile(
    context: android.content.Context,
    jobNumber: String,
    materialDescription: String,
    index: Int
): File {
    val safeJob = sanitizeFileComponent(jobNumber)
    val safeDesc = sanitizeFileComponent(materialDescription).ifBlank { "material" }
    val baseName = safeDesc.take(24)
    val folder = File(context.filesDir, "job_media/$safeJob/scan_previews")
    folder.mkdirs()
    return File(folder, "${baseName}_scan_${index}.jpg")
}

private fun launchScanCapture(
    context: android.content.Context,
    jobNumber: String,
    materialDescription: String,
    scanLauncher: androidx.activity.result.ActivityResultLauncher<IntentSenderRequest>,
    onFallback: () -> Unit
) {
    val options = GmsDocumentScannerOptions.Builder()
        .setScannerMode(GmsDocumentScannerOptions.SCANNER_MODE_FULL)
        .setPageLimit(8)
        .setResultFormats(
            GmsDocumentScannerOptions.RESULT_FORMAT_PDF,
            GmsDocumentScannerOptions.RESULT_FORMAT_JPEG
        )
        .build()
    val scanner = GmsDocumentScanning.getClient(options)
    val activity = findActivity(context)
    if (activity == null) {
        onFallback()
        return
    }
    scanner.getStartScanIntent(activity)
        .addOnSuccessListener { intentSender ->
            scanLauncher.launch(IntentSenderRequest.Builder(intentSender).build())
        }
        .addOnFailureListener {
            onFallback()
        }
}

private fun findActivity(context: android.content.Context): android.app.Activity? {
    var current = context
    while (current is android.content.ContextWrapper) {
        if (current is android.app.Activity) return current
        current = current.baseContext
    }
    return null
}

private data class ScanCapture(
    val pdfPath: String,
    val previewPath: String
)

private fun decodePaths(value: String): List<String> {
    return value.split("|").filter { it.isNotBlank() }
}

private fun decodeScanCaptures(value: String): List<ScanCapture> {
    return decodePaths(value).map { path ->
        ScanCapture(pdfPath = path, previewPath = "")
    }
}

private fun applyMaterialToState(
    material: MaterialItem,
    onDescription: (String) -> Unit,
    onPo: (String) -> Unit,
    onVendor: (String) -> Unit,
    onQty: (String) -> Unit,
    onProduct: (String) -> Unit,
    onSpecPrefix: (String) -> Unit,
    onGrade: (String) -> Unit,
    onFittingStandard: (String) -> Unit,
    onFittingSuffix: (String) -> Unit,
    onDimensionUnit: (String) -> Unit,
    onThickness1: (String) -> Unit,
    onThickness2: (String) -> Unit,
    onThickness3: (String) -> Unit,
    onThickness4: (String) -> Unit,
    onWidth: (String) -> Unit,
    onLength: (String) -> Unit,
    onDiameter: (String) -> Unit,
    onDiameterType: (String) -> Unit,
    onVisual: (Boolean) -> Unit,
    onB16: (String) -> Unit,
    onMarkings: (String) -> Unit,
    onMarkingAcceptable: (Boolean) -> Unit,
    onMtrAcceptable: (Boolean) -> Unit,
    onAcceptance: (String) -> Unit,
    onComments: (String) -> Unit,
    onQcInitials: (String) -> Unit,
    onQcDate: (LocalDate) -> Unit,
    onMaterialApproval: (String) -> Unit,
    onQcManager: (String) -> Unit,
    onQcManagerInitials: (String) -> Unit,
    onQcManagerDate: (LocalDate) -> Unit,
    onReceivedAt: (Long) -> Unit,
    onOffloadStatus: (String) -> Unit,
    onPdfStatus: (String) -> Unit,
    onPdfStoragePath: (String) -> Unit
) {
    onDescription(material.description)
    onPo(material.poNumber)
    onVendor(material.vendor)
    onQty(material.quantity)
    onProduct(material.productType)
    onSpecPrefix(material.specificationPrefix)
    onGrade(material.gradeType)
    onFittingStandard(material.fittingStandard)
    onFittingSuffix(material.fittingSuffix)
    onDimensionUnit(material.dimensionUnit)
    onThickness1(material.thickness1)
    onThickness2(material.thickness2)
    onThickness3(material.thickness3)
    onThickness4(material.thickness4)
    onWidth(material.width)
    onLength(material.length)
    onDiameter(material.diameter)
    onDiameterType(material.diameterType)
    onVisual(material.visualInspectionAcceptable)
    onB16(material.b16DimensionsAcceptable)
    onMarkings(material.markings)
    onMarkingAcceptable(material.markingAcceptable)
    onMtrAcceptable(material.mtrAcceptable)
    onAcceptance(material.acceptanceStatus)
    onComments(material.comments)
    onQcInitials(material.qcInitials)
    onQcDate(Instant.ofEpochMilli(material.qcDate).atZone(ZoneId.systemDefault()).toLocalDate())
    onMaterialApproval(material.materialApproval)
    onQcManager(material.qcManager)
    onQcManagerInitials(material.qcManagerInitials)
    onQcManagerDate(Instant.ofEpochMilli(material.qcManagerDate).atZone(ZoneId.systemDefault()).toLocalDate())
    onReceivedAt(material.receivedAt)
    onOffloadStatus(material.offloadStatus)
    onPdfStatus(material.pdfStatus)
    onPdfStoragePath(material.pdfStoragePath)
}

