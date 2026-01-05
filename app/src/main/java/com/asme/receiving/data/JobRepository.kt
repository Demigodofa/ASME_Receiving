package com.asme.receiving.data

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

class JobRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
) {

    private val jobsCollection get() = firestore.collection("jobs")

    suspend fun upsert(job: JobItem) {
        require(job.jobNumber.isNotBlank()) { "jobNumber is required" }
        val payload = job.toHashMap()
        jobsCollection.document(job.jobNumber).set(payload).await()
    }

    suspend fun get(jobNumber: String): JobItem? {
        if (jobNumber.isBlank()) return null
        val snapshot = jobsCollection.document(jobNumber).get().await()
        return snapshot.toObject(JobItem::class.java)
    }

    fun streamJobs(): Flow<List<JobItem>> = callbackFlow {
        val registration: ListenerRegistration = jobsCollection.addSnapshotListener { snapshot, error ->
            if (error != null) {
                close(error)
                return@addSnapshotListener
            }
            val jobs = snapshot?.documents
                ?.mapNotNull { it.toObject(JobItem::class.java) }
                .orEmpty()
            trySend(jobs).isSuccess
        }
        awaitClose { registration.remove() }
    }

    suspend fun updateJobMetadata(jobNumber: String, description: String, notes: String) {
        jobsCollection.document(jobNumber)
            .update(
                mapOf(
                    "description" to description,
                    "notes" to notes
                )
            )
            .await()
    }
}
