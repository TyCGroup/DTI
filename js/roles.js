// ============================================
// ROLES.JS - TyC Group Dashboard
// Gestión de Roles y Permisos del Sistema
// ============================================

class RolesController {
    constructor() {
        this.fb = getFirebaseHelper();
        this.empleados = [];
        this.usuarios = [];
        this.filteredUsuarios = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.editingUserId = null;
        this.editingEmpleadoId = null;
        this.currentEmpleado = null;
        this.availableModules = this.getAvailableModules();
        this.init();
    }

    async init() {
        console.log('🚀 Iniciando Gestión de Roles...');

        try {
            await this.waitForAuth();

            if (!this.checkPermissions()) {
                this.showError('No tienes permisos para acceder a esta sección');
                setTimeout(() => window.location.href = 'dashboard.html', 2000);
                return;
            }

            this.setupEventListeners();
            await this.cargarDatos();

            console.log('✅ Gestión de Roles inicializada correctamente');
        } catch (error) {
            console.error('❌ Error al inicializar:', error);
            this.showError('Error al inicializar la página');
        }
    }

    async waitForAuth() {
        return new Promise((resolve) => {
            const check = setInterval(() => {
                if (window.dashboard && window.dashboard.auth) {
                    clearInterval(check);
                    resolve();
                }
            }, 100);
        });
    }

    checkPermissions() {
        const userData = window.dashboard.auth.getUserData();
        const userRole = (userData.rol || userData.role || '').toLowerCase();
        const allowedRoles = ['admin', 'superadmin', 'administrador'];
        const hasPermission = allowedRoles.includes(userRole);

        if (!hasPermission) {
            console.warn('⚠️ Acceso denegado. Rol actual:', userData.rol || userData.role);
        } else {
            console.log('✅ Acceso permitido. Rol:', userData.rol || userData.role);
        }

        return hasPermission;
    }

    // ==========================================
    // CONFIGURACIÓN DE MÓDULOS
    // ==========================================

    getAvailableModules() {
        return [
            {
                id: 'dashboard',
                name: 'Inicio',
                description: 'Página principal del sistema'
            },
            {
                id: 'inventario',
                name: 'Inventario',
                description: 'Gestión de equipos de TI'
            },
            {
                id: 'documentos',
                name: 'Documentos',
                description: 'Repositorio de archivos'
            },
            {
                id: 'bitacora',
                name: 'Bitácora',
                description: 'Registro de actividades'
            },
            {
                id: 'historial',
                name: 'Historial de Tareas',
                description: 'Tareas completadas'
            },
            {
                id: 'tips',
                name: 'Tips & Tricks',
                description: 'Consejos y trucos'
            },
            {
                id: 'respaldos',
                name: 'Respaldos',
                description: 'Gestión de backups'
            },
            {
                id: 'mantenimiento',
                name: 'Mantenimiento',
                description: 'Mantenimiento de equipos'
            },
            {
                id: 'administracion',
                name: 'Administración',
                description: 'Panel de administración'
            },
            {
                id: 'usuarios',
                name: 'Gestión de Empleados',
                description: 'Administrar empleados'
            },
            {
                id: 'areas',
                name: 'Gestión de Áreas',
                description: 'Administrar áreas'
            },
            {
                id: 'roles',
                name: 'Gestión de Roles',
                description: 'Administrar permisos'
            }
        ];
    }

    // ==========================================
    // CARGAR DATOS
    // ==========================================

    async cargarDatos() {
        try {
            console.log('📂 Cargando datos...');
            this.showLoading(true);

            // Cargar empleados y usuarios en paralelo
            const [empleadosData, usuariosData] = await Promise.all([
                this.fb.readAll('empleados', {
                    where: [['estado', '==', 'activo']],
                    orderBy: ['nombre', 'asc']
                }),
                this.fb.readAll('usuarios', {
                    orderBy: ['nombre', 'asc']
                })
            ]);

            this.empleados = empleadosData;
            this.usuarios = usuariosData;

            console.log(`✅ ${this.empleados.length} empleados y ${this.usuarios.length} usuarios cargados`);

            // Combinar datos para la vista
            this.combinarDatos();
            this.applyFilters();
        } catch (error) {
            console.error('❌ Error al cargar datos:', error);
            this.showError('Error al cargar los datos');
        } finally {
            this.showLoading(false);
        }
    }

