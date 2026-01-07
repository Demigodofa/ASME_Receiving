package com.asme.receiving.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.asme.receiving.data.JobItem
import com.asme.receiving.data.JobRepository
import com.asme.receiving.data.MaterialItem
import com.asme.receiving.data.MaterialRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn

data class JobDetailUiState(
    val job: JobItem? = null,
    val materials: List<MaterialItem> = emptyList()
)

class JobDetailViewModel(
    private val jobRepository: JobRepository = JobRepository(),
    private val materialRepository: MaterialRepository = MaterialRepository()
) : ViewModel() {

    fun observe(jobNumber: String): StateFlow<JobDetailUiState> {
        return combine(
            jobRepository.observeJob(jobNumber),
            materialRepository.streamMaterialsForJob(jobNumber)
        ) { job, materials ->
            JobDetailUiState(job = job, materials = materials)
        }.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(stopTimeoutMillis = 5_000),
            initialValue = JobDetailUiState()
        )
    }

    suspend fun updateDescription(jobNumber: String, description: String) {
        jobRepository.updateDescription(jobNumber, description)
    }

    suspend fun renameJob(oldJobNumber: String, newJobNumber: String): Boolean {
        return jobRepository.renameJob(oldJobNumber, newJobNumber)
    }

    suspend fun markExported(jobNumber: String, exportPath: String) {
        jobRepository.updateExportStatus(jobNumber, exportPath)
    }
}
