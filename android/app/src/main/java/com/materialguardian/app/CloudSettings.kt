package com.materialguardian.app

data class CloudSettings(
    val firebaseConfigJson: String = "",
    val pdfEndpoint: String = "",
    val cloudModeEnabled: Boolean = false
)
