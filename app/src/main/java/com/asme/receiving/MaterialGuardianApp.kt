package com.asme.receiving

import android.app.Application

class MaterialGuardianApp : Application() {
    override fun onCreate() {
        super.onCreate()
        AppContextHolder.init(this)
    }
}
