// ============================================
// CONTROLADOR DE PÁGINA DE ADMINISTRACIÓN
// ============================================

class AdministracionController {
    constructor() {
        this.fb = null;
        this.userData = null;
        this.adminPanels = [];
        this.init();
    }

    async init() {
        console.log('🚀 Iniciando Página de Administración...');
        
        try {
            // Esperar autenticación
            await this.waitForAuth();
            
            // Verificar permisos
            if (!this.checkPermissions()) {
                this.showError('No tienes permisos para acceder a esta página');
                setTimeout(() => window.location.href = 'dashboard.html', 2000);
                return;
            }

            // Inicializar Firebase Helper
            this.fb = getFirebaseHelper();
            
            // Obtener datos del usuario
            this.userData = window.dashboard.auth.getUserData();
            console.log('👤 Usuario cargado:', this.userData.nombre);
            
            // Setup
            this.setupEventListeners();
            await this.loadAdminData();
            this.renderPanels();
            
            console.log('✅ Página de Administración inicializada');
        } catch (error) {
            console.error('❌ Error al inicializar:', error);
            this.showError('Error al cargar la página');
        }
    }

    /**
     * Espera a que el sistema de autenticación esté disponible
     */
    async waitForAuth() {
        return new Promise((resolve) => {
            const check = setInterval(() => {
                if (window.dashboard && window.dashboard.auth) {
                    clearInterval(check);
                    resolve();
                }
            }, 100);
            
            // Timeout de seguridad
            setTimeout(() => {
                clearInterval(check);
                console.error('❌ Timeout esperando autenticación');
                resolve();
            }, 5000);
        });
    }

    /**
     * Verifica si el usuario tiene permisos de administrador
     */
    checkPermissions() {
        if (!window.dashboard || !window.dashboard.auth) {
            console.error('❌ Dashboard o Auth no disponible');
            return false;
        }
        
        const userData = window.dashboard.auth.getUserData();
        console.log('🔍 Verificando permisos para:', userData);
        
        if (!userData || !userData.role) {
            console.error('❌ No se encontró rol de usuario');
            return false;
        }
        
        // Normalizar el rol a minúsculas para comparación
        const userRole = userData.role.toLowerCase();
        const allowedRoles = ['superadmin', 'admin'];
        
        const hasPermission = allowedRoles.includes(userRole);
        console.log(`🔐 Rol del usuario: "${userData.role}" - Permiso: ${hasPermission ? '✅' : '❌'}`);
        
        return hasPermission;
    }


        /**
         * Carga los datos necesarios desde Firebase
         */
        async loadAdminData() {
            try {
                this.showLoading(true);
                
                // Cargar contadores para los badges
                // ⭐ CAMBIO: Contar 'empleados' en lugar de 'usuarios'
                const [empleadosCount, areasCount] = await Promise.all([
                    this.fb.count('empleados'),  // ← Cambio aquí
                    this.fb.count('areas')
                ]);

                // Configurar paneles con datos
                this.adminPanels = this.getAdminPanelsConfig(empleadosCount, areasCount);
                
                console.log('📊 Datos de administración cargados');
            } catch (error) {
                console.error('Error al cargar datos:', error);
                this.showError('Error al cargar datos de administración');
                
                // Usar configuración por defecto sin contadores
                this.adminPanels = this.getAdminPanelsConfig(0, 0);
            } finally {
                this.showLoading(false);
            }
        }

    /**
     * Configuración de los paneles de administración
     */
getAdminPanelsConfig(empleadosCount = 0, areasCount = 0) {
    return [
        {
            id: 'empleados',  // ← Cambio de 'usuarios' a 'empleados'
            title: 'Administración de Empleados',  // ← Cambio de título
            description: 'Gestiona el personal y empleados de la empresa',  // ← Cambio de descripción
            icon: `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
            `,
            badge: empleadosCount > 0 ? `${empleadosCount} empleados` : null,  // ← Cambio de 'usuarios' a 'empleados'
            class: 'panel-users',
            action: () => this.navigateToUsers(),
            enabled: true
        },
        {
            id: 'areas',
            title: 'Administración de Áreas',
            description: 'Configura áreas, departamentos y estructura organizacional',
            icon: `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                </svg>
            `,
            badge: areasCount > 0 ? `${areasCount} áreas` : null,
            class: 'panel-areas',
            action: () => this.navigateToAreas(),
            enabled: true
        },
        {
            id: 'roles',
            title: 'Gestión de Roles',
            description: 'Administra roles y permisos del sistema',
            icon: `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
            `,
            badge: 'Nuevo',
            class: 'panel-roles',
            action: () => this.navigateToRoles(),
            enabled: true
        },
        {
            id: 'configuracion',
            title: 'Configuración del Sistema',
            description: 'Ajustes generales, notificaciones y preferencias',
            icon: `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6m5.657-14.657l-4.243 4.243m0 6l-4.243 4.243m14.657-5.657l-4.243-4.243m-6 0L4.343 18.343"/>
                </svg>
            `,
            class: 'panel-settings',
            action: () => this.navigateToSettings(),
            enabled: false // Próximamente
        }
    ];
}

