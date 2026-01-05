package com.materialguardian.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.materialguardian.app.JobItem
import com.materialguardian.app.JobRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn

data class JobsUiState(
    val items: List<JobItem> = emptyList(),
    val loading: Boolean = true,
    val error: String? = null
)

class JobsViewModel(
    private val repository: JobRepository = JobRepository()
) : ViewModel() {

    suspend fun save(jobNumber: String, description: String, notes: String) {
        repository.upsert(
            JobItem(
                jobNumber = jobNumber,
                description = description,
                notes = notes
            )
        )
    }

    val uiState: StateFlow<JobsUiState> = repository
        .streamJobs()
        .map { JobsUiState(items = it, loading = false, error = null) }
        .catch { emit(JobsUiState(items = emptyList(), loading = false, error = it.message)) }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(stopTimeoutMillis = 5_000),
            initialValue = JobsUiState()
        )
}
