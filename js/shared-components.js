// =====================================================
// COMPONENTES COMPARTIDOS - TyC GROUP
// shared-components.js
// Incluye componentes reutilizables para todas las páginas
// =====================================================

class SharedComponents {
    constructor() {
        console.log('🧩 Componentes compartidos cargados');
    }

    // ===== SIDEBAR COMPONENT =====
    static getSidebarHTML(activePage = 'dashboard') {
        const menuItems = [
            { id: 'dashboard', name: 'Inicio', icon: 'home', url: 'dashboard.html' },
            {
                id: 'inventario',
                name: 'Inventarios',
                icon: 'grid',
                url: 'inventario.html',
                submenu: [
                    { id: 'inventario-laptop', name: 'Laptops', url: 'inventario-laptop.html' },
                    { id: 'inventario-desktop', name: 'Desktops', url: 'inventario-desktop.html' },
                    { id: 'inventario-periferico', name: 'Periféricos', url: 'inventario-periferico.html' }
                ]
            },
            { id: 'documentos', name: 'Documentos', icon: 'file', url: 'documentos.html' },
            { id: 'bitacora', name: 'Bitácora', icon: 'book', url: 'bitacora.html' },
            { id: 'historial', name: 'Historial de Tareas', icon: 'clock', url: 'historial.html' },
            { id: 'tips', name: 'Tips & Tricks', icon: 'bulb', url: 'tips.html' },
            { id: 'respaldos', name: 'Respaldos', icon: 'download', url: 'respaldos.html' },
            { id: 'mantenimiento', name: 'Mantenimiento de Equipos', icon: 'tool', url: 'mantenimiento.html' },
            { id: 'administracion', name: 'Administración', icon: 'admin', url: 'administracion.html' }
        ];

        const icons = {
            home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
            grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
            file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
            book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
            clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
            bulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>',
            download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
            tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
            admin: '<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>'
        };

        const navItems = menuItems.map(item => {
            const isActive = activePage === item.id || (item.submenu && item.submenu.some(sub => sub.id === activePage));

            if (item.submenu) {
                // Item con submenú
                const submenuItems = item.submenu.map(sub => `
                    <a href="${sub.url}" class="submenu-item ${activePage === sub.id ? 'active' : ''}">
                        <span>${sub.name}</span>
                    </a>
                `).join('');

                return `
                    <div class="nav-item-with-submenu ${isActive ? 'active' : ''}">
                        <a href="${item.url}" class="nav-item ${isActive ? 'active' : ''}">
                            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                ${icons[item.icon]}
                            </svg>
                            <span>${item.name}</span>
                            <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </a>
                        <div class="submenu ${isActive ? 'show' : ''}">
                            ${submenuItems}
                        </div>
                    </div>
                `;
            } else {
                // Item normal sin submenú
                return `
                    <a href="${item.url}" class="nav-item ${isActive ? 'active' : ''}">
                        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            ${icons[item.icon]}
                        </svg>
                        <span>${item.name}</span>
                    </a>
                `;
            }
        }).join('');

        return `
            <aside class="sidebar" id="sidebar">
                <div class="user-profile">
                    <div class="user-avatar" id="userAvatar">
                        <span id="userInitials">AT</span>
                    </div>
                    <h3 id="userName">Admin TyC</h3>
                    <p id="userRole">USUARIO</p>
                </div>

                <nav class="nav-menu">
                    ${navItems}
                </nav>

                <div class="sidebar-bottom">
                    <button class="nav-item settings-btn" id="settingsBtn">
                        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m5.66 5.66l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m5.66-5.66l4.24-4.24"/>
                        </svg>
                        <span>Ajustes</span>
                    </button>

                    <button class="nav-item logout-btn" id="logoutBtn">
                        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16 17 21 12 16 7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        `;
    }

    // ===== HEADER COMPONENT =====
    static getHeaderHTML() {
        return `
            <header class="header">
                <div class="search-container">
                    <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input type="text" class="search-input" id="searchInput" placeholder="Buscar funciones...">
                    <div class="search-results" id="searchResults"></div>
                </div>
            </header>
        `;
    }

