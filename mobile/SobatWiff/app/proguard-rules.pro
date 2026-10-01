# Keep generic signature of Call, Response (R8 full mode strips signatures from non-kept items). 
 -keep,allowobfuscation,allowshrinking interface retrofit2.Call 
 -keep,allowobfuscation,allowshrinking class retrofit2.Response 
  
 # With R8 full mode generic signatures are stripped for classes that are not 
 # kept. Suspend functions are wrapped in continuations where the type argument 
 # is used. 
 -keep,allowobfuscation,allowshrinking class kotlin.coroutines.Continuation 
 -keep,allowobfuscation,allowshrinking class coil.** 
-dontwarn coil.**


# General ProGuard rules
-keepparameternames
-keepattributes Signature, InnerClasses, EnclosingMethod
-keepattributes RuntimeVisibleAnnotations, RuntimeVisibleParameterAnnotations
-keepattributes AnnotationDefault
-keepattributes SourceFile, LineNumberTable

# Preserve line numbers for stack traces
-renamesourcefileattribute SourceFile

# Project Models & DTOs (CRITICAL for GSON/Room)
-keep class com.danipinion.sobatwiff.data.remote.model.** { *; }
-keep class com.danipinion.sobatwiff.data.local.** { *; }
-keep class com.danipinion.sobatwiff.model.** { *; }
-keep class com.danipinion.sobatwiff.util.ScannedWifi { *; }

# GSON
-keep class com.google.gson.** { *; }
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Retrofit
-keep class retrofit2.** { *; }
-dontwarn retrofit2.**
-keepattributes Signature
-keepattributes Exceptions
-keepclasseswithmembers class * {
    @retrofit2.http.* <methods>;
}

# OkHttp
-keepattributes Signature
-keepattributes *Annotation*
-keep class okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# Room
-keep class * extends androidx.room.RoomDatabase
-dontwarn androidx.room.paging.**

# Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-keepnames class kotlinx.coroutines.android.AndroidExceptionPreHandler {}
-keepnames class kotlinx.coroutines.android.AndroidDispatcherFactory {}
-keepclassmembernames class kotlinx.coroutines.android.HandlerContext$ {
    java.lang.String name;
}

# AndroidX Lifecycle
-keep class androidx.lifecycle.ViewModel { *; }
-keep class androidx.lifecycle.AndroidViewModel { *; }

# Coil
-keep class coil.** { *; }
-dontwarn coil.**

# Google Play Services (Location, etc.)
-keep class com.google.android.gms.location.** { *; }
-dontwarn com.google.android.gms.**

# Splash Screen
-keep class androidx.core.splashscreen.** { *; }

# Datastore
-keep class androidx.datastore.** { *; }
-dontwarn androidx.datastore.**

# Biometric
-keep class androidx.biometric.** { *; }