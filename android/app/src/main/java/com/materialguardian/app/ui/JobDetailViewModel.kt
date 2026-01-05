package com.materialguardian.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.materialguardian.app.JobItem
import com.materialguardian.app.JobRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class JobDetailUiState(
    val job: JobItem? = null,
    val loading: Boolean = true,
    val error: String? = null
)

class JobDetailViewModel(
    private val repository: JobRepository = JobRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(JobDetailUiState())
    val uiState: StateFlow<JobDetailUiState> = _uiState

    fun load(jobNumber: String) {
        viewModelScope.launch {
            _uiState.value = JobDetailUiState(loading = true)
            try {
                val job = repository.get(jobNumber)
                _uiState.value = JobDetailUiState(job = job, loading = false)
            } catch (e: Exception) {
                _uiState.value = JobDetailUiState(job = null, loading = false, error = e.message)
            }
        }
    }
}
