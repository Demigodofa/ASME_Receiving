package com.materialguardian.app

import com.google.firebase.Timestamp

/**
 * Material item representation for Firestore-backed persistence.
 */
data class MaterialItem(
    val id: String = "",
    val name: String = "",
    val quantity: Int = 0,
    val status: String = "",
    val receivedAt: Timestamp = Timestamp.now(),
    val userId: String = ""
) {
    fun toHashMap(): Map<String, Any?> = mapOf(
        "id" to id,
        "name" to name,
        "quantity" to quantity,
        "status" to status,
        "receivedAt" to receivedAt,
        "userId" to userId
    )

    companion object {
        fun mock(
            id: String = "mock-material-id",
            name: String = "Mock Material",
            quantity: Int = 1,
            status: String = "received",
            receivedAt: Timestamp = Timestamp.now(),
            userId: String = "mock-user-id"
        ): MaterialItem = MaterialItem(
            id = id,
            name = name,
            quantity = quantity,
            status = status,
            receivedAt = receivedAt,
            userId = userId
        )
    }
}
