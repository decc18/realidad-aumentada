// AR Product Recognition - Reconocimiento específico de productos
class ProductARRecognition {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.arToolkitSource = null;
        this.arToolkitContext = null;
        this.markerRoot = null;
        this.products = {};
        this.currentProduct = null;
        this.infoPanel = null;
        this.isInitialized = false;
        this.animationId = null;
    }

    // Configuración del producto - Ducha de mano
    setupProducts() {
        this.products = {
            'ducha-premium': {
                name: 'Ducha de Mano Premium Spa',
                model: 'SH-2024-PRO',
                description: 'Ducha de mano de lujo con múltiples funciones de masaje y tecnología de ahorro de agua',
                price: '$89.99',
                originalPrice: '$129.99',
                discount: '30% OFF',
                features: [
                    '5 modos de chorro diferentes',
                    'Tecnología de ahorro de agua (-30%)',
                    'Cabezal con función de masaje',
                    'Acabado cromado premium',
                    'Manguera flexible de 1.5m',
                    'Fácil instalación sin herramientas'
                ],
                specifications: {
                    'Material': 'Acero inoxidable 304 + ABS',
                    'Presión': '0.05-0.9 MPa',
                    'Temperatura': 'Hasta 80°C',
                    'Dimensiones': '250 x 95 x 35 mm',
                    'Peso': '380g',
                    'Garantía': '5 años'
                },
                accessories: [
                    'Soporte de pared ajustable',
                    'Filtro de agua integrado',
                    'Cabezal de masaje intercambiable',
                    'Anillo antideslizante',
                    'Manual de instalación'
                ],
                colors: ['Cromado', 'Níquel Cepillado', 'Negro Mate'],
                rating: 4.8,
                reviews: 1247,
                inStock: true,
                freeShipping: true,
                warranty: '5 años de garantía',
                certifications: ['CE', 'ISO 9001', 'Eco-Friendly'],
                videoUrl: 'https://example.com/product-demo.mp4',
                manualUrl: 'https://example.com/manual.pdf'
            }
        };
    }

    async init(containerId) {
        if (this.isInitialized) {
            return;
        }

        console.log('Inicializando reconocimiento de productos...');

        try {
            // Verificar permisos de cámara
            const hasPermission = await this.requestCameraPermission();
            if (!hasPermission) {
                throw new Error('Sin permisos de cámara');
            }

            this.setupProducts();
            
            const container = document.getElementById(containerId);
            container.innerHTML = '';

            // Crear escena Three.js
            this.createScene(container);
            
            // Configurar AR.js
            await this.setupAR();
            
            // Agregar marcador del producto
            this.createProductMarker();
            
            // Crear panel de información
            this.createInfoPanel(container);

            // Iniciar render loop
            this.animate();
            
            this.isInitialized = true;
            console.log('Reconocimiento de productos inicializado exitosamente');

            if (window.app) {
                window.app.showNotification('¡Apunta la cámara hacia el producto!', 'info');
            }

        } catch (error) {
            console.error('Error inicializando reconocimiento de productos:', error);
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
        const container = document.getElementById('product-ar-scene');
        container.innerHTML = `
            <div class="camera-permission">
                <h3>📷 Acceso a la Cámara Requerido</h3>
                <p>Para reconocer productos con AR, necesitamos acceso a tu cámara.</p>
                <button onclick="location.reload()">Permitir Cámara</button>
            </div>
        `;
    }

    createScene(container) {
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

        // Luces
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

    createProductMarker() {
        // Crear marker root
        this.markerRoot = new THREE.Group();
        this.scene.add(this.markerRoot);

        // AR Marker Controls para el producto
        const markerControls = new THREEx.ArMarkerControls(this.arToolkitContext, this.markerRoot, {
            type: 'pattern',
            patternUrl: 'https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/data/data/patt.hiro',
            changeMatrixMode: 'cameraTransformMatrix'
        });

        // Eventos de detección
        markerControls.addEventListener('markerFound', () => {
            this.onProductDetected('ducha-premium');
        });

        markerControls.addEventListener('markerLost', () => {
            this.onProductLost('ducha-premium');
        });

        // Agregar contenido 3D del producto
        this.addProductContent();
    }

    addProductContent() {
        const group = new THREE.Group();

        // Simular la forma de la ducha
        const handleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 16);
        const handleMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xc0c0c0,
            shininess: 100,
            specular: 0x444444
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.set(0, 0.5, 0);
        group.add(handle);

        // Cabezal de la ducha
        const headGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.08, 32);
        const headMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xe0e0e0,
            shininess: 120,
            specular: 0x666666
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 1, 0);
        head.rotation.x = Math.PI / 2;
        group.add(head);

        // Detalles del cabezal
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const radius = 0.08;
            const holeGeometry = new THREE.SphereGeometry(0.005, 8, 8);
            const holeMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
            const hole = new THREE.Mesh(holeGeometry, holeMaterial);
            hole.position.set(
                Math.cos(angle) * radius,
                1.04,
                Math.sin(angle) * radius
            );
            group.add(hole);
        }

        // Efectos de agua (partículas)
        this.addWaterEffect(group);

        // Información flotante
        this.addFloatingInfo(group);

        // Animación de rotación suave
        group.userData = { 
            type: 'product',
            rotationSpeed: 0.005,
            originalRotation: group.rotation.y
        };

        this.markerRoot.add(group);
    }

    addWaterEffect(parentGroup) {
        // Crear efecto de gotitas de agua
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 50;
        const posArray = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 0.3;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.01,
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.6
        });

        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        particlesMesh.position.set(0, 1.2, 0);
        
        particlesMesh.userData = {
            type: 'waterParticles',
            animateWater: true
        };
        
        parentGroup.add(particlesMesh);
    }

    addFloatingInfo(parentGroup) {
        // Crear texto flotante con información clave
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 256;

        // Fondo con gradiente
        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, 'rgba(33, 150, 243, 0.9)');
        gradient.addColorStop(1, 'rgba(21, 101, 192, 0.9)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Borde redondeado (simulado)
        context.strokeStyle = '#ffffff';
        context.lineWidth = 4;
        context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

        // Texto
        context.fillStyle = '#ffffff';
        context.font = 'bold 28px Arial';
        context.textAlign = 'center';
        context.fillText('Ducha Premium Spa', canvas.width / 2, 50);
        
        context.font = 'bold 36px Arial';
        context.fillStyle = '#FFD700';
        context.fillText('$89.99', canvas.width / 2, 100);
        
        context.font = '18px Arial';
        context.fillStyle = '#ffffff';
        context.fillText('30% OFF - 5 Modos de Chorro', canvas.width / 2, 130);
        context.fillText('¡Toca para ver más detalles!', canvas.width / 2, 160);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(2, 1, 1);
        sprite.position.set(0, 2, 0);

        parentGroup.add(sprite);
    }

    onProductDetected(productId) {
        console.log(`¡Producto detectado: ${productId}!`);
        this.currentProduct = productId;
        this.showProductInfo(productId);
        
        if (window.app) {
            window.app.showNotification('¡Ducha Premium detectada!', 'success');
        }

        // Agregar efectos sonoros si están disponibles
        this.playDetectionSound();
    }

    onProductLost(productId) {
        console.log(`Producto perdido: ${productId}`);
        if (this.currentProduct === productId) {
            this.currentProduct = null;
            // Mantener el panel abierto por unos segundos más
            setTimeout(() => {
                if (!this.currentProduct) {
                    this.hideProductInfo();
                }
            }, 3000);
        }
    }

    showProductInfo(productId) {
        const product = this.products[productId];
        
        if (this.infoPanel) {
            this.infoPanel.innerHTML = `
                <div class="product-info-content">
                    <button class="close-info" onclick="productAR.hideProductInfo()">×</button>
                    
                    <div class="product-header">
                        <h3>${product.name}</h3>
                        <div class="product-model">${product.model}</div>
                        <div class="product-rating">
                            ${'★'.repeat(Math.floor(product.rating))}
                            <span>${product.rating}/5 (${product.reviews} reseñas)</span>
                        </div>
                    </div>

                    <div class="product-pricing">
                        <div class="current-price">${product.price}</div>
                        <div class="original-price">${product.originalPrice}</div>
                        <div class="discount-badge">${product.discount}</div>
                    </div>

                    <p class="product-description">${product.description}</p>

                    <div class="product-features">
                        <h4>🔧 Características principales:</h4>
                        <ul>
                            ${product.features.map(feature => `<li>• ${feature}</li>`).join('')}
                        </ul>
                    </div>

                    <div class="product-specs">
                        <h4>📋 Especificaciones técnicas:</h4>
                        <div class="specs-grid">
                            ${Object.entries(product.specifications).map(([key, value]) => `
                                <div class="spec-item">
                                    <span class="spec-label">${key}:</span>
                                    <span class="spec-value">${value}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="product-accessories">
                        <h4>📦 Incluye en la caja:</h4>
                        <ul class="accessories-list">
                            ${product.accessories.map(accessory => `<li>✓ ${accessory}</li>`).join('')}
                        </ul>
                    </div>

                    <div class="product-colors">
                        <h4>🎨 Colores disponibles:</h4>
                        <div class="color-options">
                            ${product.colors.map(color => `
                                <span class="color-option">${color}</span>
                            `).join('')}
                        </div>
                    </div>

                    <div class="product-badges">
                        ${product.inStock ? '<span class="badge in-stock">En Stock</span>' : '<span class="badge out-stock">Agotado</span>'}
                        ${product.freeShipping ? '<span class="badge free-shipping">Envío Gratis</span>' : ''}
                        <span class="badge warranty">${product.warranty}</span>
                    </div>

                    <div class="certifications">
                        <h4>🏆 Certificaciones:</h4>
                        <div class="cert-badges">
                            ${product.certifications.map(cert => `<span class="cert-badge">${cert}</span>`).join('')}
                        </div>
                    </div>

                    <div class="product-actions">
                        <button class="btn-primary btn-large" onclick="addToCart('${productId}')">
                            🛒 Agregar al Carrito
                        </button>
                        <button class="btn-secondary" onclick="addToWishlist('${productId}')">
                            ❤️ Lista de deseos
                        </button>
                        <button class="btn-secondary" onclick="shareProduct('${productId}')">
                            📤 Compartir
                        </button>
                        <button class="btn-info" onclick="showProductVideo('${productId}')">
                            ▶️ Ver Demo
                        </button>
                        <button class="btn-info" onclick="downloadManual('${productId}')">
                            📄 Manual PDF
                        </button>
                    </div>
                </div>
            `;
            this.infoPanel.classList.add('show');
        }
    }

    hideProductInfo() {
        if (this.infoPanel) {
            this.infoPanel.classList.remove('show');
        }
    }

    createInfoPanel(container) {
        this.infoPanel = document.createElement('div');
        this.infoPanel.className = 'product-info-panel';
        container.appendChild(this.infoPanel);
    }

    playDetectionSound() {
        // Crear un beep suave cuando se detecta el producto
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            console.log('Audio no disponible');
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

            if (userData.type === 'product') {
                // Rotación suave del producto
                object.rotation.y = userData.originalRotation + Math.sin(time * userData.rotationSpeed) * 0.5;
            }

            // Animar partículas de agua
            object.traverse((child) => {
                if (child.userData.animateWater) {
                    const positions = child.geometry.attributes.position.array;
                    for (let i = 1; i < positions.length; i += 3) {
                        positions[i] -= 0.01; // Caída
                        if (positions[i] < -0.5) {
                            positions[i] = 0.2; // Reset
                        }
                    }
                    child.geometry.attributes.position.needsUpdate = true;
                }
            });
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
        const container = document.getElementById('product-ar-scene');
        container.innerHTML = `
            <div class="ar-error">
                <h3>⚠️ Error</h3>
                <p>${message}</p>
                <button onclick="initProductAR()">Reintentar</button>
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
        console.log('Reconocimiento de productos destruido');
    }
}