    combinarDatos() {
        // Crear un mapa de usuarios por correo para acceso rápido
        const usuariosMap = {};
        this.usuarios.forEach(usuario => {
            if (usuario.correo) {
                usuariosMap[usuario.correo.toLowerCase()] = usuario;
            }
        });

        // Combinar empleados con sus datos de usuario
        this.empleados = this.empleados.map(emp => {
            const usuario = usuariosMap[emp.correo?.toLowerCase()] || null;
            return {
                ...emp,
                tieneAcceso: !!usuario,
                usuarioId: usuario?.id || null,
                modulosAcceso: usuario?.modulos || [],
                hasPassword: !!usuario?.hasPassword
            };
        });
    }

    // ==========================================
    // FILTROS Y BÚSQUEDA
    // ==========================================

    applyFilters() {
        let filtered = [...this.empleados];

        if (this.currentFilter === 'activo') {
            filtered = filtered.filter(emp => emp.tieneAcceso);
        } else if (this.currentFilter === 'inactivo') {
            filtered = filtered.filter(emp => !emp.tieneAcceso);
        }

        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(emp => {
                const nombre = (emp.nombre || '').toLowerCase();
                const apellido = (emp.apellido || '').toLowerCase();
                const correo = (emp.correo || '').toLowerCase();
                const area = (emp.area || '').toLowerCase();
                const puesto = (emp.puesto || '').toLowerCase();

                return nombre.includes(query) ||
                       apellido.includes(query) ||
                       correo.includes(query) ||
                       area.includes(query) ||
                       puesto.includes(query);
            });
        }

