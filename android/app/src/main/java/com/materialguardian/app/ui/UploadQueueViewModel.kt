package com.materialguardian.app.ui

import androidx.lifecycle.ViewModel
import com.materialguardian.app.UploadQueueItem
import com.materialguardian.app.UploadStatus
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

data class UploadQueueUiState(
    val items: List<UploadQueueItem> = emptyList(),
    val loading: Boolean = false
)

class UploadQueueViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(
        UploadQueueUiState(
            loading = false,
            items = listOf(
                UploadQueueItem(id = "demo-1", type = "thumbnail", status = UploadStatus.PENDING),
                UploadQueueItem(id = "demo-2", type = "full", status = UploadStatus.IN_PROGRESS),
                UploadQueueItem(id = "demo-3", type = "pdf", status = UploadStatus.FAILED, error = "Network error")
            )
        )
    )
    val uiState: StateFlow<UploadQueueUiState> = _uiState

    // Placeholder for future refresh/retry hooks
    fun retry(itemId: String) { /* TODO: integrate WorkManager */ }
}
