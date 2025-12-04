// =====================================================
// MÓDULO DE AUTENTICACIÓN - TyC GROUP
// auth-module.js
// =====================================================

class AuthModule {
    constructor(config = {}) {
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.currentUser = null;
        this.userData = null;
        
        // Configuración personalizable
        this.config = {
            loginRedirect: config.loginRedirect || '../index.html',
            dashboardRedirect: config.dashboardRedirect || './Vistas/dashboard.html',
            requireAuth: config.requireAuth !== false, // Por defecto requiere auth
            updateProfile: config.updateProfile !== false, // Por defecto actualiza perfil
            onAuthSuccess: config.onAuthSuccess || null,
            onAuthError: config.onAuthError || null,
            ...config
        };
        
        console.log('🔐 Módulo de Autenticación TyC Group inicializado');
    }

    // ===== INICIALIZACIÓN =====
    async init() {
        try {
            await this.checkAuthState();
        } catch (error) {
            console.error('❌ Error al inicializar módulo de autenticación:', error);
            if (this.config.onAuthError) {
                this.config.onAuthError(error);
            }
        }
    }

    // ===== VERIFICACIÓN DE ESTADO DE AUTENTICACIÓN =====
    checkAuthState() {
        return new Promise((resolve, reject) => {
            this.auth.onAuthStateChanged(async (user) => {
                if (user) {
                    this.currentUser = user;
                    console.log('✅ Usuario autenticado:', user.email);
                    
                    try {
                        // Cargar datos del usuario desde Firestore
                        await this.loadUserData(user.uid);
                        
                        // Actualizar perfil en la UI si está configurado
                        if (this.config.updateProfile) {
                            this.updateUserProfile();
                        }
                        
                        // Callback de éxito
                        if (this.config.onAuthSuccess) {
                            this.config.onAuthSuccess(user, this.userData);
                        }
                        
                        resolve(user);
                    } catch (error) {
                        console.error('❌ Error al cargar datos del usuario:', error);
                        reject(error);
                    }
                } else {
                    console.log('⚠️ Usuario no autenticado');
                    
                    // Si la página requiere autenticación, redirigir al login
                    if (this.config.requireAuth) {
                        this.redirectToLogin();
                    }
                    
                    resolve(null);
                }
            });
        });
    }

    // ===== CARGAR DATOS DEL USUARIO =====
    async loadUserData(uid) {
        try {
            const userDoc = await this.db.collection('usuarios').doc(uid).get();
            
            if (userDoc.exists) {
                this.userData = userDoc.data();
                console.log('📋 Datos del usuario cargados:', this.userData);
                return this.userData;
            } else {
                console.warn('⚠️ No se encontraron datos del usuario en Firestore');
                this.userData = {
                    nombre: this.currentUser.displayName || 'Usuario',
                    email: this.currentUser.email,
                    rol: 'Usuario',
                    genero: 'M'
                };
                return this.userData;
            }
        } catch (error) {
            console.error('❌ Error al cargar datos del usuario:', error);
            throw error;
        }
    }

    // ===== ACTUALIZAR PERFIL EN LA UI =====
    updateUserProfile() {
        if (!this.userData) return;

        const userName = this.userData.nombre || this.currentUser.displayName || 'Usuario';
        const userRole = this.userData.rol || 'Usuario';
        const userEmail = this.userData.email || this.currentUser.email;
        
        // Generar iniciales
        const initials = userName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);

        // Actualizar elementos del DOM si existen
        const elements = {
            userName: document.getElementById('userName'),
            userRole: document.getElementById('userRole'),
            userEmail: document.getElementById('userEmail'),
            userInitials: document.getElementById('userInitials'),
            userAvatar: document.getElementById('userAvatar')
        };

        if (elements.userName) elements.userName.textContent = userName;
        if (elements.userRole) elements.userRole.textContent = userRole;
        if (elements.userEmail) elements.userEmail.textContent = userEmail;
        if (elements.userInitials) elements.userInitials.textContent = initials;
        
        // Si hay avatar, añadir color de fondo basado en el rol
        if (elements.userAvatar) {
            const roleColors = {
                'SuperAdmin': 'linear-gradient(135deg, #ff6b6b, #ee5a6f)',
                'Admin': 'linear-gradient(135deg, #f39c12, #e74c3c)',
                'Usuario': 'linear-gradient(135deg, #00d4ff, #0066cc)',
                'Becario': 'linear-gradient(135deg, #a29bfe, #6c5ce7)'
            };
            
            elements.userAvatar.style.background = roleColors[userRole] || roleColors['Usuario'];
        }

