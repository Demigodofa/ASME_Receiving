package com.asme.receiving.data

import com.google.firebase.Timestamp

/**
 * Material item representation for Firestore-backed persistence.
 */
data class MaterialItem(
    val id: String = "",
    val jobNumber: String = "",
    val description: String = "",
    val vendor: String = "",
    val quantity: String = "",
    val specificationNumbers: String = "",
    val markings: String = "",
    val offloadStatus: String = "",
    val pdfStatus: String = "",
    val pdfStoragePath: String = "",
    val photoCount: Int = 0,
    val receivedAt: Timestamp = Timestamp.now(),
    val userId: String = ""
) {
    fun toHashMap(): Map<String, Any?> = mapOf(
        "id" to id,
        "jobNumber" to jobNumber,
        "description" to description,
        "vendor" to vendor,
        "quantity" to quantity,
        "specificationNumbers" to specificationNumbers,
        "markings" to markings,
        "offloadStatus" to offloadStatus,
        "pdfStatus" to pdfStatus,
        "pdfStoragePath" to pdfStoragePath,
        "photoCount" to photoCount,
        "receivedAt" to receivedAt,
        "userId" to userId
    )

    companion object {
        fun mock(
            id: String = "mock-material-id",
            jobNumber: String = "JOB-001",
            description: String = "Mock Material",
            vendor: String = "Vendor",
            quantity: String = "1",
            specificationNumbers: String = "Spec-123",
            markings: String = "Markings",
            offloadStatus: String = "pending",
            pdfStatus: String = "pending",
            pdfStoragePath: String = "",
            photoCount: Int = 0,
            receivedAt: Timestamp = Timestamp.now(),
            userId: String = "mock-user-id"
        ): MaterialItem = MaterialItem(
            id = id,
            jobNumber = jobNumber,
            description = description,
            vendor = vendor,
            quantity = quantity,
            specificationNumbers = specificationNumbers,
            markings = markings,
            offloadStatus = offloadStatus,
            pdfStatus = pdfStatus,
            pdfStoragePath = pdfStoragePath,
            photoCount = photoCount,
            receivedAt = receivedAt,
            userId = userId
        )
    }
}
