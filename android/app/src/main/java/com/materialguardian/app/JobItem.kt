package com.materialguardian.app

import com.google.firebase.Timestamp

/**
 * Job representation matching legacy job fields for Firestore.
 */
data class JobItem(
    val jobNumber: String = "",
    val description: String = "",
    val notes: String = "",
    val createdAt: Timestamp = Timestamp.now(),
    val cloudJobId: String = ""
) {
    fun toHashMap(): Map<String, Any?> = mapOf(
        "jobNumber" to jobNumber,
        "description" to description,
        "notes" to notes,
        "createdAt" to createdAt,
        "cloudJobId" to cloudJobId.ifBlank { jobNumber }
    )

    companion object {
        fun mock(
            jobNumber: String = "JOB-001",
            description: String = "Mock job description",
            notes: String = "Mock notes",
            createdAt: Timestamp = Timestamp.now(),
            cloudJobId: String = jobNumber
        ): JobItem = JobItem(
            jobNumber = jobNumber,
            description = description,
            notes = notes,
            createdAt = createdAt,
            cloudJobId = cloudJobId
        )
    }
}
