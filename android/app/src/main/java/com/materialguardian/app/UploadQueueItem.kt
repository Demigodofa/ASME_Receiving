package com.materialguardian.app

import com.google.firebase.Timestamp

enum class UploadStatus {
    PENDING, IN_PROGRESS, FAILED, COMPLETE
}

data class UploadQueueItem(
    val id: String = "",
    val type: String = "",
    val createdAt: Timestamp = Timestamp.now(),
    val status: UploadStatus = UploadStatus.PENDING,
    val retries: Int = 0,
    val error: String? = null
)
