// AR Markerless - Realidad Aumentada sin marcadores
class MarkerlessARController {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.xrSession = null;
        this.xrRefSpace = null;
        this.gl = null;
        this.objects = [];
        this.hitTestSource = null;
        this.isInitialized = false;
        this.animationId = null;
        this.reticle = null;
        this.placedObjects = [];
    }

    async init() {
        if (this.isInitialized) {
            return;
        }

        console.log('Inicializando AR sin marcador...');

        try {
            // Verificar soporte WebXR
            const isWebXRSupported = await this.checkWebXRSupport();
            
            if (isWebXRSupported) {
                await this.initWebXR();
            } else {
                // Fallback a AR básico con detección de superficies simulada
                await this.initFallbackAR();
            }

            this.isInitialized = true;
            console.log('AR sin marcador inicializado exitosamente');

            if (window.app) {
                window.app.showNotification('AR sin marcador listo', 'success');
            }

        } catch (error) {
            console.error('Error inicializando AR sin marcador:', error);
            this.showError('Error al inicializar AR: ' + error.message);
        }
    }

    async checkWebXRSupport() {
        if (!('xr' in navigator)) {
            console.log('WebXR no disponible');
            return false;
        }

        try {
            const supported = await navigator.xr.isSessionSupported('immersive-ar');
            console.log('WebXR AR soportado:', supported);
            return supported;
        } catch (error) {
            console.error('Error verificando WebXR:', error);
            return false;
        }
    }

    async initWebXR() {
        const container = document.getElementById('markerless-ar-scene');
        container.innerHTML = '';

        // Crear escena Three.js
        this.createScene();

        // Configurar WebXR
        this.renderer.xr.enabled = true;

        // Botón para iniciar AR
        const startButton = document.createElement('button');
        startButton.textContent = 'Iniciar AR';
        startButton.className = 'start-ar-btn';
        startButton.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 15px 30px;
            font-size: 18px;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            z-index: 100;
        `;

        startButton.onclick = () => this.startXRSession();
        container.appendChild(startButton);

        // Agregar renderer al DOM
        container.appendChild(this.renderer.domElement);

        // Crear reticle para indicar dónde se pueden colocar objetos
        this.createReticle();
    }

    async initFallbackAR() {
        const container = document.getElementById('markerless-ar-scene');
        container.innerHTML = '';

        // Mostrar mensaje de fallback
        const fallbackMessage = document.createElement('div');
        fallbackMessage.className = 'fallback-message';
        fallbackMessage.innerHTML = `
            <h3>📱 AR Simulado</h3>
            <p>WebXR no está disponible en este dispositivo. Usando modo simulado.</p>
            <small>En dispositivos compatibles, podrás colocar objetos en el mundo real.</small>
        `;
        fallbackMessage.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            z-index: 100;
        `;
        container.appendChild(fallbackMessage);

        // Crear escena básica con cámara web
        await this.createFallbackScene();

        // Iniciar loop de renderizado
        this.animate();
    }

    async createFallbackScene() {
        const container = document.getElementById('markerless-ar-scene');
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Crear video element para cámara
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
            this.showCameraError();
            return;
        }

        // Crear escena 3D encima del video
        this.scene = new THREE.Scene();
        
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 2, 5);

        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Hacer el renderer transparente para mostrar el video debajo
        this.renderer.domElement.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 10;
        `;
        
        container.appendChild(this.renderer.domElement);

        // Agregar luces
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Simular superficie para colocar objetos
        this.createSimulatedSurface();

        // Agregar controles de cámara para navegación
        this.addCameraControls();
    }

    createScene() {
        const container = document.getElementById('markerless-ar-scene');
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.scene.add(this.camera);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Luces
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1).normalize();
        this.scene.add(directionalLight);
    }

    createReticle() {
        const geometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        this.reticle = new THREE.Mesh(geometry, material);
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.scene.add(this.reticle);
    }

    createSimulatedSurface() {
        // Crear un plano invisible para simular el suelo
        const geometry = new THREE.PlaneGeometry(20, 20);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00, 
            transparent: true, 
            opacity: 0.1,
            side: THREE.DoubleSide
        });

        const surface = new THREE.Mesh(geometry, material);
        surface.rotation.x = -Math.PI / 2;
        surface.position.y = -2;
        surface.receiveShadow = true;
        this.scene.add(surface);

        // Agregar algunos objetos de referencia
        this.addReferenceObjects();
    }

    addReferenceObjects() {
        // Cubo de referencia
        const cubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x44aa88 });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.position.set(-2, -1.5, -3);
        cube.castShadow = true;
        this.scene.add(cube);

        // Esfera de referencia
        const sphereGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xaa4488 });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(2, -1.7, -4);
        sphere.castShadow = true;
        this.scene.add(sphere);
    }

    addCameraControls() {
        let isMouseDown = false;
        let mouseX = 0;
        let mouseY = 0;

        const container = this.renderer.domElement.parentElement;

        container.addEventListener('mousedown', (event) => {
            isMouseDown = true;
            mouseX = event.clientX;
            mouseY = event.clientY;
        });

        container.addEventListener('mousemove', (event) => {
            if (!isMouseDown) return;

            const deltaX = event.clientX - mouseX;
            const deltaY = event.clientY - mouseY;

            this.camera.rotation.y -= deltaX * 0.01;
            this.camera.rotation.x -= deltaY * 0.01;

            mouseX = event.clientX;
            mouseY = event.clientY;
        });

        container.addEventListener('mouseup', () => {
            isMouseDown = false;
        });

        // Controles táctiles
        container.addEventListener('touchstart', (event) => {
            if (event.touches.length === 1) {
                mouseX = event.touches[0].clientX;
                mouseY = event.touches[0].clientY;
            }
        });

        container.addEventListener('touchmove', (event) => {
            if (event.touches.length === 1) {
                const deltaX = event.touches[0].clientX - mouseX;
                const deltaY = event.touches[0].clientY - mouseY;

                this.camera.rotation.y -= deltaX * 0.01;
                this.camera.rotation.x -= deltaY * 0.01;

                mouseX = event.touches[0].clientX;
                mouseY = event.touches[0].clientY;
            }
        });
    }

    async startXRSession() {
        try {
            this.xrSession = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['local', 'hit-test']
            });

            // Configurar referSpace
            this.xrRefSpace = await this.xrSession.requestReferenceSpace('local');

            // Configurar hit testing
            const viewerSpace = await this.xrSession.requestReferenceSpace('viewer');
            this.hitTestSource = await this.xrSession.requestHitTestSource({ space: viewerSpace });

            // Iniciar render loop de XR
            this.xrSession.requestAnimationFrame(this.onXRFrame.bind(this));

            // Eventos de sesión
            this.xrSession.addEventListener('end', () => {
                this.xrSession = null;
                this.hitTestSource = null;
            });

            // Ocultar botón de inicio
            const startButton = document.querySelector('.start-ar-btn');
            if (startButton) startButton.style.display = 'none';

        } catch (error) {
            console.error('Error iniciando sesión XR:', error);
            this.showError('No se pudo iniciar AR: ' + error.message);
        }
    }

    onXRFrame(time, frame) {
        this.xrSession.requestAnimationFrame(this.onXRFrame.bind(this));

        const session = frame.session;
        const pose = frame.getViewerPose(this.xrRefSpace);

        if (pose) {
            const view = pose.views[0];
            
            // Hit testing
            if (this.hitTestSource) {
                const hitTestResults = frame.getHitTestResults(this.hitTestSource);
                
                if (hitTestResults.length > 0) {
                    const hitPose = hitTestResults[0].getPose(this.xrRefSpace);
                    
                    this.reticle.visible = true;
                    this.reticle.position.setFromMatrixPosition(hitPose.transform.matrix);
                    this.reticle.updateMatrixWorld(true);
                } else {
                    this.reticle.visible = false;
                }
            }

            // Actualizar cámara
            this.camera.matrix.fromArray(view.transform.matrix);
            this.camera.projectionMatrix.fromArray(view.projectionMatrix);
            this.camera.updateMatrixWorld(true);

            // Render
            this.renderer.render(this.scene, this.camera);
        }
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        // Animar objetos colocados
        this.animatePlacedObjects();

        // Render escena
        this.renderer.render(this.scene, this.camera);
    }

    animatePlacedObjects() {
        const time = performance.now() * 0.001;

        this.placedObjects.forEach((obj, index) => {
            if (obj.userData.animationType === 'rotate') {
                obj.rotation.y += 0.01;
            } else if (obj.userData.animationType === 'float') {
                obj.position.y = obj.userData.originalY + Math.sin(time + index) * 0.2;
            }
        });
    }

    addObject(type = 'cube') {
        let object;
        const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xff44ff, 0x44ffff, 0xffff44];
        const color = colors[Math.floor(Math.random() * colors.length)];

        switch (type) {
            case 'cube':
                const cubeGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
                const cubeMaterial = new THREE.MeshLambertMaterial({ color });
                object = new THREE.Mesh(cubeGeometry, cubeMaterial);
                object.userData.animationType = 'rotate';
                break;

            case 'sphere':
                const sphereGeometry = new THREE.SphereGeometry(0.1, 16, 16);
                const sphereMaterial = new THREE.MeshLambertMaterial({ color });
                object = new THREE.Mesh(sphereGeometry, sphereMaterial);
                object.userData.animationType = 'float';
                break;

            case 'cone':
                const coneGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
                const coneMaterial = new THREE.MeshLambertMaterial({ color });
                object = new THREE.Mesh(coneGeometry, coneMaterial);
                object.userData.animationType = 'rotate';
                break;

            default:
                return;
        }

        // Posicionar objeto
        if (this.xrSession && this.reticle.visible) {
            // En XR, colocar en la posición del reticle
            object.position.copy(this.reticle.position);
            object.position.y += 0.1;
        } else {
            // En modo fallback, colocar delante de la cámara
            const distance = 2;
            object.position.set(
                (Math.random() - 0.5) * 2,
                -1.5 + Math.random() * 0.5,
                -distance + Math.random()
            );
        }

        object.userData.originalY = object.position.y;
        object.castShadow = true;
        object.receiveShadow = true;

        this.scene.add(object);
        this.placedObjects.push(object);

        if (window.app) {
            window.app.showNotification(`${type} agregado`, 'success');
        }
    }

    showCameraError() {
        const container = document.getElementById('markerless-ar-scene');
        container.innerHTML = `
            <div class="camera-permission">
                <h3>📷 Error de Cámara</h3>
                <p>No se pudo acceder a la cámara. Verifica los permisos.</p>
                <button onclick="location.reload()">Reintentar</button>
            </div>
        `;
    }

    showError(message) {
        const container = document.getElementById('markerless-ar-scene');
        container.innerHTML = `
            <div class="ar-error">
                <h3>⚠️ Error</h3>
                <p>${message}</p>
                <button onclick="initMarkerlessAR()">Reintentar</button>
            </div>
        `;
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        if (this.xrSession) {
            this.xrSession.end();
        }

        if (this.renderer) {
            this.renderer.dispose();
        }

        if (this.scene) {
            this.scene.clear();
        }

        // Detener stream de video si existe
        const video = document.querySelector('#markerless-ar-scene video');
        if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }

        this.isInitialized = false;
        this.placedObjects = [];
        console.log('AR sin marcador destruido');
    }
}

// Instancia global
let markerlessARController = null;

// Función para inicializar AR sin marcador
async function initMarkerlessAR() {
    if (markerlessARController) {
        markerlessARController.destroy();
    }

    markerlessARController = new MarkerlessARController();
    await markerlessARController.init();
}

// Función para agregar objetos
function addObject() {
    if (markerlessARController && markerlessARController.isInitialized) {
        const types = ['cube', 'sphere', 'cone'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        markerlessARController.addObject(randomType);
    }
}

// Limpiar al cambiar de pantalla
document.addEventListener('screenChange', (event) => {
    if (event.detail.from === 'markerless-ar-screen' && markerlessARController) {
        markerlessARController.destroy();
        markerlessARController = null;
    }
});

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.initMarkerlessAR = initMarkerlessAR;
    window.addObject = addObject;
    window.MarkerlessARController = MarkerlessARController;
}
