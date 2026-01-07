package com.asme.receiving.data

import com.asme.receiving.AppContextHolder
import com.asme.receiving.data.local.AppDatabaseProvider
import com.asme.receiving.data.local.MaterialDao
import kotlinx.coroutines.flow.Flow
import java.util.UUID

class MaterialRepository(
    private val materialDao: MaterialDao = AppDatabaseProvider.get(AppContextHolder.appContext).materialDao()
) {

    suspend fun addMaterial(item: MaterialItem) {
        val itemToSave = if (item.id.isBlank()) {
            item.copy(id = UUID.randomUUID().toString())
        } else {
            item
        }
        materialDao.upsert(itemToSave)
    }

    suspend fun get(id: String): MaterialItem? {
        if (id.isBlank()) return null
        return materialDao.get(id)
    }

    fun streamMaterialsForJob(jobNumber: String): Flow<List<MaterialItem>> {
        return materialDao.observeForJob(jobNumber)
    }

    suspend fun updateJobNumber(oldJobNumber: String, newJobNumber: String) {
        materialDao.updateJobNumber(oldJobNumber, newJobNumber)
    }

    suspend fun deleteForJob(jobNumber: String) {
        materialDao.deleteForJob(jobNumber)
    }

    suspend fun updateOffloadStatus(id: String, status: String) {
        materialDao.updateOffloadStatus(id, status)
    }
}