        this.filteredUsuarios = filtered;
        this.render();
    }

    // ==========================================
    // RENDERIZADO
    // ==========================================

    render() {
        const container = document.getElementById('tableContainer');

        if (this.filteredUsuarios.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; background: var(--card-bg); border-radius: 16px; border: 1px solid rgba(0, 212, 255, 0.15);">
                    <div style="margin: 0 auto 1.5rem; width: 80px; height: 80px; background: rgba(0, 212, 255, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--primary-color);">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                    </div>
                    <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--text-primary);">
                        No se encontraron usuarios
                    </h3>
                    <p style="opacity: 0.7; margin-bottom: 1.5rem; color: var(--text-secondary);">
                        ${this.searchQuery || this.currentFilter !== 'all' ? 'Intenta cambiar los filtros de búsqueda' : 'No hay empleados activos para gestionar'}
                    </p>
                </div>
            `;
            return;
        }

        let tableHTML = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Nombre Completo</th>
                            <th>Área</th>
                            <th>Puesto</th>
                            <th>Correo</th>
                            <th>Estado</th>
                            <th>Módulos</th>
                            <th class="actions-column">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        this.filteredUsuarios.forEach((emp, index) => {
            const nombreCompleto = `${emp.nombre || ''} ${emp.apellido || ''}`.trim();
            const modulosCount = emp.modulosAcceso?.length || 0;
            const modulosText = modulosCount > 0 ? `${modulosCount} módulos` : 'Sin módulos';

            tableHTML += `
                <tr>
                    <td><strong>${nombreCompleto || 'N/A'}</strong></td>
                    <td>${emp.area || 'N/A'}</td>
                    <td>${emp.puesto || 'N/A'}</td>
                    <td>${emp.correo || 'N/A'}</td>
                    <td>
                        <span class="status-badge ${emp.tieneAcceso ? 'activo' : 'inactivo'}">
                            ${emp.tieneAcceso ? 'CON ACCESO' : 'SIN ACCESO'}
                        </span>
                    </td>
                    <td>
                        ${emp.tieneAcceso ? `
                            <div class="modules-list">
                                ${emp.modulosAcceso.slice(0, 3).map(modId => {
                                    const mod = this.availableModules.find(m => m.id === modId);
                                    return mod ? `
                                        <span class="module-badge" title="${mod.description}">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <polyline points="20 6 9 17 4 12"/>
                                            </svg>
                                            ${mod.name}
                                        </span>
                                    ` : '';
                                }).join('')}
                                ${modulosCount > 3 ? `<span class="module-badge">+${modulosCount - 3} más</span>` : ''}
                            </div>
                        ` : '<span style="opacity: 0.5;">—</span>'}
                    </td>
                    <td class="actions-cell">
                        <button class="action-btn" onclick="window.rolesController.editPermissions(${index})" title="${emp.tieneAcceso ? 'Editar permisos' : 'Dar acceso'}">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            </svg>
                        </button>
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tableHTML;
    }

    // ==========================================
    // MODAL
    // ==========================================

    editPermissions(index) {
        const emp = this.filteredUsuarios[index];
        this.currentEmpleado = emp;
        this.editingEmpleadoId = emp.id;
        this.editingUserId = emp.usuarioId;

        const nombreCompleto = `${emp.nombre || ''} ${emp.apellido || ''}`.trim();
        document.getElementById('userNameDisplay').textContent = nombreCompleto;

        // Configurar el toggle de acceso
        const hasAccessCheckbox = document.getElementById('hasAccess');
        hasAccessCheckbox.checked = emp.tieneAcceso;
        this.updateAccessToggle(emp.tieneAcceso);

        // Si tiene acceso, llenar los datos
        if (emp.tieneAcceso) {
            this.showPermissionsContainer();
            // No llenar la contraseña por seguridad
            document.getElementById('password').value = '';
            this.renderModulesGrid(emp.modulosAcceso || []);
        } else {
            this.hidePermissionsContainer();
        }

        this.showModal();
    }

    showModal() {
        const modal = document.getElementById('permissionsModal');
        modal.classList.add('show');
        if (window.dashboard) {
            window.dashboard.sounds.playClick();
        }
    }

    hideModal() {
        const modal = document.getElementById('permissionsModal');
        modal.classList.remove('show');
        this.resetForm();
    }

    updateAccessToggle(hasAccess) {
        const toggleText = document.getElementById('accessToggleText');
        toggleText.textContent = hasAccess ? 'Activo' : 'Inactivo';

        if (hasAccess) {
            this.showPermissionsContainer();
            // Renderizar módulos con los módulos actuales o vacío
            const currentModules = this.currentEmpleado?.modulosAcceso || [];
            this.renderModulesGrid(currentModules);
        } else {
            this.hidePermissionsContainer();
        }
    }

    showPermissionsContainer() {
        document.getElementById('permissionsContainer').style.display = 'block';
    }

    hidePermissionsContainer() {
        document.getElementById('permissionsContainer').style.display = 'none';
    }

    renderModulesGrid(selectedModules = []) {
        const grid = document.getElementById('modulesGrid');
        grid.innerHTML = '';

        this.availableModules.forEach(module => {
            const isSelected = selectedModules.includes(module.id);

            const card = document.createElement('div');
            card.className = `module-card ${isSelected ? 'selected' : ''}`;
            card.onclick = () => this.toggleModuleSelection(module.id);

            card.innerHTML = `
                <input
                    type="checkbox"
                    class="module-checkbox"
                    id="module-${module.id}"
                    ${isSelected ? 'checked' : ''}
                    onclick="event.stopPropagation();"
                >
                <div class="module-info">
                    <p class="module-name">${module.name}</p>
                    <p class="module-description">${module.description}</p>
                </div>
            `;

            grid.appendChild(card);
        });
    }

    toggleModuleSelection(moduleId) {
        const checkbox = document.getElementById(`module-${moduleId}`);
        checkbox.checked = !checkbox.checked;

        const card = checkbox.closest('.module-card');
        card.classList.toggle('selected', checkbox.checked);

        if (window.dashboard) {
            window.dashboard.sounds.playClick();
        }
    }

    // ==========================================
    // CRUD OPERATIONS
    // ==========================================

    async save() {
        try {
            const hasAccess = document.getElementById('hasAccess').checked;

            if (!hasAccess) {
                // Si no tiene acceso, eliminar usuario si existe
                if (this.editingUserId) {
                    await this.removeAccess();
                } else {
                    this.showInfo('El usuario no tiene acceso al sistema');
                    this.hideModal();
                }
                return;
            }

            // Validar contraseña solo si está creando nuevo usuario o si cambió la contraseña
            const password = document.getElementById('password').value.trim();

            if (!this.editingUserId && !password) {
                this.showError('La contraseña es obligatoria para nuevos usuarios');
                return;
            }

            if (password && password.length < 6) {
                this.showError('La contraseña debe tener al menos 6 caracteres');
                return;
            }

            // Obtener módulos seleccionados
            const selectedModules = [];
            this.availableModules.forEach(module => {
                const checkbox = document.getElementById(`module-${module.id}`);
                if (checkbox && checkbox.checked) {
                    selectedModules.push(module.id);
                }
            });

            if (selectedModules.length === 0) {
                this.showError('Debes seleccionar al menos un módulo');
                return;
            }

            this.showLoading(true);

            const usuarioData = {
                nombre: this.currentEmpleado.nombre,
                apellido: this.currentEmpleado.apellido,
                correo: this.currentEmpleado.correo,
                area: this.currentEmpleado.area,
                puesto: this.currentEmpleado.puesto,
                modulos: selectedModules,
                empleadoId: this.editingEmpleadoId,
                activo: true
            };

            if (this.editingUserId) {
                // Actualizar usuario existente
                await this.fb.update('usuarios', this.editingUserId, usuarioData);

                // Si hay nueva contraseña, actualizarla
                if (password) {
                    usuarioData.password = password;
                    usuarioData.hasPassword = true;
                    await this.fb.update('usuarios', this.editingUserId, {
                        password: password,
                        hasPassword: true,
                        updatedAt: this.fb.serverTimestamp()
                    });
                }

                this.showSuccess('Permisos actualizados exitosamente');
            } else {
                // Crear nuevo usuario
                usuarioData.password = password;
                usuarioData.hasPassword = true;
                usuarioData.createdAt = this.fb.serverTimestamp();
                usuarioData.createdBy = window.dashboard.auth.getUserData().uid;

                await this.fb.create('usuarios', usuarioData);
                this.showSuccess('Acceso creado exitosamente');
            }

            this.hideModal();
            await this.cargarDatos();

        } catch (error) {
            console.error('❌ Error al guardar:', error);
            this.showError('Error al guardar los cambios');
        } finally {
            this.showLoading(false);
        }
    }

    async removeAccess() {
        const confirmed = confirm(
            `¿Estás seguro de eliminar el acceso al sistema de:\n\n` +
            `${this.currentEmpleado.nombre} ${this.currentEmpleado.apellido}\n\n` +
            `Esta acción no se puede deshacer.`
        );

        if (!confirmed) return;

        try {
            this.showLoading(true);
            await this.fb.delete('usuarios', this.editingUserId);
            this.showSuccess('Acceso eliminado exitosamente');
            this.hideModal();
            await this.cargarDatos();
        } catch (error) {
            console.error('❌ Error al eliminar acceso:', error);
            this.showError('Error al eliminar el acceso');
        } finally {
            this.showLoading(false);
        }
    }

    resetForm() {
        this.editingUserId = null;
        this.editingEmpleadoId = null;
        this.currentEmpleado = null;
        document.getElementById('hasAccess').checked = false;
        document.getElementById('password').value = '';
        this.updateAccessToggle(false);
    }

    // ==========================================
    // EXPORTAR
    // ==========================================

    exportData() {
        if (this.filteredUsuarios.length === 0) {
            this.showError('No hay datos para exportar');
            return;
        }

        try {
            const dataToExport = this.filteredUsuarios.map(emp => ({
                'Nombre Completo': `${emp.nombre || ''} ${emp.apellido || ''}`.trim(),
                'Área': emp.area || 'N/A',
                'Puesto': emp.puesto || 'N/A',
                'Correo': emp.correo || 'N/A',
                'Estado': emp.tieneAcceso ? 'CON ACCESO' : 'SIN ACCESO',
                'Módulos': emp.modulosAcceso?.map(modId => {
                    const mod = this.availableModules.find(m => m.id === modId);
                    return mod ? mod.name : modId;
                }).join(', ') || 'Sin módulos'
            }));

            Utils.exportToCSV(
                dataToExport,
                `roles_permisos_${Utils.formatDate(new Date(), 'short').replace(/\//g, '-')}.csv`
            );

            this.showSuccess('Datos exportados exitosamente');

            if (window.dashboard) {
                window.dashboard.sounds.playSuccess();
            }
        } catch (error) {
            console.error('❌ Error al exportar:', error);
            this.showError('Error al exportar los datos');
        }
    }

    // ==========================================
    // EVENT LISTENERS
    // ==========================================

    setupEventListeners() {
        // Botón exportar
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        // Modal
        document.getElementById('closeModalBtn').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('saveBtn').addEventListener('click', () => {
            this.save();
        });

        document.getElementById('permissionsModal').addEventListener('click', (e) => {
            if (e.target.id === 'permissionsModal') {
                this.hideModal();
            }
        });

        // Toggle de acceso
        const hasAccessCheckbox = document.getElementById('hasAccess');
        hasAccessCheckbox.addEventListener('change', (e) => {
            this.updateAccessToggle(e.target.checked);
        });

        // Toggle de contraseña
        document.getElementById('togglePasswordBtn').addEventListener('click', () => {
            const passwordInput = document.getElementById('password');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            if (window.dashboard) {
                window.dashboard.sounds.playClick();
            }
        });

        // Tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (document.getElementById('permissionsModal').classList.contains('show')) {
                    this.hideModal();
                }
            }
        });

        // Filtros
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.applyFilters();

                if (window.dashboard) {
                    window.dashboard.sounds.playClick();
                }
            });
        });

        // Búsqueda
        const searchInput = document.getElementById('searchFilter');
        searchInput.addEventListener('input', Utils.debounce((e) => {
            this.searchQuery = e.target.value.trim();
            this.applyFilters();
        }, 300));

        // Sonidos en focus
        document.querySelectorAll('.form-input, .form-select').forEach(input => {
            input.addEventListener('focus', () => {
                if (window.dashboard) {
                    window.dashboard.sounds.playClick();
                }
            });
        });
    }

    // ==========================================
    // MÉTODOS DE UI
    // ==========================================

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.toggle('show', show);
        }
    }

    showSuccess(msg) {
        if (window.dashboard) {
            window.dashboard.showToast(msg, 'success');
        } else {
            console.log('✅', msg);
        }
    }

    showError(msg) {
        if (window.dashboard) {
            window.dashboard.showToast(msg, 'error');
        } else {
            console.error('❌', msg);
        }
    }

    showInfo(msg) {
        if (window.dashboard) {
            window.dashboard.showToast(msg, 'info');
        } else {
            console.log('ℹ️', msg);
        }
    }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    window.rolesController = new RolesController();
});

console.log('📦 Módulo de Gestión de Roles cargado correctamente');
