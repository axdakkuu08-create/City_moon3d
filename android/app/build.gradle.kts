plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }
android {
    namespace = "com.citymoon.game"; compileSdk = 34
    defaultConfig { applicationId = "com.citymoon.game"; minSdk = 24; targetSdk = 34; versionCode = 1; versionName = "0.1" }
    buildTypes { release { isMinifyEnabled = false } }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    kotlinOptions { jvmTarget = "17" }
}
dependencies { implementation("androidx.activity:activity-ktx:1.9.0"); implementation("androidx.webkit:webkit:1.11.0") }
