# AR PWA - Aplicación de Realidad Aumentada

Una aplicación Progressive Web App (PWA) que implementa realidad aumentada directamente en el navegador web.

## 🚀 Características

- **Progressive Web App**: Funciona offline, es instalable y se actualiza automáticamente
- **Realidad Aumentada con Marcador**: Usa AR.js para detectar marcadores y mostrar contenido 3D
- **Reconocimiento de Productos**: Escanea productos reales y muestra información detallada en tiempo real
- **Realidad Aumentada sin Marcador**: Implementa WebXR para AR sin necesidad de marcadores
- **Realidad Aumentada por Ubicación**: Muestra puntos de interés basados en GPS
- **Responsive Design**: Optimizado para dispositivos móviles y desktop
- **Offline First**: Funciona sin conexión a internet después de la primera carga

## 🛠️ Tecnologías Utilizadas

- **PWA**: Service Workers, Web App Manifest
- **AR**: AR.js, WebXR, Three.js
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Sensores**: GPS, Cámara, Acelerómetro/Giroscopio

## 📱 Instalación y Uso

### Opción 1: Servidor Local Simple

1. **Usar Python (si está instalado):**
   ```bash
   cd "c:\Respaldo\Proyecto NFC\RealidadAumentada"
   python -m http.server 8080
   ```

2. **Usar Node.js (si está instalado):**
   ```bash
   npx http-server . -p 8080
   ```

3. **Usar Live Server en VS Code:**
   - Instalar extensión "Live Server"
   - Click derecho en `index.html` → "Open with Live Server"

### Opción 2: GitHub Pages

1. Subir el proyecto a un repositorio de GitHub
2. Activar GitHub Pages en la configuración del repositorio
3. Acceder a la URL proporcionada

### Acceso

Abrir el navegador y navegar a:
- `http://localhost:8080` (servidor local)
- O la URL de GitHub Pages

## 📋 Requisitos del Sistema

### Navegadores Soportados
- **Chrome/Chromium** 67+ (recomendado)
- **Firefox** 69+
- **Safari** 13+ (iOS/macOS)
- **Edge** 79+

### Permisos Necesarios
- **Cámara**: Para AR con y sin marcador
- **Ubicación**: Para AR basado en ubicación
- **Orientación del dispositivo**: Para tracking de movimiento

### Dispositivos Recomendados
- **Móviles**: Android 8+ o iOS 12+
- **Desktop**: Windows 10+, macOS 10.14+, Linux Ubuntu 18+
- **Procesador**: ARM64 o x64 con soporte de gráficos

## 🎮 Cómo Usar

### 1. AR con Marcador
1. Descargar el marcador AR desde la aplicación
2. Imprimir el marcador en papel
3. Apuntar la cámara hacia el marcador
4. Ver aparecer contenido 3D sobre el marcador

### 2. Reconocimiento de Productos
1. Abrir la sección "Reconocimiento de Productos"
2. Generar marcadores personalizados usando `generate-product-markers.html`
3. Colocar el marcador cerca del producto físico (ducha de mano)
4. Apuntar la cámara hacia el marcador
5. Ver información detallada del producto:
   - Precio y descuentos
   - Características técnicas
   - Especificaciones
   - Colores disponibles
   - Accesorios incluidos
   - Certificaciones
6. Interactuar con el producto:
   - Agregar al carrito
   - Agregar a lista de deseos
   - Compartir producto
   - Ver video demo
   - Descargar manual

### 3. AR sin Marcador
1. Permitir acceso a la cámara
2. Mover el dispositivo para detectar superficies
3. Tocar "Agregar Objeto" para colocar elementos 3D
4. Los objetos aparecerán anclados al mundo real

### 4. AR por Ubicación
1. Permitir acceso a la ubicación GPS
2. Apuntar la cámara hacia el entorno
3. Ver puntos de interés flotando sobre lugares reales
4. Los objetos se actualizan según tu posición

## 🔧 Configuración de Desarrollo

### Estructura del Proyecto
```
RealidadAumentada/
├── index.html              # Página principal
├── manifest.json           # Configuración PWA
├── service-worker.js       # Service Worker para offline
├── css/
│   └── styles.css          # Estilos principales
├── js/
│   ├── app.js             # Controlador principal
│   ├── ar-marker.js       # AR con marcador
│   ├── ar-markerless.js   # AR sin marcador
│   └── ar-location.js     # AR por ubicación
└── icons/                 # Íconos de la PWA
```

### Variables de Configuración

En `js/ar-location.js`:
```javascript
this.maxDistance = 1000; // Distancia máxima en metros
this.minDistance = 10;   // Distancia mínima en metros
```

## 🐛 Solución de Problemas

### La cámara no funciona
- Verificar permisos de cámara en el navegador
- Usar HTTPS (requerido para cámara en producción)
- Comprobar que no hay otras apps usando la cámara

### AR con marcador no detecta
- Asegurar buena iluminación
- Mantener el marcador plano y visible
- Probar con el marcador "Hiro" por defecto

### WebXR no funciona
- Verificar que el dispositivo soporta WebXR
- En Android: habilitar "WebXR Device API" en chrome://flags
- En iOS: funcionalidad limitada, usar AR.js como fallback

### Problemas de ubicación
- Permitir acceso a ubicación en el navegador
- Usar en exterior para mejor señal GPS
- En interior, usar puntos de interés simulados

### App no instala
- Verificar que se está sirviendo por HTTPS
- Comprobar que el manifest.json es válido
- Algunos navegadores requieren interacción del usuario primero

## 🚀 Despliegue en Producción

### Requisitos HTTPS
Para funcionar correctamente en producción, la app debe servirse por HTTPS debido a:
- Acceso a cámara requerido
- Geolocalización precisa
- Service Workers
- WebXR

### Optimizaciones Recomendadas
1. **Comprimir recursos**: Minificar CSS/JS
2. **Optimizar imágenes**: Usar formatos modernos (WebP)
3. **CDN**: Para bibliotecas externas
4. **Caching**: Configurar headers apropiados

### Variables de Entorno
Crear archivo `.env` para configuración específica:
```
AR_MAX_DISTANCE=1000
AR_MIN_DISTANCE=10
GPS_HIGH_ACCURACY=true
DEBUG_MODE=false
```

## 📊 Métricas y Analytics

La app incluye logging básico. Para producción, considerar:
- Google Analytics para uso general
- WebXR Analytics para métricas AR específicas
- Performance monitoring

## 🔐 Seguridad y Privacidad

- **Datos de ubicación**: Solo se usan localmente, no se envían a servidores
- **Imágenes de cámara**: Procesadas solo en el dispositivo
- **Offline First**: Reduce dependencias de red

## 🤝 Contribución

Para contribuir al proyecto:
1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Si encuentras algún problema o tienes preguntas:
- Crear un issue en GitHub
- Consultar la documentación de AR.js
- Revisar la especificación WebXR

## 🔮 Roadmap

### Próximas Características
- [ ] Reconocimiento de imágenes personalizadas
- [ ] Modelos 3D más complejos (GLTF)
- [ ] Multiplayer AR
- [ ] Machine Learning para reconocimiento de objetos
- [ ] Filtros y efectos AR
- [ ] Integración con redes sociales
- [ ] AR Cloud para persistencia

### Mejoras Técnicas
- [ ] Optimización de performance
- [ ] Mejor manejo de memoria
- [ ] Soporte para más formatos de marcadores
- [ ] Interfaz de usuario mejorada
- [ ] Accesibilidad (A11Y)

---

**¡Disfruta creando experiencias de realidad aumentada!** 🎉
