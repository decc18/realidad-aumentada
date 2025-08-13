# Guía para usar ngrok con AR PWA

## ¿Qué es ngrok?
ngrok es una herramienta que crea un túnel seguro desde internet hacia tu servidor local. Perfecto para probar aplicaciones web desde dispositivos móviles.

## Pasos para usar ngrok:

### 1. Configurar servidor local
```bash
# Opción 1: Python (si tienes Python instalado)
cd "c:\Respaldo\Proyecto NFC\RealidadAumentada"
python -m http.server 8080

# Opción 2: Node.js (si tienes Node.js instalado)
npx http-server . -p 8080

# Opción 3: PHP (si tienes PHP instalado)
php -S localhost:8080
```

### 2. Iniciar ngrok
Abre una nueva terminal/PowerShell y ejecuta:
```bash
# Navegar a la carpeta de ngrok
cd "C:\Users\Decc\Downloads\ngrok-v3-stable-windows-amd64"

# Crear túnel hacia tu servidor local
.\ngrok.exe http 8080
```

### 3. Obtener URL pública
ngrok te dará una URL pública como:
```
https://abc123.ngrok-free.app
```

### 4. Probar en dispositivos móviles
- Copia la URL HTTPS de ngrok
- Ábrela en cualquier dispositivo con internet
- ¡Tu PWA AR estará accesible desde cualquier lugar!

## Ventajas de usar ngrok:

✅ **HTTPS automático** - Requerido para cámara y AR
✅ **Acceso desde móviles** - Prueba en dispositivos reales
✅ **Compartir con otros** - Envía el link a cualquiera
✅ **Sin configuración** - No necesitas configurar puertos ni firewall

## Comandos útiles:

```bash
# Ver túneles activos
.\ngrok.exe tunnels list

# Crear túnel con subdominio personalizado (cuenta paga)
.\ngrok.exe http 8080 --subdomain=mi-ar-pwa

# Ver logs y tráfico
# Abre http://localhost:4040 en tu navegador
```

## Notas importantes:

- La URL cambia cada vez que reinicias ngrok (gratis)
- Para URLs permanentes necesitas cuenta Pro
- Perfecto para demos y pruebas
- Los usuarios verán una página de advertencia la primera vez (normal en cuenta gratuita)

## Ejemplo completo:

1. **Terminal 1** (servidor local):
   ```bash
   cd "c:\Respaldo\Proyecto NFC\RealidadAumentada"
   python -m http.server 8080
   ```

2. **Terminal 2** (ngrok):
   ```bash
   cd "C:\Users\Decc\Downloads\ngrok-v3-stable-windows-amd64"
   .\ngrok.exe http 8080
   ```

3. **Resultado**: Tu AR PWA estará disponible en internet con HTTPS ✨
