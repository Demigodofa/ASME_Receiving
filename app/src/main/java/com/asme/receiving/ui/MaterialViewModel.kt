package com.asme.receiving.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.asme.receiving.data.MaterialItem
import com.asme.receiving.data.MaterialRepository
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

    fun updateOffloadStatus(id: String, status: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(updating = true)
            try {
                repository.updateOffloadStatus(id, status)
                val refreshed = repository.get(id)
                _uiState.value = MaterialUiState(material = refreshed, loading = false, updating = false)
            } catch (e: Exception) {
                _uiState.value = MaterialUiState(material = _uiState.value.material, loading = false, updating = false, error = e.message)
            }
        }
    }

    suspend fun saveMaterial(
        materialId: String?,
        jobNumber: String,
        materialDescription: String,
        poNumber: String,
        vendor: String,
        quantity: String,
        productType: String,
        specificationPrefix: String,
        gradeType: String,
        fittingStandard: String,
        fittingSuffix: String,
        dimensionUnit: String,
        thickness1: String,
        thickness2: String,
        thickness3: String,
        thickness4: String,
        width: String,
        length: String,
        diameter: String,
        diameterType: String,
        visualInspectionAcceptable: Boolean,
        b16DimensionsAcceptable: String,
        markings: String,
        markingAcceptable: Boolean,
        markingAcceptableNa: Boolean,
        mtrAcceptable: Boolean,
        mtrAcceptableNa: Boolean,
        acceptanceStatus: String,
        comments: String,
        qcInitials: String,
        qcDate: Long,
        materialApproval: String,
        qcManager: String,
        qcManagerInitials: String,
        qcManagerDate: Long,
        receivedAt: Long,
        offloadStatus: String,
        pdfStatus: String,
        pdfStoragePath: String,
        photoPaths: List<String>,
        scanPaths: List<String>
    ): Result<Unit> {
        _uiState.value = _uiState.value.copy(updating = true, error = null)
        return runCatching {
            repository.addMaterial(
                MaterialItem(
                    id = materialId ?: "",
                    jobNumber = jobNumber,
                    description = materialDescription,
                    poNumber = poNumber,
                    vendor = vendor,
                    quantity = quantity,
                    productType = productType,
                    specificationPrefix = specificationPrefix,
                    gradeType = gradeType,
                    fittingStandard = fittingStandard,
                    fittingSuffix = fittingSuffix,
                    dimensionUnit = dimensionUnit,
                    thickness1 = thickness1,
                    thickness2 = thickness2,
                    thickness3 = thickness3,
                    thickness4 = thickness4,
                    width = width,
                    length = length,
                    diameter = diameter,
                    diameterType = diameterType,
                    visualInspectionAcceptable = visualInspectionAcceptable,
                    b16DimensionsAcceptable = b16DimensionsAcceptable,
                    specificationNumbers = specificationPrefix,
                    markings = markings,
                    markingAcceptable = markingAcceptable,
                    markingAcceptableNa = markingAcceptableNa,
                    mtrAcceptable = mtrAcceptable,
                    mtrAcceptableNa = mtrAcceptableNa,
                    acceptanceStatus = acceptanceStatus,
                    comments = comments,
                    qcInitials = qcInitials,
                    qcDate = qcDate,
                    materialApproval = materialApproval,
                    qcManager = qcManager,
                    qcManagerInitials = qcManagerInitials,
                    qcManagerDate = qcManagerDate,
                    photoPaths = encodePaths(photoPaths),
                    scanPaths = encodePaths(scanPaths),
                    photoCount = photoPaths.size,
                    offloadStatus = offloadStatus,
                    pdfStatus = pdfStatus,
                    pdfStoragePath = pdfStoragePath,
                    receivedAt = receivedAt
                )
            )
        }.onSuccess {
            _uiState.value = _uiState.value.copy(updating = false)
        }.onFailure { error ->
            _uiState.value = _uiState.value.copy(updating = false, error = error.message)
        }
    }

    fun observeMaterialsForJob(jobNumber: String) = repository.streamMaterialsForJob(jobNumber)
}

private fun encodePaths(paths: List<String>): String {
    return paths.joinToString("|")
}
