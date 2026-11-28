# Forge en Android (Health Connect)

Health Connect solo se puede leer desde la app nativa de Android. La PWA de Cloudflare Pages
sigue igual y muestra únicamente los datos que ya están guardados en el dispositivo (también los que
vengan de un respaldo); no lee nada nuevo.

## Requisitos
- JDK 21 (`brew install openjdk@21`). Capacitor 8 no compila con el JDK 25 de Android Studio.
- Android SDK en `~/Library/Android/sdk`.
- Un teléfono con Health Connect y la app de tu reloj (GloryFit) sincronizando con él.

## Compilar el APK de prueba
```sh
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
npm run android:apk
```
El APK queda en `android/app/build/outputs/apk/debug/app-debug.apk`.

## Instalar
```sh
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```
Al abrir Salud en la app, Android pide el permiso de lectura de Health Connect.

## Qué se lee
Solo lectura de pasos, distancia, calorías totales, frecuencia cardíaca y saturación de oxígeno.
Los permisos de escritura y los demás tipos de dato se quitan del manifiesto
(`android/app/src/main/AndroidManifest.xml`). Pasos, distancia y calorías se toman solo de
GloryFit (`com.yc.gloryfit`) para no sumar tres veces lo mismo.

## Cambios de código web
Después de cambiar la web, `npm run android:sync` copia el build a `android/`.
