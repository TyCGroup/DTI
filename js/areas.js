// areas.js - Gestión de Áreas con CRUD Completo

class AreasController {
    constructor() {
        this.fb = getFirebaseHelper();
        this.areas = [];
        this.validator = null;
        this.editingId = null;
        this.unsubscribe = null;
        this.currentFilter = 'all';
        this.init();
    }

    async init() {
        console.log('🚀 Iniciando Gestión de Áreas...');
        
        // Esperar autenticación
        await this.waitForAuth();
        
        // Verificar permisos
        if (!this.checkPermissions()) {
            this.showError('Sin permisos suficientes para gestionar áreas');
            setTimeout(() => window.location.href = 'dashboard.html', 2000);
            return;
        }

        // Setup
        this.setupValidation();
        this.setupRealtimeUpdates();
        
        console.log('✅ Gestión de Áreas inicializada correctamente');
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

    // ==========================================
    // VALIDACIÓN
    // ==========================================
    
    setupValidation() {
        this.validator = new FormValidator('areaForm');
        this.validator.setRules({
            nombre: {
                required: true,
                minLength: 2,
                maxLength: 100,
                message: {
                    required: 'El nombre del área es obligatorio',
                    minLength: 'Mínimo 2 caracteres',
                    maxLength: 'Máximo 100 caracteres'
                }
            },
            descripcion: {
                maxLength: 500,
                message: {
                    maxLength: 'Máximo 500 caracteres'
                }
            },
            estado: {
                required: true
            }
        });
    }

    /**
     * Configura conversión automática a mayúsculas en tiempo real
     */
    setupUppercaseFields() {
        const nombreInput = document.getElementById('nombre');
        const descripcionInput = document.getElementById('descripcion');
        
        // Configurar campo NOMBRE
        if (nombreInput) {
            // Convertir a mayúsculas mientras el usuario escribe
            nombreInput.addEventListener('input', (e) => {
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                
                e.target.value = e.target.value.toUpperCase();
                
                // Mantener posición del cursor
                e.target.setSelectionRange(start, end);
            });
            
            // También convertir al pegar texto
            nombreInput.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                
                // Insertar texto en mayúsculas
                const currentValue = e.target.value;
                e.target.value = currentValue.substring(0, start) + 
                                pastedText.toUpperCase() + 
                                currentValue.substring(end);
                
                // Posicionar cursor después del texto pegado
                const newPosition = start + pastedText.length;
                e.target.setSelectionRange(newPosition, newPosition);
            });
        }
        