        console.log('👤 Perfil actualizado en la UI');
    }

    // ===== OBTENER USUARIO ACTUAL =====
    getCurrentUser() {
        return this.currentUser;
    }

    // ===== OBTENER DATOS DEL USUARIO =====
    getUserData() {
        return this.userData;
    }

    // ===== VERIFICAR PERMISOS =====
    hasPermission(permission) {
        if (!this.userData || !this.userData.permisos) return false;
        return this.userData.permisos.includes(permission);
    }

    // ===== VERIFICAR ROL =====
    hasRole(...roles) {
        if (!this.userData) return false;
        return roles.includes(this.userData.rol);
    }

    // ===== CERRAR SESIÓN =====
    async logout(showConfirm = true) {
        if (showConfirm) {
            const confirmed = confirm('¿Estás seguro que deseas cerrar sesión?');
            if (!confirmed) return false;
        }

        try {
            await this.auth.signOut();
            console.log('✅ Sesión cerrada exitosamente');
            this.redirectToLogin();
            return true;
        } catch (error) {
            console.error('❌ Error al cerrar sesión:', error);
            alert('Error al cerrar sesión. Por favor, intenta de nuevo.');
            return false;
        }
    }

    // ===== CERRAR SESIÓN CON MODAL =====
    async logoutWithModal(modalId = 'logoutModal') {
        return new Promise((resolve) => {
            const modal = document.getElementById(modalId);
            if (!modal) {
                console.warn('⚠️ Modal de logout no encontrado, usando confirm nativo');
                this.logout(true).then(resolve);
                return;
            }

            // Mostrar modal
            modal.classList.add('show');

            // Botón de cancelar
            const cancelBtn = modal.querySelector('#cancelLogout, [data-action="cancel"]');
            if (cancelBtn) {
                cancelBtn.onclick = () => {
                    modal.classList.remove('show');
                    resolve(false);
                };
            }

            // Botón de confirmar
            const confirmBtn = modal.querySelector('#confirmLogout, [data-action="confirm"]');
            if (confirmBtn) {
                confirmBtn.onclick = async () => {
                    modal.classList.remove('show');
                    const result = await this.logout(false);
                    resolve(result);
                };
            }

            // Cerrar al hacer clic fuera
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                    resolve(false);
                }
            };
        });
    }

    // ===== REDIRECCIONES =====
    redirectToLogin() {
        console.log('🔄 Redirigiendo al login...');
        window.location.href = this.config.loginRedirect;
    }

    redirectToDashboard() {
        console.log('🔄 Redirigiendo al dashboard...');
        window.location.href = this.config.dashboardRedirect;
    }

    // ===== ACTUALIZAR DATOS DEL USUARIO =====
    async updateUserData(newData) {
        if (!this.currentUser) {
            console.error('❌ No hay usuario autenticado');
            return false;
        }

        try {
            await this.db.collection('usuarios').doc(this.currentUser.uid).update(newData);
            
            // Actualizar datos locales
            this.userData = { ...this.userData, ...newData };
            
            // Actualizar UI si está configurado
            if (this.config.updateProfile) {
                this.updateUserProfile();
            }
            
            console.log('✅ Datos del usuario actualizados');
            return true;
        } catch (error) {
            console.error('❌ Error al actualizar datos del usuario:', error);
            return false;
        }
    }

    // ===== SETUP DE LOGOUT BUTTON =====
    setupLogoutButton(buttonSelector = '#logoutBtn', useModal = true) {
        const logoutBtn = document.querySelector(buttonSelector);
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (useModal) {
                    await this.logoutWithModal();
                } else {
                    await this.logout(true);
                }
            });
            console.log('✅ Botón de logout configurado');
        } else {
            console.warn('⚠️ No se encontró el botón de logout con selector:', buttonSelector);
        }
    }

    // ===== PROTECCIÓN DE RUTAS =====
    static requireAuth(config = {}) {
        return new Promise((resolve, reject) => {
            const auth = new AuthModule({ ...config, requireAuth: true });
            auth.init()
                .then(() => resolve(auth))
                .catch(reject);
        });
    }

    // ===== MODO NO PROTEGIDO (Para páginas públicas) =====
    static noAuth(config = {}) {
        return new Promise((resolve) => {
            const auth = new AuthModule({ ...config, requireAuth: false });
            auth.init()
                .then(() => resolve(auth))
                .catch(() => resolve(auth));
        });
    }
}

// ===== FUNCIONES DE AYUDA GLOBALES =====

// Inicializar auth para páginas protegidas
async function initAuth(config = {}) {
    try {
        const auth = await AuthModule.requireAuth(config);
        return auth;
    } catch (error) {
        console.error('Error al inicializar autenticación:', error);
        return null;
    }
}

// Inicializar auth sin protección
async function initAuthNoProtection(config = {}) {
    const auth = await AuthModule.noAuth(config);
    return auth;
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.AuthModule = AuthModule;
    window.initAuth = initAuth;
    window.initAuthNoProtection = initAuthNoProtection;
}

console.log('📦 Módulo de autenticación cargado y listo para usar');