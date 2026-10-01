# Keep generic signature of Call, Response (R8 full mode strips signatures from non-kept items). 
 -keep,allowobfuscation,allowshrinking interface retrofit2.Call 
 -keep,allowobfuscation,allowshrinking class retrofit2.Response 
  
 # With R8 full mode generic signatures are stripped for classes that are not 
 # kept. Suspend functions are wrapped in continuations where the type argument 
 # is used. 
 -keep,allowobfuscation,allowshrinking class kotlin.coroutines.Continuation 
 -keep,allowobfuscation,allowshrinking class coil.** 
-dontwarn coil.**

-keepclassmembernames interface com.danipinion.laporpak.data.remote.ApiService {
    @retrofit2.http.* <methods>;
}
-keep class com.danipinion.laporpak.data.remote.response.** { *; }
# Optimization and Obfuscation rules
-optimizationpasses 5
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-dontpreverify
-verbose

# Attributes preservation
-keepattributes Signature, InnerClasses, EnclosingMethod, RuntimeVisibleAnnotations, RuntimeVisibleParameterAnnotations, *Annotation*

# Retrofit 2
-keep class retrofit2.** { *; }
-keep interface retrofit2.** { *; }
-dontwarn retrofit2.**
-keepattributes Signature, InnerClasses, EnclosingMethod

# OkHttp 3 / Okio
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-keep class okio.** { *; }
-keep interface okio.** { *; }
-dontwarn okio.**

# Gson
-keep class com.google.gson.** { *; }
-keep interface com.google.gson.** { *; }
-dontwarn com.google.gson.**
-keep class sun.misc.Unsafe { *; }

# Keep API Interfaces and their members EXACTLY (Crucial for Retrofit)
-keep interface com.danipinion.laporpak.data.remote.** { *; }
-keepclassmembers interface com.danipinion.laporpak.data.remote.** {
    <methods>;
}

# Keep Domain Models and their fields (Crucial for JSON parsing/Gson)
-keep class com.danipinion.laporpak.domain.model.** { *; }
-keepclassmembers class com.danipinion.laporpak.domain.model.** {
    <fields>;
    <methods>;
}

# Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-keepnames class kotlinx.coroutines.android.AndroidExceptionPreHandler {}
-keepnames class kotlinx.coroutines.android.AndroidDispatcherFactory {}
-dontwarn kotlinx.coroutines.**

# Hilt / Dagger
-keep class dagger.hilt.** { *; }
-keep class com.danipinion.laporpak.di.** { *; }

# Remove logging for production
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# Coil
-keep class coil.** { *; }
-keep interface coil.** { *; }
-dontwarn coil.**