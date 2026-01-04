import UIKit
import Capacitor
import FirebaseCore

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    var splashOverlay: UIView?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {

        // ✅ Firebase init (guard prevents accidental double-init)
        if FirebaseApp.app() == nil {
            FirebaseApp.configure()
        }

        // Show a splash overlay that matches the LaunchScreen for a fixed duration (4 seconds)
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            guard let window = self.window else { return }

            let overlay = UIView(frame: window.bounds)
            overlay.backgroundColor = UIColor.systemBackground

            let imageView = UIImageView(frame: overlay.bounds)
            imageView.contentMode = .scaleAspectFill
            imageView.image = UIImage(named: "Splash")
            imageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            overlay.addSubview(imageView)

            window.addSubview(overlay)
            self.splashOverlay = overlay

            DispatchQueue.main.asyncAfter(deadline: .now() + 4.0) {
                UIView.animate(withDuration: 0.35, animations: {
                    overlay.alpha = 0.0
                }, completion: { _ in
                    overlay.removeFromSuperview()
                    self.splashOverlay = nil
                })
            }
        }

        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {}

    func applicationDidEnterBackground(_ application: UIApplication) {}

    func applicationWillEnterForeground(_ application: UIApplication) {}

    func applicationDidBecomeActive(_ application: UIApplication) {}

    func applicationWillTerminate(_ application: UIApplication) {}

    func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey: Any] = [:]
    ) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(
        _ application: UIApplication,
        continue userActivity: NSUserActivity,
        restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
    ) -> Bool {
        return ApplicationDelegateProxy.shared.application(
            application,
            continue: userActivity,
            restorationHandler: restorationHandler
        )
    }
}