    /**
     * Renderiza los paneles de administración
     */
    renderPanels() {
        const container = document.getElementById('adminGrid');
        
        if (!container) {
            console.error('Contenedor de paneles no encontrado');
            return;
        }

        // Limpiar contenedor
        container.innerHTML = '';

        // Renderizar cada panel
        this.adminPanels.forEach(panel => {
            const panelElement = this.createPanelElement(panel);
            container.appendChild(panelElement);
        });
        
        console.log('🎨 Paneles renderizados');
    }

    /**
     * Crea el elemento HTML de un panel
     */
    createPanelElement(panel) {
        const panelDiv = document.createElement('div');
        panelDiv.className = `admin-panel ${panel.class || ''}`;
        
        // Añadir clase disabled si no está habilitado
        if (!panel.enabled) {
            panelDiv.classList.add('disabled');
        }

        panelDiv.innerHTML = `
            <div class="admin-panel-icon">
                ${panel.icon}
            </div>
            
            <div class="admin-panel-content">
                <h3 class="admin-panel-title">${panel.title}</h3>
                <p class="admin-panel-description">${panel.description}</p>
            </div>
            
            ${panel.badge ? `<div class="admin-panel-badge">${panel.badge}</div>` : ''}
            
            <div class="admin-panel-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                </svg>
            </div>
        `;

        // Añadir evento click solo si está habilitado
        if (panel.enabled && panel.action) {
            panelDiv.addEventListener('click', () => {
                this.playSound();
                panel.action();
            });
        }

        return panelDiv;
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Los event listeners del dashboard se configuran automáticamente
        console.log('⚙️ Event listeners configurados');
    }

    // ========================================
    // NAVEGACIÓN A MÓDULOS
    // ========================================

    navigateToUsers() {
        console.log('📍 Navegando a Administración de Usuarios');
        this.showInfo('Redirigiendo a gestión de usuarios...');
        
        // Simulación - Aquí irías a la página real
        setTimeout(() => {
            // window.location.href = 'admin-usuarios.html';
            window.location.href = 'usuarios.html';
        }, 500);
    }

    navigateToAreas() {
        console.log('📍 Navegando a Administración de Áreas');
        this.showInfo('Redirigiendo a gestión de áreas...');
        
        // Redirigir a la página de áreas
        setTimeout(() => {
            window.location.href = 'areas.html';
        }, 500);
    }

    navigateToRoles() {
        console.log('📍 Navegando a Gestión de Roles');
        this.showInfo('Redirigiendo a gestión de roles...');

        setTimeout(() => {
            window.location.href = 'roles.html';
        }, 500);
    }

    navigateToSettings() {
        console.log('📍 Navegando a Configuración del Sistema');
        this.showInfo('Módulo próximamente disponible');
    }

    // ========================================
    // MÉTODOS DE UI
    // ========================================

    /**
     * Muestra/oculta el overlay de carga
     */
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.toggle('show', show);
        }
    }

    /**
     * Reproduce sonido de interacción
     */
    playSound() {
        if (window.dashboard && window.dashboard.sounds) {
            window.dashboard.sounds.playClick();
        }
    }

    /**
     * Muestra notificación de éxito
     */
    showSuccess(message) {
        if (window.dashboard) {
            window.dashboard.showToast(message, 'success');
        } else {
            console.log('✅', message);
        }
    }

    /**
     * Muestra notificación de error
     */
    showError(message) {
        if (window.dashboard) {
            window.dashboard.showToast(message, 'error');
        } else {
            console.error('❌', message);
        }
    }

    /**
     * Muestra notificación informativa
     */
    showInfo(message) {
        if (window.dashboard) {
            window.dashboard.showToast(message, 'info');
        } else {
            console.log('ℹ️', message);
        }
    }

    /**
     * Limpieza al salir de la página
     */
    destroy() {
        console.log('🧹 Limpiando recursos...');
        // Aquí limpiarías listeners, etc.
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.administracionController = new AdministracionController();
});

// Limpiar al salir
window.addEventListener('beforeunload', () => {
    if (window.administracionController) {
        window.administracionController.destroy();
    }
});

console.log('📦 Módulo de Administración cargado');