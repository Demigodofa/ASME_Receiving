package com.asme.receiving.ui

import android.content.Context
import android.graphics.BitmapFactory
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import java.io.File
import java.util.concurrent.Executor

@Composable
fun CameraCaptureOverlay(
    title: String,
    maxCount: Int,
    currentCount: Int,
    captureIndex: Int?,
    onClose: () -> Unit,
    onCreateFile: (index: Int) -> File,
    onCaptureAccepted: (file: File, index: Int) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val cameraExecutor = remember { ContextCompat.getMainExecutor(context) }
    var hasPermission by remember { mutableStateOf(false) }
    var pendingFile by remember { mutableStateOf<File?>(null) }
    var pendingIndex by remember { mutableStateOf<Int?>(null) }
    var capturedPath by remember { mutableStateOf<String?>(null) }
    val imageCapture = remember { ImageCapture.Builder().build() }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        hasPermission = granted
    }

    LaunchedEffect(Unit) {
        hasPermission = isCameraPermissionGranted(context)
        if (!hasPermission) {
            permissionLauncher.launch(android.Manifest.permission.CAMERA)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        if (!hasPermission) {
            PermissionPrompt(onClose = onClose)
            return
        }

        if (capturedPath == null) {
            CameraPreview(
                modifier = Modifier.fillMaxSize(),
                imageCapture = imageCapture,
                lifecycleOwner = lifecycleOwner,
                context = context
            )
        } else {
            val bitmap = BitmapFactory.decodeFile(capturedPath)
            if (bitmap != null) {
                Image(
                    bitmap = bitmap.asImageBitmap(),
                    contentDescription = "Captured preview",
                    modifier = Modifier.fillMaxSize()
                )
            }
        }

        val targetIndex = captureIndex ?: (currentCount + 1).coerceAtMost(maxCount)
        val canCapture = captureIndex != null || currentCount < maxCount

        CaptureOverlayControls(
            title = title,
            counter = formatCounter(targetIndex, maxCount),
            showShutter = capturedPath == null,
            onClose = onClose,
            onShutter = {
                if (!canCapture) return@CaptureOverlayControls
                val file = onCreateFile(targetIndex)
                pendingFile = file
                pendingIndex = targetIndex
                takePicture(context, cameraExecutor, imageCapture, file) { path ->
                    capturedPath = path
                }
            },
            onAccept = {
                val file = pendingFile
                val index = pendingIndex
                if (file != null && index != null) {
                    onCaptureAccepted(file, index)
                }
                capturedPath = null
            },
            onRetake = {
                pendingFile?.delete()
                capturedPath = null
            }
        )
    }
}

@Composable
private fun PermissionPrompt(onClose: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.8f)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.padding(24.dp)
        ) {
            Text(
                text = "Camera permission is required.",
                color = Color.White,
                style = MaterialTheme.typography.titleMedium
            )
            Button(onClick = onClose) {
                Text("Close")
            }
        }
    }
}

@Composable
private fun CameraPreview(
    modifier: Modifier,
    imageCapture: ImageCapture,
    lifecycleOwner: androidx.lifecycle.LifecycleOwner,
    context: Context
) {
    val previewView = remember { PreviewView(context) }
    val cameraProviderFuture = remember { ProcessCameraProvider.getInstance(context) }

    LaunchedEffect(Unit) {
        cameraProviderFuture.addListener(
            {
                val cameraProvider = cameraProviderFuture.get()
                val preview = Preview.Builder().build().also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }
                try {
                    cameraProvider.unbindAll()
                    cameraProvider.bindToLifecycle(
                        lifecycleOwner,
                        CameraSelector.DEFAULT_BACK_CAMERA,
                        preview,
                        imageCapture
                    )
                } catch (_: Exception) {
                    // No-op for now
                }
            },
            ContextCompat.getMainExecutor(context)
        )
    }

    androidx.compose.ui.viewinterop.AndroidView(
        modifier = modifier,
        factory = { previewView }
    )
}

@Composable
private fun CaptureOverlayControls(
    title: String,
    counter: String,
    showShutter: Boolean,
    onClose: () -> Unit,
    onShutter: () -> Unit,
    onAccept: () -> Unit,
    onRetake: () -> Unit
) {
    Box(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedButton(onClick = onClose) {
                Text("Exit")
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(text = title, color = Color.White)
                Text(text = counter, color = Color.White, modifier = Modifier.alpha(0.7f))
            }
            Spacer(modifier = Modifier.size(56.dp))
        }

        if (showShutter) {
            Box(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 32.dp)
            ) {
                OutlinedButton(
                    onClick = onShutter,
                    shape = CircleShape,
                    modifier = Modifier.size(82.dp)
                ) {
                    Text(text = "●", color = Color.White)
                }
            }
        } else {
            Row(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 24.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                OutlinedButton(onClick = onRetake, modifier = Modifier.weight(1f)) {
                    Text("Retake")
                }
                Button(onClick = onAccept, modifier = Modifier.weight(1f)) {
                    Text("Accept")
                }
            }
        }
    }
}

private fun takePicture(
    context: Context,
    executor: Executor,
    imageCapture: ImageCapture,
    file: File,
    onSaved: (String) -> Unit
) {
    val outputOptions = ImageCapture.OutputFileOptions.Builder(file).build()
    imageCapture.takePicture(
        outputOptions,
        executor,
        object : ImageCapture.OnImageSavedCallback {
            override fun onImageSaved(outputFileResults: ImageCapture.OutputFileResults) {
                onSaved(file.absolutePath)
            }

            override fun onError(exception: ImageCaptureException) {
                // No-op for now
            }
        }
    )
}

private fun isCameraPermissionGranted(context: Context): Boolean {
    return ContextCompat.checkSelfPermission(
        context,
        android.Manifest.permission.CAMERA
    ) == android.content.pm.PackageManager.PERMISSION_GRANTED
}

private fun formatCounter(current: Int, max: Int): String {
    return "$current/$max"
}
