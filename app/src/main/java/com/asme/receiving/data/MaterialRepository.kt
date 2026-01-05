package com.asme.receiving.data

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

class MaterialRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
) {

    private val materialsCollection get() = firestore.collection("materials")

    suspend fun addMaterial(item: MaterialItem) {
        val docRef = if (item.id.isBlank()) {
            materialsCollection.document()
        } else {
            materialsCollection.document(item.id)
        }
        val itemToSave = item.copy(id = docRef.id)
        docRef.set(itemToSave.toHashMap()).await()
    }

    suspend fun get(id: String): MaterialItem? {
        if (id.isBlank()) return null
        val snapshot = materialsCollection.document(id).get().await()
        return snapshot.toObject(MaterialItem::class.java)
    }

    fun streamMaterials(): Flow<List<MaterialItem>> = callbackFlow {
        val registration: ListenerRegistration = materialsCollection.addSnapshotListener { snapshot, error ->
            if (error != null) {
                close(error)
                return@addSnapshotListener
            }
            val items = snapshot?.documents
                ?.mapNotNull { it.toObject(MaterialItem::class.java) }
                .orEmpty()
            trySend(items).isSuccess
        }
        awaitClose { registration.remove() }
    }

    fun streamMaterialsForJob(jobNumber: String): Flow<List<MaterialItem>> = callbackFlow {
        val registration: ListenerRegistration = materialsCollection
            .whereEqualTo("jobNumber", jobNumber)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                val items = snapshot?.documents
                    ?.mapNotNull { it.toObject(MaterialItem::class.java) }
                    .orEmpty()
                trySend(items).isSuccess
            }
        awaitClose { registration.remove() }
    }

    suspend fun updateOffloadStatus(id: String, status: String) {
        materialsCollection.document(id).update("offloadStatus", status).await()
    }
}
