// ===== DASHBOARD CONTROLLER =====
class DashboardController {
    constructor() {
        this.auth = null;
        this.settings = this.loadSettings();
        this.sounds = this.initSounds();
        this.searchData = this.getSearchData();
        this.init();
    }

    async init() {
        console.log('🚀 Iniciando Dashboard TyC Group...');
        
        // Inicializar autenticación
        this.auth = await initAuth({
            loginRedirect: '../index.html',
            dashboardRedirect: './dashboard.html',
            requireAuth: true,
            updateProfile: true
        });

        if (this.auth) {
            this.setupEventListeners();
            this.applySettings();
            this.setupLogoutButton();
            console.log('✅ Dashboard inicializado correctamente');
        }
    }

    // ===== SETTINGS =====
    loadSettings() {
        const defaultSettings = {
            theme: 'light', // FORZADO A MODO CLARO
            textColor: '#00d4ff',
            accentColor: '#00d4ff',
            soundEnabled: true,
            typingSoundEnabled: true,
            volume: 50
        };

        const saved = localStorage.getItem('dashboardSettings');
        // Siempre forzar modo claro
        const settings = saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        settings.theme = 'light'; // FORZAR SIEMPRE MODO CLARO
        return settings;
    }

    saveSettings() {
        // Siempre guardar con tema claro
        this.settings.theme = 'light';
        localStorage.setItem('dashboardSettings', JSON.stringify(this.settings));
        console.log('💾 Configuración guardada (modo claro forzado)');
    }

    applySettings() {
        // Forzar tema claro siempre
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');

        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.checked = true; // Siempre activado (modo claro)
            themeToggle.disabled = true; // Deshabilitar para que no se pueda cambiar
        }

        // Aplicar colores
        document.documentElement.style.setProperty('--primary-color', this.settings.textColor);
        document.documentElement.style.setProperty('--accent-color', this.settings.accentColor);
        
        const textColorPicker = document.getElementById('textColorPicker');
        if (textColorPicker) {
            textColorPicker.value = this.settings.textColor;
        }
        
        const accentColorPicker = document.getElementById('accentColorPicker');
        if (accentColorPicker) {
            accentColorPicker.value = this.settings.accentColor;
        }