// Funciones globales para las acciones de productos
function addToCart(productId) {
    console.log(`Agregando ${productId} al carrito`);
    if (window.app) {
        window.app.showNotification('¡Ducha Premium agregada al carrito! 🛒', 'success');
    }
    
    // Simular animación de agregado al carrito
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '✓ Agregado';
    button.style.background = '#4CAF50';
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = '';
    }, 2000);
}

function addToWishlist(productId) {
    console.log(`Agregando ${productId} a lista de deseos`);
    if (window.app) {
        window.app.showNotification('¡Agregado a tu lista de deseos! ❤️', 'success');
    }
}

function shareProduct(productId) {
    const product = productAR.products[productId];
    if (navigator.share) {
        navigator.share({
            title: product.name,
            text: `${product.description} - Solo ${product.price}!`,
            url: window.location.href
        });
    } else {
        const shareText = `¡Mira esta ${product.name}! ${product.description} - Solo ${product.price}. ${window.location.href}`;
        navigator.clipboard.writeText(shareText);
        if (window.app) {
            window.app.showNotification('¡Enlace copiado al portapapeles! 📤', 'success');
        }
    }
}

function showProductVideo(productId) {
    const product = productAR.products[productId];
    // Simular apertura de video
    if (window.app) {
        window.app.showNotification('🎥 Video demo próximamente disponible', 'info');
    }
}

function downloadManual(productId) {
    // Simular descarga de manual
    if (window.app) {
        window.app.showNotification('📄 Manual de instalación descargándose...', 'info');
    }
}

// Instancia global
let productAR = null;

// Función para inicializar reconocimiento de productos
async function initProductAR() {
    if (productAR) {
        productAR.destroy();
    }

    productAR = new ProductARRecognition();
    await productAR.init('product-ar-scene');
}

// Limpiar al cambiar de pantalla
document.addEventListener('screenChange', (event) => {
    if (event.detail && event.detail.from === 'product-ar-screen' && productAR) {
        productAR.destroy();
        productAR = null;
    }
});

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.initProductAR = initProductAR;
    window.ProductARRecognition = ProductARRecognition;
    window.addToCart = addToCart;
    window.addToWishlist = addToWishlist;
    window.shareProduct = shareProduct;
    window.showProductVideo = showProductVideo;
    window.downloadManual = downloadManual;
}
