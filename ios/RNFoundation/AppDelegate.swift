import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  // The window belongs to the scene (see SceneDelegate), but some libraries
  // still ask the app delegate for it, such as react-native-image-crop-picker
  // when it presents its picker. Hand back the active scene's key window.
  var window: UIWindow? {
    get {
      UIApplication.shared.connectedScenes
        .compactMap { ($0 as? UIWindowScene)?.keyWindow }
        .first
    }
    set {}
  }

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    true
  }
}