        // Aplicar sonidos
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.checked = this.settings.soundEnabled;
        }
        
        const typingToggle = document.getElementById('typingToggle');
        if (typingToggle) {
            typingToggle.checked = this.settings.typingSoundEnabled;
        }
        
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.value = this.settings.volume;
        }

        console.log('🎨 Configuración aplicada');
    }

    resetSettings() {
        if (confirm('¿Restablecer toda la configuración a valores predeterminados?')) {
            this.settings = {
                theme: 'light', // FORZADO A MODO CLARO
                textColor: '#00d4ff',
                accentColor: '#00d4ff',
                soundEnabled: true,
                typingSoundEnabled: true,
                volume: 50
            };
            this.saveSettings();
            this.applySettings();
            this.showToast('✅ Configuración restablecida', 'success');
        }
    }

    // ===== SOUNDS SYSTEM =====
    initSounds() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        return {
            context: audioContext,
            
            playClick: () => {
                if (!this.settings.soundEnabled) return;
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(this.settings.volume / 200, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            },
            
            playKeypress: () => {
                if (!this.settings.typingSoundEnabled) return;
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 400 + Math.random() * 200;
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(this.settings.volume / 300, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.05);
            },
            
            playSuccess: () => {
                if (!this.settings.soundEnabled) return;
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
                
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(this.settings.volume / 200, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            }
        };
    }

    // ===== EVENT LISTENERS (VERSIÓN DEFENSIVA) =====
    setupEventListeners() {
        // Search - buscar tanto 'searchInput' como 'globalSearch'
        const searchInput = document.getElementById('searchInput') || document.getElementById('globalSearch');
        const searchResults = document.getElementById('searchResults');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
            searchInput.addEventListener('keydown', () => this.sounds.playKeypress());
            
            // Click outside to close results
            if (searchResults) {
                document.addEventListener('click', (e) => {
                    if (!searchResults.contains(e.target) && e.target !== searchInput) {
                        searchResults.classList.remove('show');
                    }
                });
            }
        }

        // Scroll to top
        const scrollTopBtn = document.getElementById('scrollTopBtn');
        if (scrollTopBtn) {
            window.addEventListener('scroll', () => {
                scrollTopBtn.classList.toggle('show', window.scrollY > 300);
            });
            
            scrollTopBtn.addEventListener('click', () => {
                this.sounds.playClick();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // Settings modal
        this.setupSettingsModal();

        // Settings inputs
        this.setupSettingsInputs();

        // Nav items click sound
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => this.sounds.playClick());
        });

        // All buttons click sound
        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => this.sounds.playClick());
        });

        console.log('⚙️ Event listeners configurados');
    }

    setupSettingsModal() {
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsModal = document.getElementById('settingsModal');
        const closeSettings = document.getElementById('closeSettings');
        const saveSettings = document.getElementById('saveSettings');
        const resetSettings = document.getElementById('resetSettings');

        if (settingsBtn && settingsModal) {
            settingsBtn.addEventListener('click', () => {
                this.sounds.playClick();
                settingsModal.classList.add('show');
            });
        }

        if (closeSettings && settingsModal) {
            closeSettings.addEventListener('click', () => {
                this.sounds.playClick();
                settingsModal.classList.remove('show');
            });
        }

        if (saveSettings && settingsModal) {
            saveSettings.addEventListener('click', () => {
                this.sounds.playSuccess();
                this.saveSettingsFromModal();
                settingsModal.classList.remove('show');
            });
        }

        if (resetSettings) {
            resetSettings.addEventListener('click', () => {
                this.sounds.playClick();
                this.resetSettings();
            });
        }

        // Close on outside click
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    settingsModal.classList.remove('show');
                }
            });
        }
    }

    setupSettingsInputs() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            // DESHABILITADO - Modo claro permanente
            themeToggle.disabled = true;
            themeToggle.checked = true;
            // No agregar event listener para evitar cambios
        }

        const textColorPicker = document.getElementById('textColorPicker');
        if (textColorPicker) {
            textColorPicker.addEventListener('input', (e) => {
                this.settings.textColor = e.target.value;
                document.documentElement.style.setProperty('--primary-color', e.target.value);
            });
        }

        const accentColorPicker = document.getElementById('accentColorPicker');
        if (accentColorPicker) {
            accentColorPicker.addEventListener('input', (e) => {
                this.settings.accentColor = e.target.value;
                document.documentElement.style.setProperty('--accent-color', e.target.value);
            });
        }

        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.addEventListener('change', (e) => {
                this.settings.soundEnabled = e.target.checked;
                if (e.target.checked) this.sounds.playClick();
            });
        }

        const typingToggle = document.getElementById('typingToggle');
        if (typingToggle) {
            typingToggle.addEventListener('change', (e) => {
                this.settings.typingSoundEnabled = e.target.checked;
                if (e.target.checked) this.sounds.playKeypress();
            });
        }

        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.settings.volume = parseInt(e.target.value);
            });
        }
    }

    saveSettingsFromModal() {
        this.saveSettings();
        this.showToast('✅ Configuración guardada correctamente', 'success');
    }

    setupLogoutButton() {
        const logoutBtn = document.getElementById('logoutBtn');
        const logoutModal = document.getElementById('logoutModal');
        const cancelLogout = document.getElementById('cancelLogout');
        const confirmLogout = document.getElementById('confirmLogout');

        if (logoutBtn && logoutModal) {
            logoutBtn.addEventListener('click', () => {
                this.sounds.playClick();
                logoutModal.classList.add('show');
            });
        }

        if (cancelLogout && logoutModal) {
            cancelLogout.addEventListener('click', () => {
                this.sounds.playClick();
                logoutModal.classList.remove('show');
            });
        }

        if (confirmLogout && logoutModal) {
            confirmLogout.addEventListener('click', async () => {
                this.sounds.playClick();
                logoutModal.classList.remove('show');
                if (this.auth) {
                    await this.auth.logout(false);
                }
            });
        }

        if (logoutModal) {
            logoutModal.addEventListener('click', (e) => {
                if (e.target === logoutModal) {
                    logoutModal.classList.remove('show');
                }
            });
        }
    }

    // ===== SEARCH FUNCTIONALITY =====
    getSearchData() {
        return [
            { name: 'Inicio', description: 'Panel principal del dashboard', url: 'dashboard.html' },
            { name: 'Inventario', description: 'Gestión de equipos e inventario', url: 'inventario.html' },
            { name: 'Documentos', description: 'Repositorio de documentos técnicos', url: 'documentos.html' },
            { name: 'Bitácora', description: 'Registro de actividades', url: 'bitacora.html' },
            { name: 'Historial', description: 'Historial de tareas completadas', url: 'historial.html' },
            { name: 'Tips & Tricks', description: 'Consejos y trucos útiles', url: 'tips.html' },
            { name: 'Respaldos', description: 'Sistema de respaldos', url: 'respaldos.html' },
            { name: 'Mantenimiento', description: 'Mantenimiento de equipos', url: 'mantenimiento.html' },
            { name: 'Administración', description: 'Panel de administración del sistema', url: 'administracion.html' },
            { name: 'Ajustes', description: 'Configuración y personalización', action: 'openSettings' },
            { name: 'Cerrar Sesión', description: 'Salir del sistema', action: 'logout' },
            { 
            name: 'Gestión de Empleados', 
            description: 'Administra el personal y empleados de la empresa', 
            url: 'usuarios.html',
            keywords: ['usuarios', 'empleados', 'personal', 'staff', 'equipo', 'trabajadores', 'colaboradores', 'gente', 'personas']
        },
            { name: 'Gestión de Áreas', description: 'Administra las áreas departamentales de la empresa', 
            url: 'areas.html', keywords: ['areas', 'departamentos', 'secciones', 'divisiones']}
        ];
    }

    handleSearch(query) {
        const searchResults = document.getElementById('searchResults');
        
        if (!searchResults) {
            console.warn('⚠️ Elemento searchResults no encontrado');
            return;
        }
        
        if (!query.trim()) {
            searchResults.classList.remove('show');
            return;
        }

        const results = this.searchData.filter(item => 
            item.name.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase())
        );

        if (results.length > 0) {
            searchResults.innerHTML = results.map(item => `
                <div class="search-result-item" data-url="${item.url || ''}" data-action="${item.action || ''}">
                    <strong>${this.highlightMatch(item.name, query)}</strong>
                    <span>${item.description}</span>
                </div>
            `).join('');
            
            searchResults.classList.add('show');

            // Add click handlers
            searchResults.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.sounds.playClick();
                    const url = item.dataset.url;
                    const action = item.dataset.action;
                    
                    if (action === 'openSettings') {
                        const settingsModal = document.getElementById('settingsModal');
                        if (settingsModal) {
                            settingsModal.classList.add('show');
                        }
                    } else if (action === 'logout') {
                        const logoutModal = document.getElementById('logoutModal');
                        if (logoutModal) {
                            logoutModal.classList.add('show');
                        }
                    } else if (url) {
                        window.location.href = url;
                    }
                    
                    searchResults.classList.remove('show');
                    const searchInput = document.getElementById('searchInput') || document.getElementById('globalSearch');
                    if (searchInput) {
                        searchInput.value = '';
                    }
                });
            });
        } else {
            searchResults.innerHTML = '<div class="search-result-item"><span>No se encontraron resultados</span></div>';
            searchResults.classList.add('show');
        }
    }

    highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark style="background: var(--primary-color); color: white; padding: 2px 4px; border-radius: 3px;">$1</mark>');
    }

    // ===== TOAST NOTIFICATIONS =====
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            background: ${type === 'success' ? 'linear-gradient(135deg, #00ff88, #00cc6a)' : 'linear-gradient(135deg, #00d4ff, #0066cc)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DashboardController();
});

// ===== ANIMACIONES CSS =====
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('📦 Dashboard Module Loaded - TyC Group v1.0');