    // ===== MODALS =====
    static getSettingsModalHTML() {
        return `
            <div class="modal" id="settingsModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Ajustes y Personalización</h2>
                        <button class="close-btn" id="closeSettings">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="setting-item">
                            <div class="setting-info">
                                <h3>Color de Texto Principal</h3>
                                <p>Personaliza el color del texto</p>
                            </div>
                            <input type="color" class="color-picker" id="textColorPicker" value="#00d4ff">
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <h3>Color de Acento</h3>
                                <p>Color de elementos destacados</p>
                            </div>
                            <input type="color" class="color-picker" id="accentColorPicker" value="#00d4ff">
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <h3>Sonidos de Interacción</h3>
                                <p>Activar/desactivar sonidos al hacer clic</p>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="soundToggle" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <h3>Sonidos al Escribir</h3>
                                <p>Activar/desactivar sonidos de teclado</p>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="typingToggle" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <h3>Volumen de Sonidos</h3>
                                <p>Ajustar volumen general</p>
                            </div>
                            <input type="range" class="volume-slider" id="volumeSlider" min="0" max="100" value="50">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" id="resetSettings">Restablecer</button>
                        <button class="btn-primary" id="saveSettings">Guardar Cambios</button>
                    </div>
                </div>
            </div>
        `;
    }

    static getLogoutModalHTML() {
        return `
            <div class="modal" id="logoutModal">
                <div class="modal-content small">
                    <div class="modal-header">
                        <h2>Cerrar Sesión</h2>
                    </div>
                    <div class="modal-body">
                        <p>¿Estás seguro que deseas cerrar sesión?</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" id="cancelLogout">Cancelar</button>
                        <button class="btn-danger" id="confirmLogout">Cerrar Sesión</button>
                    </div>
                </div>
            </div>
        `;
    }

    // ===== SCROLL TO TOP BUTTON =====
    static getScrollTopButtonHTML() {
        return `
            <button class="scroll-top" id="scrollTopBtn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 15l-6-6-6 6"/>
                </svg>
            </button>
        `;
    }

    // ===== LOADING OVERLAY =====
    static createLoadingOverlay() {
        return `
            <div class="loading-overlay" id="loadingOverlay">
                <div class="spinner"></div>
                <p>Cargando...</p>
            </div>
        `;
    }

    // ===== STAT CARD =====
    static createStatCard(config) {
        const { icon, value, label, color = 'blue' } = config;
        const iconPath = {
            check: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
            server: '<rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>',
            activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
            alert: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
        };

        return `
            <div class="stat-card fade-in-up">
                <div class="stat-icon ${color}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${iconPath[icon] || iconPath.check}
                    </svg>
                </div>
                <div class="stat-info">
                    <h3 class="stat-number">${value}</h3>
                    <p class="stat-label">${label}</p>
                </div>
            </div>
        `;
    }