        // 👇 CONFIGURAR CAMPO DESCRIPCIÓN
        if (descripcionInput) {
            // Convertir a mayúsculas mientras el usuario escribe
            descripcionInput.addEventListener('input', (e) => {
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                
                e.target.value = e.target.value.toUpperCase();
                
                // Mantener posición del cursor
                e.target.setSelectionRange(start, end);
            });
            
            // También convertir al pegar texto
            descripcionInput.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                
                // Insertar texto en mayúsculas
                const currentValue = e.target.value;
                e.target.value = currentValue.substring(0, start) + 
                                pastedText.toUpperCase() + 
                                currentValue.substring(end);
                
                // Posicionar cursor después del texto pegado
                const newPosition = start + pastedText.length;
                e.target.setSelectionRange(newPosition, newPosition);
            });
        }
    }

    // ==========================================
    // REALTIME UPDATES
    // ==========================================
    
    setupRealtimeUpdates() {
        this.unsubscribe = this.fb.onCollectionChange('areas', 
            (areas) => {
                console.log('📡 Datos actualizados:', areas.length, 'áreas');
                this.areas = areas;
                this.updateCounter();
                this.render();
            },
            {
                orderBy: ['nombre', 'asc']
            }
        );
    }

    updateCounter() {
        const counter = document.getElementById('areasCount');
        if (counter) {
            counter.textContent = `${this.areas.length} áreas registradas`;
        }
    }

    // ==========================================
    // RENDER LISTA
    // ==========================================
    
    render() {
        const container = document.getElementById('areasContainer');
        
        if (this.areas.length === 0) {
            container.innerHTML = this.createEmptyState();
            return;
        }

        // Crear tabla manualmente con acciones
        let tableHTML = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th>Estado</th>
                            <th>Fecha de Creación</th>
                            <th class="actions-column">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        this.areas.forEach((area, index) => {
            tableHTML += `
                <tr>
                    <td><strong>${area.nombre}</strong></td>
                    <td>${area.descripcion || '-'}</td>
                    <td>
                        <span class="badge ${area.estado === 'activo' ? 'success' : 'danger'}">
                            ${area.estado}
                        </span>
                    </td>
                    <td>${Utils.formatDate(area.createdAt?.toDate())}</td>
                    <td class="actions-cell">
                        <button class="action-btn" onclick="window.areasController.edit(${index})" title="Editar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="action-btn danger" onclick="window.areasController.delete(${index})" title="Eliminar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
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

    createEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                </div>
                <h3 class="empty-title">No hay áreas registradas</h3>
                <p class="empty-description">Comienza agregando tu primera área departamental</p>
                <button class="btn btn-primary" onclick="window.areasController.showAddModal()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Agregar Área
                </button>
            </div>
        `;
    }

    // ==========================================
    // MODAL
    // ==========================================
    
    showAddModal() {
        this.editingId = null;
        const modal = document.getElementById('areaFormModal');
        const modalTitle = modal.querySelector('.modal-title');
        
        modalTitle.textContent = 'Nueva Área';
        this.validator.reset();
        
        modal.classList.add('show');
        window.dashboard.sounds.playClick();
        
        // 👇 CONFIGURAR MAYÚSCULAS Y FOCUS
        setTimeout(() => {
            const nombreInput = document.getElementById('nombre');
            if (nombreInput) {
                nombreInput.focus();
            }
            this.setupUppercaseFields(); // Configurar conversión a mayúsculas
        }, 300);
    }

    showEditModal(index) {
        const area = this.areas[index];
        this.editingId = area.id;
        
        const modal = document.getElementById('areaFormModal');
        const modalTitle = modal.querySelector('.modal-title');
        
        modalTitle.textContent = 'Editar Área';
        
        // Llenar formulario con datos existentes
        this.validator.setData({
            nombre: area.nombre,
            descripcion: area.descripcion || '',
            estado: area.estado
        });
        
        modal.classList.add('show');
        window.dashboard.sounds.playClick();
        
        // 👇 CONFIGURAR MAYÚSCULAS
        setTimeout(() => {
            this.setupUppercaseFields(); // Configurar conversión a mayúsculas
        }, 300);
    }

    closeModal() {
        const modal = document.getElementById('areaFormModal');
        modal.classList.remove('show');
        this.editingId = null;
        this.validator.reset();
    }

    // ==========================================
    // CRUD OPERATIONS
    // ==========================================
    
    async save() {
        // Validar formulario
        if (!this.validator.validate()) {
            this.showError('Por favor corrige los errores en el formulario');
            return;
        }

        try {
            this.showLoading(true);
            let data = this.validator.getData();
            
            // 👇 NORMALIZAR DATOS - AMBOS CAMPOS
            // Convertir nombre a mayúsculas y limpiar espacios
            if (data.nombre) {
                data.nombre = data.nombre.trim().toUpperCase();
            }
            
            // 👇 TAMBIÉN CONVERTIR DESCRIPCIÓN A MAYÚSCULAS
            if (data.descripcion) {
                data.descripcion = data.descripcion.trim().toUpperCase();
            }
            
            if (this.editingId) {
                // UPDATE
                data.updatedAt = this.fb.serverTimestamp();
                data.updatedBy = window.dashboard.auth.getUserData().uid;
                await this.fb.update('areas', this.editingId, data);
                this.showSuccess('Área actualizada exitosamente');
            } else {
                // CREATE
                data.createdAt = this.fb.serverTimestamp();
                data.updatedAt = this.fb.serverTimestamp();
                data.createdBy = window.dashboard.auth.getUserData().uid;
                
                await this.fb.create('areas', data);
                this.showSuccess('Área creada exitosamente');
            }

            this.closeModal();
            
        } catch (error) {
            console.error('Error al guardar área:', error);
            this.showError('Error al guardar el área: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    edit(index) {
        window.areasController.showEditModal(index);
    }

    async delete(index) {
        const area = this.areas[index];
        
        if (!confirm(`¿Estás seguro de eliminar el área "${area.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }

        try {
            this.showLoading(true);
            await this.fb.delete('areas', area.id);
            this.showSuccess('Área eliminada exitosamente');
        } catch (error) {
            console.error('Error al eliminar área:', error);
            this.showError('Error al eliminar el área: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    // ==========================================
    // FILTROS
    // ==========================================
    
    filter(estado) {
        // Actualizar botones activos
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        this.currentFilter = estado;

        // Limpiar listener anterior
        if (this.unsubscribe) this.unsubscribe();

        // Aplicar filtro
        if (estado === 'all') {
            this.setupRealtimeUpdates();
        } else {
            this.unsubscribe = this.fb.onCollectionChange('areas',
                (areas) => {
                    this.areas = areas;
                    this.updateCounter();
                    this.render();
                },
                {
                    where: [['estado', '==', estado]],
                    orderBy: ['nombre', 'asc']
                }
            );
        }
    }

    // ==========================================
    // EXPORT
    // ==========================================
    
    exportData() {
        try {
            const exportData = this.areas.map(area => ({
                Nombre: area.nombre,
                Descripción: area.descripcion || '',
                Estado: area.estado,
                'Fecha de Creación': Utils.formatDate(area.createdAt?.toDate())
            }));

            Utils.exportToCSV(exportData, `areas_${Date.now()}.csv`);
            this.showSuccess('Datos exportados exitosamente');
        } catch (error) {
            console.error('Error al exportar:', error);
            this.showError('Error al exportar los datos');
        }
    }

    // ==========================================
    // UI HELPERS
    // ==========================================
    
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.toggle('show', show);
    }

    showSuccess(msg) {
        if (window.dashboard) {
            window.dashboard.showToast(msg, 'success');
        }
    }

    showError(msg) {
        if (window.dashboard) {
            window.dashboard.showToast(msg, 'error');
        }
    }

    showInfo(msg) {
        if (window.dashboard) {
            window.dashboard.showToast(msg, 'info');
        }
    }

    // ==========================================
    // CLEANUP
    // ==========================================
    
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
            console.log('🧹 Listeners de áreas limpiados');
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.areasController = new AreasController();
});

// Limpiar al salir de la página
window.addEventListener('beforeunload', () => {
    if (window.areasController) {
        window.areasController.destroy();
    }
});

console.log('📦 Módulo de Gestión de Áreas cargado');