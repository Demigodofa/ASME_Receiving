package com.asme.receiving.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "jobs")
data class JobItem(
    @PrimaryKey
    val jobNumber: String = "",
    val description: String = "",
    val notes: String = "",
    val createdAt: Long = System.currentTimeMillis(),
    val exportedAt: Long? = null,
    val exportPath: String = ""
) {
    companion object {
        fun mock(
            jobNumber: String = "JOB-001",
            description: String = "Mock job description",
            notes: String = "Mock notes",
            createdAt: Long = System.currentTimeMillis(),
            exportedAt: Long? = null,
            exportPath: String = ""
        ): JobItem = JobItem(
            jobNumber = jobNumber,
            description = description,
            notes = notes,
            createdAt = createdAt,
            exportedAt = exportedAt,
            exportPath = exportPath
        )
    }
}