    // ===== TABLE =====
    static createTable(config) {
        const { headers, data, actions = [] } = config;

        const headerHTML = headers.map(h => `<th>${h}</th>`).join('');
        const actionsHTML = actions.length > 0 ? '<th>Acciones</th>' : '';

        const rowsHTML = data.map((row, index) => {
            const cellsHTML = row.map(cell => `<td>${cell}</td>`).join('');
            const actionButtons = actions.map(action => `
                <button class="btn-icon ${action.class || ''}" 
                        onclick="${action.onclick}(${index})"
                        title="${action.title}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${action.icon}
                    </svg>
                </button>
            `).join('');

            return `
                <tr class="table-row">
                    ${cellsHTML}
                    ${actions.length > 0 ? `<td><div class="action-buttons">${actionButtons}</div></td>` : ''}
                </tr>
            `;
        }).join('');

        return `
            <div class="table-container">
                <div class="table-responsive">
                    <table class="equipos-table">
                        <thead>
                            <tr>
                                ${headerHTML}
                                ${actionsHTML}
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHTML}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // ===== TOOLBAR =====
    static createToolbar(config) {
        const { title, subtitle, actions = [], filters = [], searchPlaceholder = 'Buscar...' } = config;

        const actionsHTML = actions.map(action => `
            <button class="action-button ${action.class || ''}" onclick="${action.onclick}">
                ${action.icon ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${action.icon}</svg>` : ''}
                <span>${action.label}</span>
            </button>
        `).join('');

        const filtersHTML = filters.map(filter => `
            <button class="filter-btn ${filter.active ? 'active' : ''}" 
                    data-filter="${filter.value}"
                    onclick="${filter.onclick}">
                ${filter.label}
            </button>
        `).join('');

        return `
            ${title ? `
                <div style="margin-bottom: 2rem;">
                    <h1 class="page-title">${title}</h1>
                    ${subtitle ? `<p class="page-subtitle">${subtitle}</p>` : ''}
                </div>
            ` : ''}
            
            <div class="toolbar">
                <div class="toolbar-left">
                    ${filters.length > 0 ? `<div class="filter-buttons">${filtersHTML}</div>` : ''}
                    <div class="local-search">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.35-4.35"/>
                        </svg>
                        <input type="text" placeholder="${searchPlaceholder}" id="localSearch">
                    </div>
                </div>
                <div class="toolbar-right">
                    ${actionsHTML}
                </div>
            </div>
        `;
    }

    // ===== EMPTY STATE =====
    static createEmptyState(config) {
        const { icon, title, description, actionLabel, actionOnclick } = config;

        return `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${icon}
                </svg>
                <h3>${title}</h3>
                <p>${description}</p>
                ${actionLabel ? `
                    <button class="action-button" onclick="${actionOnclick}">
                        ${actionLabel}
                    </button>
                ` : ''}
            </div>
        `;
    }
    

    // ===== INICIALIZAR COMPONENTES EN UNA PÁGINA (MEJORADO) =====
    static initializePage(activePage = 'dashboard') {
        console.log(`🎨 Inicializando componentes para: ${activePage}`);

        // 1. Insertar sidebar al inicio del body
        document.body.insertAdjacentHTML('afterbegin', this.getSidebarHTML(activePage));

        // 2. Buscar el main-content e insertar header al inicio
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertAdjacentHTML('afterbegin', this.getHeaderHTML());
        }

        // 3. Insertar modales al final del body
        document.body.insertAdjacentHTML('beforeend', this.getSettingsModalHTML());
        document.body.insertAdjacentHTML('beforeend', this.getLogoutModalHTML());
        document.body.insertAdjacentHTML('beforeend', this.createLoadingOverlay());

        // 4. Insertar scroll to top button
        document.body.insertAdjacentHTML('beforeend', this.getScrollTopButtonHTML());

        // 5. Inicializar interactividad del submenú
        this.initSubmenuToggle();

        console.log(`✅ Componentes compartidos inicializados para: ${activePage}`);
    }

    // ===== TOGGLE SUBMENÚ =====
    static initSubmenuToggle() {
        const submenuParents = document.querySelectorAll('.nav-item-with-submenu > .nav-item');

        submenuParents.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const parent = item.parentElement;
                const submenu = parent.querySelector('.submenu');

                // Toggle active class
                parent.classList.toggle('active');
                submenu.classList.toggle('show');
            });
        });
    }
}

// ===== HELPER FUNCTIONS =====
class Helpers {
    // Formatear fecha
    static formatDate(date) {
        const d = new Date(date);
        return d.toLocaleDateString('es-MX', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    // Formatear fecha y hora
    static formatDateTime(date) {
        const d = new Date(date);
        return d.toLocaleDateString('es-MX', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Formatear moneda
    static formatCurrency(amount) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    }

    // Debounce
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Copy to clipboard
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Error al copiar:', err);
            return false;
        }
    }

    // Generate random ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.SharedComponents = SharedComponents;
    window.Helpers = Helpers;
}

console.log('🧩 Componentes compartidos disponibles globalmente');