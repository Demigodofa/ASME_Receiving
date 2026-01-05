package com.materialguardian.app.ui

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import com.materialguardian.app.CloudSettings

data class SettingsUiState(
    val cloudSettings: CloudSettings = CloudSettings(),
    val saving: Boolean = false
)

class SettingsViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState

    fun updateCloudSettings(firebaseConfig: String, pdfEndpoint: String, enabled: Boolean) {
        _uiState.update {
            it.copy(
                cloudSettings = CloudSettings(
                    firebaseConfigJson = firebaseConfig,
                    pdfEndpoint = pdfEndpoint,
                    cloudModeEnabled = enabled
                ),
                saving = false
            )
        }
        // TODO: Persist settings (DataStore/Firestore) and integrate with cloud mode
    }
}
