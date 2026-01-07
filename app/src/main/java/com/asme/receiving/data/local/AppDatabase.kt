package com.asme.receiving.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.asme.receiving.data.JobItem
import com.asme.receiving.data.MaterialItem

@Database(
    entities = [JobItem::class, MaterialItem::class],
    version = 5,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun jobDao(): JobDao
    abstract fun materialDao(): MaterialDao
}
