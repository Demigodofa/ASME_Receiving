package com.asme.receiving.data

import com.asme.receiving.AppContextHolder
import com.asme.receiving.data.local.AppDatabaseProvider
import com.asme.receiving.data.local.JobDao
import kotlinx.coroutines.flow.Flow
import java.io.File

class JobRepository(
    private val jobDao: JobDao = AppDatabaseProvider.get(AppContextHolder.appContext).jobDao()
) {

    suspend fun upsert(job: JobItem) {
        require(job.jobNumber.isNotBlank()) { "jobNumber is required" }
        jobDao.upsert(job)
    }

    suspend fun get(jobNumber: String): JobItem? {
        if (jobNumber.isBlank()) return null
        return jobDao.get(jobNumber)
    }

    fun streamJobs(): Flow<List<JobItem>> = jobDao.observeAll()

    fun observeJob(jobNumber: String): Flow<JobItem?> = jobDao.observe(jobNumber)

    suspend fun deleteJob(jobNumber: String) {
        jobDao.delete(jobNumber)
        MaterialRepository().deleteForJob(jobNumber)
        deleteJobMedia(jobNumber)
    }

    suspend fun renameJob(oldJobNumber: String, newJobNumber: String): Boolean {
        if (oldJobNumber.isBlank() || newJobNumber.isBlank()) return false
        if (oldJobNumber == newJobNumber) return true
        val existing = jobDao.get(oldJobNumber) ?: return false
        val newJob = existing.copy(jobNumber = newJobNumber)
        jobDao.upsert(newJob)
        jobDao.delete(oldJobNumber)
        MaterialRepository().updateJobNumber(oldJobNumber, newJobNumber)
        moveJobMedia(oldJobNumber, newJobNumber)
        return true
    }

    suspend fun updateExportStatus(jobNumber: String, exportPath: String) {
        val existing = jobDao.get(jobNumber) ?: return
        jobDao.upsert(
            existing.copy(
                exportedAt = System.currentTimeMillis(),
                exportPath = exportPath
            )
        )
    }

    suspend fun updateDescription(jobNumber: String, description: String) {
        if (jobNumber.isBlank()) return
        val existing = jobDao.get(jobNumber)
        if (existing == null) {
            jobDao.upsert(JobItem(jobNumber = jobNumber, description = description))
        } else {
            jobDao.upsert(existing.copy(description = description))
        }
    }
}

private fun deleteJobMedia(jobNumber: String) {
    val root = File(AppContextHolder.appContext.filesDir, "job_media/$jobNumber")
    if (root.exists()) {
        root.deleteRecursively()
    }
}

private fun moveJobMedia(oldJobNumber: String, newJobNumber: String) {
    val root = File(AppContextHolder.appContext.filesDir, "job_media")
    val oldDir = File(root, oldJobNumber)
    val newDir = File(root, newJobNumber)
    if (oldDir.exists()) {
        oldDir.renameTo(newDir)
    }
}
