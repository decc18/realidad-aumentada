// App.js - Controlador principal de la aplicación
class ARPWAApp {
    constructor() {
        this.currentScreen = 'home-screen';
        this.isMenuOpen = false;
        this.installPrompt = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.hideLoadingScreen();
        this.setupPWA();
        this.handleURLParams();
    }

    setupEventListeners() {
        // Menu toggle
        const menuToggle = document.getElementById('menu-toggle');
        const sideMenu = document.getElementById('side-menu');
        const closeMenu = document.querySelector('.close-menu');

        menuToggle.addEventListener('click', () => this.toggleMenu());
        closeMenu.addEventListener('click', () => this.closeMenu());
        
        // Click fuera del menu para cerrarlo
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen && !sideMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                this.closeMenu();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.isMenuOpen) {
                    this.closeMenu();
                } else if (this.currentScreen !== 'home-screen') {
                    this.showHomeScreen();
                }
            }
        });

        // PWA install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.installPrompt = e;
            this.showInstallButton();
        });

        // Handle app installed
        window.addEventListener('appinstalled', () => {
            this.showNotification('¡Aplicación instalada exitosamente!', 'success');
            this.hideInstallButton();
        });
    }

    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 2000);
    }

    toggleMenu() {
        const sideMenu = document.getElementById('side-menu');
        this.isMenuOpen = !this.isMenuOpen;
        
        if (this.isMenuOpen) {
            sideMenu.classList.add('active');
        } else {
            sideMenu.classList.remove('active');
        }
    }

    closeMenu() {
        const sideMenu = document.getElementById('side-menu');
        this.isMenuOpen = false;
        sideMenu.classList.remove('active');
    }

    showScreen(screenId) {
        this.hideAllScreens();
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
            screen.classList.add('fade-in');
            this.currentScreen = screenId;
        }
        this.closeMenu();
    }

    hideAllScreens() {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active', 'fade-in');
        });
    }

    showHomeScreen() {
        this.showScreen('home-screen');
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    setupPWA() {
        // Check if running in standalone mode
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
            document.body.classList.add('standalone');
        }

        // Update available
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', event => {
                if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
                    this.showUpdatePrompt();
                }
            });
        }
    }

    showInstallButton() {
        // Crear botón de instalación si no existe
        if (!document.getElementById('install-btn')) {
            const installBtn = document.createElement('button');
            installBtn.id = 'install-btn';
            installBtn.textContent = '📱 Instalar App';
            installBtn.className = 'install-btn';
            installBtn.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: var(--secondary-color);
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 25px;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(255, 64, 129, 0.3);
                z-index: 1000;
                font-weight: 600;
                transition: all 0.3s ease;
            `;
            
            installBtn.addEventListener('click', () => this.installPWA());
            document.body.appendChild(installBtn);
        }
    }

    hideInstallButton() {
        const installBtn = document.getElementById('install-btn');
        if (installBtn) {
            installBtn.remove();
        }
    }

    async installPWA() {
        if (this.installPrompt) {
            this.installPrompt.prompt();
            const { outcome } = await this.installPrompt.userChoice;
            
            if (outcome === 'accepted') {
                this.showNotification('Instalando aplicación...', 'success');
            } else {
                this.showNotification('Instalación cancelada', 'info');
            }
            
            this.installPrompt = null;
            this.hideInstallButton();
        }
    }

    showUpdatePrompt() {
        const updatePrompt = document.createElement('div');
        updatePrompt.className = 'update-prompt';
        updatePrompt.innerHTML = `
            <div class="update-content">
                <h3>Nueva versión disponible</h3>
                <p>Hay una nueva versión de la aplicación disponible.</p>
                <div class="update-buttons">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()">Más tarde</button>
                    <button onclick="location.reload()">Actualizar</button>
                </div>
            </div>
        `;
        
        updatePrompt.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        document.body.appendChild(updatePrompt);
    }

    handleURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        
        switch (mode) {
            case 'marker':
                setTimeout(() => showMarkerAR(), 500);
                break;
            case 'markerless':
                setTimeout(() => showMarkerlessAR(), 500);
                break;
            case 'location':
                setTimeout(() => showLocationAR(), 500);
                break;
            default:
                this.showHomeScreen();
        }
    }

    // Método para tomar screenshot
    takeScreenshot() {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            navigator.mediaDevices.getDisplayMedia({ video: true })
                .then(stream => {
                    const video = document.createElement('video');
                    video.srcObject = stream;
                    video.play();
                    
                    video.addEventListener('loadedmetadata', () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(video, 0, 0);
                        
                        // Detener el stream
                        stream.getTracks().forEach(track => track.stop());
                        
                        // Crear enlace de descarga
                        const link = document.createElement('a');
                        link.download = `ar-screenshot-${Date.now()}.png`;
                        link.href = canvas.toDataURL();
                        link.click();
                        
                        this.showNotification('Screenshot guardado', 'success');
                    });
                })
                .catch(err => {
                    console.error('Error al tomar screenshot:', err);
                    this.showNotification('Error al tomar screenshot', 'error');
                });
        } else {
            this.showNotification('Screenshot no soportado en este dispositivo', 'error');
        }
    }

    // Método para verificar soporte de WebXR
    checkWebXRSupport() {
        if ('xr' in navigator) {
            navigator.xr.isSessionSupported('immersive-ar')
                .then(supported => {
                    if (supported) {
                        console.log('WebXR AR soportado');
                        return true;
                    } else {
                        console.log('WebXR AR no soportado');
                        return false;
                    }
                })
                .catch(err => {
                    console.error('Error verificando WebXR:', err);
                    return false;
                });
        } else {
            console.log('WebXR no disponible');
            return false;
        }
    }

    // Método para verificar permisos de cámara
    async checkCameraPermission() {
        try {
            const result = await navigator.permissions.query({ name: 'camera' });
            return result.state === 'granted';
        } catch (err) {
            console.error('Error verificando permisos de cámara:', err);
            return false;
        }
    }

    // Método para solicitar permisos de cámara
    async requestCameraPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (err) {
            console.error('Error solicitando permisos de cámara:', err);
            this.showNotification('Se requiere acceso a la cámara para AR', 'error');
            return false;
        }
    }
}

// Funciones globales para navegación
function showMarkerAR() {
    app.showScreen('marker-ar-screen');
    if (typeof initMarkerAR === 'function') {
        initMarkerAR();
    }
}

function showProductAR() {
    app.showScreen('product-ar-screen');
    if (typeof initProductAR === 'function') {
        initProductAR();
    }
}

function showMarkerlessAR() {
    app.showScreen('markerless-ar-screen');
    if (typeof initMarkerlessAR === 'function') {
        initMarkerlessAR();
    }
}

function showLocationAR() {
    app.showScreen('location-ar-screen');
    if (typeof initLocationAR === 'function') {
        initLocationAR();
    }
}

function showAbout() {
    app.showScreen('about-screen');
}

function toggleHints() {
    const hints = document.querySelector('.product-hints');
    if (hints) {
        hints.style.display = hints.style.display === 'none' ? 'block' : 'none';
    }
}

function hideAllScreens() {
    app.hideAllScreens();
}

function showScreen(screenId) {
    app.showScreen(screenId);
}

function takeScreenshot() {
    app.takeScreenshot();
}

function downloadMarker() {
    // Crear un marcador AR básico usando canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 400;
    
    // Fondo blanco
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 400, 400);
    
    // Borde negro
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 400, 20);
    ctx.fillRect(0, 0, 20, 400);
    ctx.fillRect(380, 0, 20, 400);
    ctx.fillRect(0, 380, 400, 20);
    
    // Patrón central simple
    ctx.fillRect(150, 150, 100, 100);
    ctx.fillStyle = 'white';
    ctx.fillRect(175, 175, 50, 50);
    
    // Descargar
    const link = document.createElement('a');
    link.download = 'ar-marker.png';
    link.href = canvas.toDataURL();
    link.click();
    
    app.showNotification('Marcador AR descargado', 'success');
}

// Inicializar la aplicación cuando el DOM esté listo
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ARPWAApp();
});

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ARPWAApp;
}
