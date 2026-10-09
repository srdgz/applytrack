# ADR-0006 · Distribución móvil sin tiendas ni cuentas de desarrollador

- **Estado:** Aceptada, revisada el 2026-10-09
- **Fecha:** 2026-10-05

## Contexto

La app móvil es para el portfolio y no se va a publicar en las tiendas. No hay cuenta de Apple Developer (99 USD al año) ni de Google Play Console (25 USD, pago único).

Sin ellas no se puede usar TestFlight ni la prueba interna de Google Play. Tampoco se pueden enviar notificaciones push remotas.

## Decisión

Dos canales de distribución, gratis con una cuenta de Expo:

1. **Expo Go + EAS Update (iOS y Android):** la app se publica como actualización en Expo y se abre escaneando un QR desde Expo Go. Es la vía principal para que alguien la pruebe en un iPhone.
2. **APK de Android:** se genera con `eas build --platform android --profile preview` (distribución interna) y se enlaza desde el README para instalarlo directamente.

Para que el canal 1 funcione:

- Solo se usan módulos nativos **incluidos en Expo Go**. Por ejemplo, AsyncStorage en lugar de MMKV para el modo demo.
- Los recordatorios de la fase 2 usan **notificaciones locales** (`expo-notifications` programadas en el dispositivo), no push remotas.
- La versión del SDK de Expo se mantiene en la que soporte la versión actual de Expo Go en las tiendas.

## Revisión del 2026-10-09

No se genera el APK ni se publica la app con EAS Update. Para un proyecto de portfolio basta con ejecutarla desde el código: Expo Go escaneando el QR de `pnpm dev:mobile`, o el emulador de Android y el simulador de iOS. El README explica los pasos (ver [117](../specs/117-despliegue-web.md)).

Se mantienen las reglas de la decisión (solo módulos incluidos en Expo Go y notificaciones locales), para que publicar más adelante con EAS no exija cambios.

## Consecuencias

- Cualquiera puede probar la app en iOS o Android sin coste para ti.
- Se descartan las librerías nativas que no estén en Expo Go. Si alguna llega a ser imprescindible, habrá que cambiar a un _development build_, que en iOS sí necesita cuenta de Apple. Esa decisión se registraría en otra ADR.
- La E2E con Maestro se ejecuta en local y en CI contra el simulador o emulador, sin pasar por las tiendas.
- Si en el futuro hay cuentas de desarrollador, publicar en las tiendas solo exige añadir perfiles a `eas.json`: no cambia la arquitectura.
