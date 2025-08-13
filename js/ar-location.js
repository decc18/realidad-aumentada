// AR Location - Realidad Aumentada basada en ubicación
class LocationARController {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.isInitialized = false;
        this.animationId = null;
        
        // Datos de ubicación
        this.userPosition = null;
        this.userOrientation = null;
        this.locationPoints = [];
        this.arObjects = [];
        
        // Sensores
        this.watchPositionId = null;
        this.deviceOrientationHandler = null;
        
        // Configuración
        this.maxDistance = 1000; // metros
        this.minDistance = 10;   // metros
    }

    async init() {
        if (this.isInitialized) {
            return;
        }

        console.log('Inicializando AR por ubicación...');

        try {
            // Verificar soporte de geolocalización
            if (!navigator.geolocation) {
                throw new Error('Geolocalización no soportada');
            }

            // Verificar permisos de ubicación
            const hasLocationPermission = await this.requestLocationPermission();
            if (!hasLocationPermission) {
                throw new Error('Sin permisos de ubicación');
            }

            // Crear escena 3D
            await this.createScene();

            // Configurar seguimiento de ubicación
            this.setupLocationTracking();

            // Configurar orientación del dispositivo
            this.setupDeviceOrientation();

            // Cargar puntos de interés
            await this.loadLocationPoints();

            // Iniciar render loop
            this.animate();

            this.isInitialized = true;
            console.log('AR por ubicación inicializado exitosamente');

            if (window.app) {
                window.app.showNotification('AR por ubicación listo', 'success');
            }

        } catch (error) {
            console.error('Error inicializando AR por ubicación:', error);
            this.showError('Error al inicializar AR: ' + error.message);
        }
    }

    async requestLocationPermission() {
        try {
            // Verificar permisos actuales
            const result = await navigator.permissions.query({ name: 'geolocation' });
            
            if (result.state === 'granted') {
                return true;
            }

            // Solicitar ubicación para activar el prompt de permisos
            return new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    () => resolve(true),
                    (error) => {
                        console.error('Error de geolocalización:', error);
                        this.showLocationPermissionPrompt();
                        resolve(false);
                    },
                    { enableHighAccuracy: true, timeout: 10000 }
                );
            });
        } catch (error) {
            console.error('Error verificando permisos de ubicación:', error);
            return false;
        }
    }

    showLocationPermissionPrompt() {
        const container = document.getElementById('location-ar-scene');
        container.innerHTML = `
            <div class="camera-permission">
                <h3>📍 Acceso a Ubicación Requerido</h3>
                <p>Para usar AR basado en ubicación, necesitamos acceso a tu ubicación GPS.</p>
                <button onclick="location.reload()">Permitir Ubicación</button>
            </div>
        `;
    }

    async createScene() {
        const container = document.getElementById('location-ar-scene');
        container.innerHTML = '';

        // Crear video de fondo (cámara)
        await this.setupCamera(container);

        const width = container.clientWidth;
        const height = container.clientHeight;

        // Crear escena 3D
        this.scene = new THREE.Scene();

        // Cámara
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);
        this.camera.position.set(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Hacer transparente para mostrar cámara de fondo
        this.renderer.domElement.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 10;
        `;

        container.appendChild(this.renderer.domElement);

        // Luces
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);

        // Crear UI overlay
        this.createUIOverlay(container);
    }

    async setupCamera(container) {
        const video = document.createElement('video');
        video.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 1;
        `;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            video.srcObject = stream;
            video.play();
            container.appendChild(video);
        } catch (error) {
            console.error('Error accediendo a la cámara:', error);
            
            // Fallback sin cámara
            const placeholder = document.createElement('div');
            placeholder.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                justify-content: center;
                align-items: center;
                color: white;
                z-index: 1;
            `;
            placeholder.innerHTML = '<h3>Vista simulada de AR</h3>';
            container.appendChild(placeholder);
        }
    }

    createUIOverlay(container) {
        const overlay = document.createElement('div');
        overlay.id = 'location-ar-overlay';
        overlay.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            z-index: 100;
            pointer-events: none;
        `;

        // Información de estado
        const statusInfo = document.createElement('div');
        statusInfo.id = 'status-info';
        statusInfo.style.cssText = `
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 10px;
        `;
        statusInfo.innerHTML = `
            <div>📍 Ubicación: Buscando...</div>
            <div>🧭 Orientación: Calibrando...</div>
            <div>📡 Puntos cercanos: 0</div>
        `;

        overlay.appendChild(statusInfo);
        container.appendChild(overlay);
    }

    setupLocationTracking() {
        const options = {
            enableHighAccuracy: true,
            maximumAge: 30000,
            timeout: 15000
        };

        this.watchPositionId = navigator.geolocation.watchPosition(
            (position) => {
                this.userPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    altitude: position.coords.altitude || 0
                };

                console.log('Ubicación actualizada:', this.userPosition);
                this.updateLocationPoints();
                this.updateStatusInfo();
            },
            (error) => {
                console.error('Error de geolocalización:', error);
                this.showLocationError(error);
            },
            options
        );
    }

    setupDeviceOrientation() {
        // Verificar si el dispositivo soporta orientación
        if (window.DeviceOrientationEvent) {
            this.deviceOrientationHandler = (event) => {
                this.userOrientation = {
                    alpha: event.alpha, // compass
                    beta: event.beta,   // pitch
                    gamma: event.gamma  // roll
                };
                
                this.updateCameraOrientation();
            };

            // Solicitar permisos en iOS 13+
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission()
                    .then(response => {
                        if (response == 'granted') {
                            window.addEventListener('deviceorientation', this.deviceOrientationHandler);
                        }
                    })
                    .catch(console.error);
            } else {
                window.addEventListener('deviceorientation', this.deviceOrientationHandler);
            }
        }
    }

    async loadLocationPoints() {
        // Simular puntos de interés (en una app real vendrían de una API)
        this.locationPoints = [
            {
                id: 1,
                name: 'Punto de Interés 1',
                description: 'Este es un punto de interés de prueba',
                lat: this.userPosition?.lat + 0.001 || 40.7128,
                lng: this.userPosition?.lng + 0.001 || -74.0060,
                altitude: 10,
                type: 'poi',
                icon: '🏢'
            },
            {
                id: 2,
                name: 'Restaurante',
                description: 'Delicioso restaurante local',
                lat: this.userPosition?.lat - 0.0015 || 40.7118,
                lng: this.userPosition?.lng + 0.0008 || -74.0052,
                altitude: 5,
                type: 'restaurant',
                icon: '🍽️'
            },
            {
                id: 3,
                name: 'Parque',
                description: 'Hermoso parque para relajarse',
                lat: this.userPosition?.lat + 0.0008 || 40.7136,
                lng: this.userPosition?.lng - 0.0012 || -74.0072,
                altitude: 0,
                type: 'park',
                icon: '🌳'
            },
            {
                id: 4,
                name: 'Museo',
                description: 'Museo de arte contemporáneo',
                lat: this.userPosition?.lat - 0.0005 || 40.7123,
                lng: this.userPosition?.lng - 0.0018 || -74.0078,
                altitude: 15,
                type: 'museum',
                icon: '🏛️'
            }
        ];

        // Si no tenemos ubicación real, usar coordenadas por defecto
        if (!this.userPosition) {
            this.userPosition = {
                lat: 40.7128,
                lng: -74.0060,
                accuracy: 10,
                altitude: 0
            };
        }

        this.createARObjects();
    }

    createARObjects() {
        // Limpiar objetos anteriores
        this.arObjects.forEach(obj => {
            this.scene.remove(obj);
        });
        this.arObjects = [];

        this.locationPoints.forEach(point => {
            const distance = this.calculateDistance(
                this.userPosition.lat, 
                this.userPosition.lng,
                point.lat, 
                point.lng
            );

            // Solo mostrar puntos dentro del rango
            if (distance <= this.maxDistance && distance >= this.minDistance) {
                const arObject = this.createLocationObject(point, distance);
                this.scene.add(arObject);
                this.arObjects.push(arObject);
            }
        });

        console.log(`Creados ${this.arObjects.length} objetos AR`);
    }

    createLocationObject(point, distance) {
        const group = new THREE.Group();

        // Calcular posición 3D basada en coordenadas GPS
        const position = this.gpsToCartesian(point.lat, point.lng, point.altitude);
        
        // Escalar basado en distancia
        const scale = Math.max(0.5, Math.min(2, (this.maxDistance - distance) / this.maxDistance));

        // Crear geometría principal
        const geometry = new THREE.CylinderGeometry(0, 0.3 * scale, 1 * scale, 8);
        const material = new THREE.MeshLambertMaterial({ 
            color: this.getColorByType(point.type),
            transparent: true,
            opacity: 0.8
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 0.5 * scale, 0);
        group.add(mesh);

        // Agregar texto con información
        const textSprite = this.createTextSprite(point, distance);
        textSprite.position.set(0, 1.5 * scale, 0);
        group.add(textSprite);

        // Crear pulso animado
        const pulseGeometry = new THREE.RingGeometry(0.8 * scale, 1 * scale, 16);
        const pulseMaterial = new THREE.MeshBasicMaterial({
            color: this.getColorByType(point.type),
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const pulseRing = new THREE.Mesh(pulseGeometry, pulseMaterial);
        pulseRing.rotation.x = -Math.PI / 2;
        group.add(pulseRing);

        // Posicionar grupo
        group.position.copy(position);
        
        // Almacenar datos del punto
        group.userData = {
            point: point,
            distance: distance,
            originalScale: scale,
            pulseRing: pulseRing,
            textSprite: textSprite
        };

        return group;
    }

    createTextSprite(point, distance) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;

        // Fondo
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Borde
        context.strokeStyle = '#ffffff';
        context.lineWidth = 2;
        context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

        // Texto
        context.fillStyle = '#ffffff';
        context.font = 'bold 16px Arial';
        context.textAlign = 'center';
        
        // Icono y nombre
        context.fillText(`${point.icon} ${point.name}`, canvas.width / 2, 30);
        
        // Distancia
        context.font = '12px Arial';
        context.fillText(`${Math.round(distance)}m`, canvas.width / 2, 50);
        
        // Descripción
        context.font = '10px Arial';
        context.fillText(point.description.substring(0, 30) + '...', canvas.width / 2, 70);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(2, 1, 1);

        return sprite;
    }

    gpsToCartesian(lat, lng, alt) {
        if (!this.userPosition) {
            return new THREE.Vector3(0, 0, 0);
        }

        // Convertir diferencias de GPS a coordenadas cartesianas
        const R = 6371000; // Radio de la Tierra en metros
        
        const dLat = (lat - this.userPosition.lat) * Math.PI / 180;
        const dLng = (lng - this.userPosition.lng) * Math.PI / 180;
        
        const x = dLng * R * Math.cos(this.userPosition.lat * Math.PI / 180);
        const z = -dLat * R; // Negativo para que el norte sea -Z
        const y = alt - this.userPosition.altitude;

        return new THREE.Vector3(x, y, z);
    }

    getColorByType(type) {
        const colors = {
            poi: 0x2196F3,        // Azul
            restaurant: 0xFF5722,  // Naranja
            park: 0x4CAF50,       // Verde
            museum: 0x9C27B0,     // Púrpura
            default: 0xFFFFFF     // Blanco
        };
        
        return colors[type] || colors.default;
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371000; // Radio de la Tierra en metros
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return distance;
    }

    updateLocationPoints() {
        if (this.userPosition && this.locationPoints.length > 0) {
            this.createARObjects();
        }
    }

    updateCameraOrientation() {
        if (this.userOrientation && this.camera) {
            // Convertir orientación del dispositivo a rotación de cámara
            const alpha = this.userOrientation.alpha * Math.PI / 180; // Compass
            const beta = this.userOrientation.beta * Math.PI / 180;   // Pitch
            const gamma = this.userOrientation.gamma * Math.PI / 180; // Roll

            this.camera.rotation.set(beta, alpha, -gamma);
        }
    }

    updateStatusInfo() {
        const statusInfo = document.getElementById('status-info');
        if (statusInfo && this.userPosition) {
            const nearbyPoints = this.arObjects.length;
            
            statusInfo.innerHTML = `
                <div>📍 Ubicación: ${this.userPosition.lat.toFixed(4)}, ${this.userPosition.lng.toFixed(4)}</div>
                <div>🧭 Orientación: ${this.userOrientation ? 'Activa' : 'Inactiva'}</div>
                <div>📡 Puntos cercanos: ${nearbyPoints}</div>
            `;
        }
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        // Animar objetos AR
        this.animateARObjects();

        // Render
        this.renderer.render(this.scene, this.camera);
    }

    animateARObjects() {
        const time = performance.now() * 0.001;

        this.arObjects.forEach((obj, index) => {
            const userData = obj.userData;
            
            // Hacer que los objetos miren siempre hacia la cámara
            obj.lookAt(this.camera.position);
            
            // Animación de pulso
            if (userData.pulseRing) {
                const pulseScale = 1 + Math.sin(time * 2 + index) * 0.2;
                userData.pulseRing.scale.set(pulseScale, pulseScale, 1);
                
                const pulseOpacity = 0.3 + Math.sin(time * 2 + index) * 0.2;
                userData.pulseRing.material.opacity = pulseOpacity;
            }

            // Flotación suave
            const originalY = userData.point.altitude || 0;
            obj.position.y = originalY + Math.sin(time * 1.5 + index) * 0.1;
        });
    }

    showLocationError(error) {
        let message = 'Error de ubicación desconocido';
        
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = 'Permisos de ubicación denegados';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Ubicación no disponible';
                break;
            case error.TIMEOUT:
                message = 'Timeout al obtener ubicación';
                break;
        }

        const container = document.getElementById('location-ar-scene');
        container.innerHTML = `
            <div class="ar-error">
                <h3>📍 Error de Ubicación</h3>
                <p>${message}</p>
                <button onclick="initLocationAR()">Reintentar</button>
            </div>
        `;
    }

    showError(message) {
        const container = document.getElementById('location-ar-scene');
        container.innerHTML = `
            <div class="ar-error">
                <h3>⚠️ Error</h3>
                <p>${message}</p>
                <button onclick="initLocationAR()">Reintentar</button>
            </div>
        `;
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // Detener seguimiento de ubicación
        if (this.watchPositionId) {
            navigator.geolocation.clearWatch(this.watchPositionId);
            this.watchPositionId = null;
        }

        // Detener seguimiento de orientación
        if (this.deviceOrientationHandler) {
            window.removeEventListener('deviceorientation', this.deviceOrientationHandler);
            this.deviceOrientationHandler = null;
        }

        // Limpiar escena
        if (this.renderer) {
            this.renderer.dispose();
        }

        if (this.scene) {
            this.scene.clear();
        }

        // Detener video stream
        const video = document.querySelector('#location-ar-scene video');
        if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }

        this.isInitialized = false;
        this.arObjects = [];
        console.log('AR por ubicación destruido');
    }
}

// Instancia global
let locationARController = null;

// Función para inicializar AR por ubicación
async function initLocationAR() {
    if (locationARController) {
        locationARController.destroy();
    }

    locationARController = new LocationARController();
    await locationARController.init();
}

// Limpiar al cambiar de pantalla
document.addEventListener('screenChange', (event) => {
    if (event.detail.from === 'location-ar-screen' && locationARController) {
        locationARController.destroy();
        locationARController = null;
    }
});

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.initLocationAR = initLocationAR;
    window.LocationARController = LocationARController;
}
