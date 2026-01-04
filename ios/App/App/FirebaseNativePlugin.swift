import Foundation
import Capacitor
import FirebaseCore

@objc(FirebaseNativePlugin)
public class FirebaseNativePlugin: CAPPlugin {
    @objc func initialize(_ call: CAPPluginCall) {
        guard let config = call.getObject("config") else {
            call.reject("config is required")
            return
        }

        guard let apiKey = config["apiKey"] as? String,
              let appId = config["appId"] as? String,
              let projectId = config["projectId"] as? String else {
            call.reject("config.apiKey, config.appId, and config.projectId are required")
            return
        }

        if FirebaseApp.app() != nil {
            call.resolve(["status": "already-initialized"])
            return
        }

        let messagingSenderId = (config["messagingSenderId"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
        let storageBucket = (config["storageBucket"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
        let databaseURL = (config["databaseURL"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)

        let gcmSender = (messagingSenderId?.isEmpty == false) ? messagingSenderId! : "placeholder-sender"
        let options = FirebaseOptions(googleAppID: appId, gcmSenderID: gcmSender)
        options.apiKey = apiKey
        options.projectID = projectId

        if let storageBucket, !storageBucket.isEmpty {
            options.storageBucket = storageBucket
        }
        if let databaseURL, !databaseURL.isEmpty {
            options.databaseURL = databaseURL
        }

        FirebaseApp.configure(options: options)
        call.resolve(["status": "initialized"])
    }
}
