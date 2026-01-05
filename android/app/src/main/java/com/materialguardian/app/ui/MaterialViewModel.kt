package com.materialguardian.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.materialguardian.app.MaterialItem
import com.materialguardian.app.MaterialRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class MaterialUiState(
    val material: MaterialItem? = null,
    val loading: Boolean = true,
    val error: String? = null,
    val updating: Boolean = false
)

class MaterialViewModel(
    private val repository: MaterialRepository = MaterialRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(MaterialUiState())
    val uiState: StateFlow<MaterialUiState> = _uiState

    fun load(id: String) {
        viewModelScope.launch {
            _uiState.value = MaterialUiState(loading = true)
            try {
                val material = repository.get(id)
                _uiState.value = MaterialUiState(material = material, loading = false)
            } catch (e: Exception) {
                _uiState.value = MaterialUiState(material = null, loading = false, error = e.message)
            }
        }
    }

    fun updateStatus(id: String, status: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(updating = true)
            try {
                repository.updateMaterialStatus(id, status)
                val refreshed = repository.get(id)
                _uiState.value = MaterialUiState(material = refreshed, loading = false, updating = false)
            } catch (e: Exception) {
                _uiState.value = MaterialUiState(material = _uiState.value.material, loading = false, updating = false, error = e.message)
            }
        }
    }
}
