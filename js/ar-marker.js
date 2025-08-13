// AR Marker - Realidad Aumentada con marcadores usando AR.js
class MarkerARController {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.arToolkitSource = null;
        this.arToolkitContext = null;
        this.markerRoot = null;
        this.isInitialized = false;
        this.animationId = null;
    }

    async init() {
        if (this.isInitialized) {
            return;
        }

        console.log('Inicializando AR con marcador...');

        try {
            // Verificar permisos de cámara
            const hasPermission = await this.requestCameraPermission();
            if (!hasPermission) {
                throw new Error('Sin permisos de cámara');
            }

            // Limpiar contenedor anterior
            const container = document.getElementById('marker-ar-scene');
            container.innerHTML = '';

            // Crear escena Three.js
            this.createScene();
            
            // Configurar AR.js
            await this.setupAR();
            
            // Agregar objetos 3D
            this.addARObjects();
            
            // Iniciar render loop
            this.animate();
            
            this.isInitialized = true;
            console.log('AR con marcador inicializado exitosamente');

            if (window.app) {
                window.app.showNotification('AR con marcador listo', 'success');
            }

        } catch (error) {
            console.error('Error inicializando AR con marcador:', error);
            this.showError('Error al inicializar AR: ' + error.message);
        }
    }

    async requestCameraPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            // Detener el stream temporalmente
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('Error con permisos de cámara:', error);
            this.showCameraPermissionPrompt();
            return false;
        }
    }

    showCameraPermissionPrompt() {
        const container = document.getElementById('marker-ar-scene');
        container.innerHTML = `
            <div class="camera-permission">
                <h3>📷 Acceso a la Cámara Requerido</h3>
                <p>Para usar la realidad aumentada, necesitamos acceso a tu cámara.</p>
                <button onclick="location.reload()">Intentar Nuevamente</button>
            </div>
        `;
    }

    createScene() {
        const container = document.getElementById('marker-ar-scene');
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Escena
        this.scene = new THREE.Scene();

        // Cámara
        this.camera = new THREE.Camera();
        this.scene.add(this.camera);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
        container.appendChild(this.renderer.domElement);

        // Luz
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    }

    async setupAR() {
        return new Promise((resolve, reject) => {
            // AR Toolkit Source (video)
            this.arToolkitSource = new THREEx.ArToolkitSource({
                sourceType: 'webcam',
                sourceWidth: 1280,
                sourceHeight: 720,
                displayWidth: window.innerWidth,
                displayHeight: window.innerHeight
            });

            this.arToolkitSource.init(() => {
                // Redimensionar
                this.onResize();
                
                // AR Toolkit Context
                this.arToolkitContext = new THREEx.ArToolkitContext({
                    cameraParametersUrl: 'https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/data/data/camera_para.dat',
                    detectionMode: 'mono_and_matrix',
                    matrixCodeType: '3x3',
                    maxDetectionRate: 30,
                    canvasWidth: 80 * 3,
                    canvasHeight: 60 * 3,
                });

                this.arToolkitContext.init(() => {
                    // Actualizar matriz de la cámara
                    this.camera.projectionMatrix.copy(this.arToolkitContext.getProjectionMatrix());
                    resolve();
                });

                // Handle resize
                window.addEventListener('resize', () => this.onResize());
                
            }, (error) => {
                console.error('Error inicializando AR source:', error);
                reject(error);
            });
        });
    }

    addARObjects() {
        // Crear marker root
        this.markerRoot = new THREE.Group();
        this.scene.add(this.markerRoot);

        // AR Marker Controls (Hiro pattern por defecto)
        const markerControls = new THREEx.ArMarkerControls(this.arToolkitContext, this.markerRoot, {
            type: 'pattern',
            patternUrl: 'https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/data/data/patt.hiro',
            changeMatrixMode: 'cameraTransformMatrix'
        });

        // Agregar cubo 3D
        this.addCube();
        
        // Agregar texto 3D
        this.addText();
        
        // Agregar modelo 3D animado
        this.addAnimatedModel();
    }

    addCube() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const materials = [
            new THREE.MeshLambertMaterial({ color: 0xff0000 }), // Derecha
            new THREE.MeshLambertMaterial({ color: 0x00ff00 }), // Izquierda
            new THREE.MeshLambertMaterial({ color: 0x0000ff }), // Arriba
            new THREE.MeshLambertMaterial({ color: 0xffff00 }), // Abajo
            new THREE.MeshLambertMaterial({ color: 0xff00ff }), // Frente
            new THREE.MeshLambertMaterial({ color: 0x00ffff }), // Atrás
        ];

        const cube = new THREE.Mesh(geometry, materials);
        cube.position.set(0, 0.5, 0);
        cube.castShadow = true;
        cube.receiveShadow = true;
        
        // Animación de rotación
        cube.userData = { 
            type: 'cube',
            rotationSpeed: { x: 0.01, y: 0.02, z: 0.005 }
        };

        this.markerRoot.add(cube);
    }

    addText() {
        const loader = new THREE.FontLoader();
        
        // Crear texto 3D básico sin cargar fuentes externas
        const textGeometry = new THREE.PlaneGeometry(2, 0.5);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#000000';
        context.font = '24px Arial';
        context.textAlign = 'center';
        context.fillText('¡Hola AR!', canvas.width/2, canvas.height/2 + 8);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        
        const textMesh = new THREE.Mesh(textGeometry, material);
        textMesh.position.set(0, 2, 0);
        textMesh.userData = { type: 'text' };
        
        this.markerRoot.add(textMesh);
    }

    addAnimatedModel() {
        // Crear un torus que gire
        const geometry = new THREE.TorusGeometry(0.5, 0.2, 8, 20);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x00ff88,
            shininess: 100,
            transparent: true,
            opacity: 0.8
        });

        const torus = new THREE.Mesh(geometry, material);
        torus.position.set(1.5, 1, 0);
        torus.userData = { 
            type: 'torus',
            rotationSpeed: { x: 0.02, y: 0.03, z: 0.01 },
            floatSpeed: 0.02,
            floatRange: 0.5
        };

        this.markerRoot.add(torus);

        // Agregar esferas orbitando
        for (let i = 0; i < 3; i++) {
            const sphereGeometry = new THREE.SphereGeometry(0.1, 8, 6);
            const sphereMaterial = new THREE.MeshPhongMaterial({ 
                color: new THREE.Color().setHSL(i / 3, 1, 0.5)
            });

            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            const angle = (i / 3) * Math.PI * 2;
            sphere.position.set(
                Math.cos(angle) * 1.5,
                0.5,
                Math.sin(angle) * 1.5
            );
            
            sphere.userData = { 
                type: 'orbitingSphere',
                orbitSpeed: 0.02 + i * 0.01,
                orbitRadius: 1.5,
                orbitCenter: { x: 0, y: 0.5, z: 0 },
                startAngle: angle
            };

            this.markerRoot.add(sphere);
        }
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        if (this.arToolkitSource && this.arToolkitSource.ready) {
            this.arToolkitContext.update(this.arToolkitSource.domElement);
        }

        // Animar objetos
        this.animateObjects();

        // Render
        this.renderer.render(this.scene, this.camera);
    }

    animateObjects() {
        const time = performance.now() * 0.001;

        this.markerRoot.children.forEach((object) => {
            const userData = object.userData;

            switch (userData.type) {
                case 'cube':
                    object.rotation.x += userData.rotationSpeed.x;
                    object.rotation.y += userData.rotationSpeed.y;
                    object.rotation.z += userData.rotationSpeed.z;
                    break;

                case 'torus':
                    object.rotation.x += userData.rotationSpeed.x;
                    object.rotation.y += userData.rotationSpeed.y;
                    object.rotation.z += userData.rotationSpeed.z;
                    object.position.y = 1 + Math.sin(time * userData.floatSpeed) * userData.floatRange;
                    break;

                case 'orbitingSphere':
                    const angle = userData.startAngle + time * userData.orbitSpeed;
                    object.position.x = userData.orbitCenter.x + Math.cos(angle) * userData.orbitRadius;
                    object.position.z = userData.orbitCenter.z + Math.sin(angle) * userData.orbitRadius;
                    object.rotation.y += 0.1;
                    break;
            }
        });
    }

    onResize() {
        if (this.arToolkitSource) {
            this.arToolkitSource.onResizeElement();
            this.arToolkitSource.copyElementSizeTo(this.renderer.domElement);
            
            if (this.arToolkitContext && this.arToolkitContext.arController !== null) {
                this.arToolkitSource.copyElementSizeTo(this.arToolkitContext.arController.canvas);
            }
        }
    }

    showError(message) {
        const container = document.getElementById('marker-ar-scene');
        container.innerHTML = `
            <div class="ar-error">
                <h3>⚠️ Error</h3>
                <p>${message}</p>
                <button onclick="initMarkerAR()">Reintentar</button>
            </div>
        `;
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        if (this.arToolkitSource) {
            if (this.arToolkitSource.domElement && this.arToolkitSource.domElement.srcObject) {
                this.arToolkitSource.domElement.srcObject.getTracks().forEach(track => track.stop());
            }
        }

        if (this.renderer) {
            this.renderer.dispose();
        }

        if (this.scene) {
            this.scene.clear();
        }

        this.isInitialized = false;
        console.log('AR con marcador destruido');
    }
}

// Instancia global
let markerARController = null;

// Función para inicializar AR con marcador
async function initMarkerAR() {
    // Destruir instancia anterior si existe
    if (markerARController) {
        markerARController.destroy();
    }

    // Crear nueva instancia
    markerARController = new MarkerARController();
    await markerARController.init();
}

// Limpiar al cambiar de pantalla
document.addEventListener('screenChange', (event) => {
    if (event.detail.from === 'marker-ar-screen' && markerARController) {
        markerARController.destroy();
        markerARController = null;
    }
});

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.initMarkerAR = initMarkerAR;
    window.MarkerARController = MarkerARController;
}
