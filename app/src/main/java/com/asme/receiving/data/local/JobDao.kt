package com.asme.receiving.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.asme.receiving.data.JobItem
import kotlinx.coroutines.flow.Flow

@Dao
interface JobDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(job: JobItem)

    @Query("SELECT * FROM jobs WHERE jobNumber = :jobNumber LIMIT 1")
    suspend fun get(jobNumber: String): JobItem?

    @Query("SELECT * FROM jobs ORDER BY createdAt DESC")
    fun observeAll(): Flow<List<JobItem>>

    @Query("SELECT * FROM jobs WHERE jobNumber = :jobNumber LIMIT 1")
    fun observe(jobNumber: String): Flow<JobItem?>

    @Query("DELETE FROM jobs WHERE jobNumber = :jobNumber")
    suspend fun delete(jobNumber: String)
}
