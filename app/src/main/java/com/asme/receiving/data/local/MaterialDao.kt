package com.asme.receiving.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.asme.receiving.data.MaterialItem
import kotlinx.coroutines.flow.Flow

@Dao
interface MaterialDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(item: MaterialItem)

    @Query("SELECT * FROM materials WHERE id = :id LIMIT 1")
    suspend fun get(id: String): MaterialItem?

    @Query("SELECT * FROM materials WHERE jobNumber = :jobNumber ORDER BY receivedAt DESC")
    fun observeForJob(jobNumber: String): Flow<List<MaterialItem>>

    @Query("UPDATE materials SET offloadStatus = :status WHERE id = :id")
    suspend fun updateOffloadStatus(id: String, status: String)

    @Query("UPDATE materials SET jobNumber = :newJobNumber WHERE jobNumber = :oldJobNumber")
    suspend fun updateJobNumber(oldJobNumber: String, newJobNumber: String)

    @Query("DELETE FROM materials WHERE jobNumber = :jobNumber")
    suspend fun deleteForJob(jobNumber: String)
}
