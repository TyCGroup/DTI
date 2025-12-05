// ====================================================
// INVENTARIO-LAPTOP.JS - TyC Group Dashboard
// Gestión de Inventario de Desktops
// ====================================================

class InventarioDesktopController {
    constructor() {
        this.fb = getFirebaseHelper();
        this.validator = null;
        this.desktops = [];
        this.filteredDesktops = [];
        this.usuarios = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.editingId = null;
        this.currentDesktopForAssign = null;
        this.unsubscribe = null;
        this.init();
    }

    async init() {
        console.log('🚀 Iniciando Inventario de Desktops...');

        try {
            // Esperar autenticación
            await this.waitForAuth();

            // Verificar permisos
            if (!this.checkPermissions()) {
                this.showError('No tienes permisos para gestionar inventario de desktops');
                setTimeout(() => window.location.href = 'dashboard.html', 2000);
                return;
            }

            // Setup
            this.initValidator();
            this.setupEventListeners();
            await this.loadUsuarios();
            await this.loadData();

            console.log('✅ Inventario de Desktops inicializado');
        } catch (error) {
            console.error('❌ Error al inicializar:', error);
            this.showError('Error al inicializar el módulo');
        }
    }

    // ===== AUTH Y PERMISOS =====

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
        const allowedRoles = ['admin', 'superadmin'];
        return allowedRoles.includes(userRole);
    }

    // ===== VALIDACIÓN =====

    initValidator() {
        this.validator = new FormValidator('desktopForm');
        this.validator.setRules({
            st: {
                required: true,
                pattern: /^[A-Z0-9-]+$/,
                minLength: 5,
                maxLength: 20,
                custom: async (value, form) => {
                    // Validación de ST único en tiempo real
                    if (!value) return true;
                    return await this.validateUniqueSTClient(value);
                },
                message: {
                    required: 'El ST es obligatorio',
                    pattern: 'Solo mayúsculas, números y guiones',
                    minLength: 'Mínimo 5 caracteres',
                    custom: 'Este ST ya está registrado en el sistema. No se puede duplicar.'
                }
            },
            marca: {
                required: true,
                message: { required: 'Selecciona una marca' }
            },
            modelo: {
                required: true,
                minLength: 2,
                maxLength: 100,
                message: { required: 'El modelo es obligatorio' }
            },
            fechaAdquisicion: {
                required: true,
                custom: (value) => {
                    if (!value) return false;
                    const selectedDate = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return selectedDate <= today;
                },
                message: {
                    required: 'La fecha es obligatoria',
                    custom: 'No se permiten fechas futuras'
                }
            },
            sistema: {
                required: true,
                message: { required: 'Selecciona un sistema operativo' }
            },
            procesador: {
                required: true,
                message: { required: 'Selecciona un procesador' }
            },
            ram: {
                required: true,
                message: { required: 'Selecciona la RAM' }
            },
            capacidadDisco: {
                required: true,
                message: { required: 'Selecciona la capacidad de disco' }
            },
            tipoDisco: {
                required: true,
                message: { required: 'Selecciona el tipo de disco' }
            },
            propiedad: {
                required: true,
                message: { required: 'Selecciona el tipo de propiedad' }
            }
        });
    }

    // ⚠️ CRÍTICO: Validación de ST único
    async validateUniqueSTClient(st) {
        try {
            // Si estamos editando, permitir el mismo ST
            if (this.editingId) {
                const currentDesktop = this.desktops.find(l => l.id === this.editingId);
                if (currentDesktop && currentDesktop.st === st) {
                    return true;
                }
            }

            // Buscar en Firestore si ya existe
            const exists = await this.fb.existsWhere('inventarios_desktops', 'st', '==', st);
            return !exists; // Retorna true si NO existe (válido)
        } catch (error) {
            console.error('Error validando ST único:', error);
            return false;
        }
    }

    // ===== EVENT LISTENERS =====

    setupEventListeners() {
        // Botón agregar desktop
        document.getElementById('addDesktopBtn')?.addEventListener('click', () => {
            this.showModal();
        });

        // Botón guardar en modal
        document.getElementById('saveBtn')?.addEventListener('click', () => {
            this.handleSave();
        });

        // Botón cancelar
        document.getElementById('cancelBtn')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Cerrar modal (X)
        document.getElementById('closeModalBtn')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Exportar
        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.exportData();
        });

        // Filtros
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.filterData();
            });
        });

        // Búsqueda
        document.getElementById('searchFilter')?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.filterData();
        });

        // Toggle activo/inactivo
        document.getElementById('activoToggle')?.addEventListener('change', (e) => {
            const isActive = e.target.checked;
            const toggleText = document.getElementById('toggleText');
            const inactiveFields = document.getElementById('inactiveFields');

            toggleText.textContent = isActive ? 'Activo' : 'Inactivo';
            inactiveFields.style.display = isActive ? 'none' : 'block';

            if (isActive) {
                // Limpiar campos condicionales
                document.getElementById('categoriaInactivo').value = '';
                document.getElementById('motivoInactivo').value = '';
                document.getElementById('motivoOtroContainer').style.display = 'none';
            }
        });

        // Categoría inactivo - mostrar motivo si es "Otro"
        document.getElementById('categoriaInactivo')?.addEventListener('change', (e) => {
            const motivoContainer = document.getElementById('motivoOtroContainer');
            motivoContainer.style.display = e.target.value === 'otro' ? 'block' : 'none';
        });

        // Autocomplete empleado en formulario
        this.setupAutocomplete('empleadoAsignado', 'autocompleteEmpleados', 'empleadoAsignadoId');

        // Modal asignar usuario
        document.getElementById('closeAssignModalBtn')?.addEventListener('click', () => {
            this.closeAssignModal();
        });

        document.getElementById('cancelAssignBtn')?.addEventListener('click', () => {
            this.closeAssignModal();
        });

        document.getElementById('confirmAssignBtn')?.addEventListener('click', () => {
            this.confirmAssignUser();
        });

        this.setupAutocomplete('searchUserInput', 'assignAutocompleteResults', 'selectedUserId');

        // Modal detalle
        document.getElementById('closeDetailModalBtn')?.addEventListener('click', () => {
            this.closeDetailModal();
        });

        document.getElementById('closeDetailBtn')?.addEventListener('click', () => {
            this.closeDetailModal();
        });

        document.getElementById('editFromDetailBtn')?.addEventListener('click', () => {
            const desktopId = this.currentDesktopForAssign;
            this.closeDetailModal();
            this.edit(desktopId);
        });

        document.getElementById('downloadExcelBtn')?.addEventListener('click', () => {
            this.downloadSingleExcel();
        });

        // Acordeón para secciones del formulario
        document.querySelectorAll('.form-section-title').forEach(title => {
            title.addEventListener('click', () => {
                const section = title.parentElement;
                section.classList.toggle('collapsed');
            });
        });

        // Modal de eliminación
        document.getElementById('closeDeleteModalBtn')?.addEventListener('click', () => {
            this.closeDeleteModal();
        });

        document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => {
            this.closeDeleteModal();
        });

        document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => {
            this.confirmDelete();
        });

        // Validación en tiempo real del ST
        document.getElementById('st')?.addEventListener('blur', async (e) => {
            const st = e.target.value.trim().toUpperCase();
            if (st.length >= 5) {
                const isValid = await this.validateUniqueSTClient(st);
                const input = e.target;
                const errorSpan = document.getElementById('stError');

                if (!isValid) {
                    input.classList.add('is-invalid');
                    errorSpan.textContent = 'Este ST ya está registrado en el sistema. No se puede duplicar.';
                    errorSpan.style.display = 'block';
                } else {
                    input.classList.remove('is-invalid');
                    errorSpan.textContent = '';
                    errorSpan.style.display = 'none';
                }
            }
        });

        // Convertir ST a mayúsculas automáticamente
        document.getElementById('st')?.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    // ===== AUTOCOMPLETE =====

    setupAutocomplete(inputId, resultsId, hiddenId) {
        const input = document.getElementById(inputId);
        const results = document.getElementById(resultsId);
        const hidden = document.getElementById(hiddenId);

        if (!input || !results) return;

        let debounceTimer;

        input.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const query = e.target.value.toLowerCase().trim();

            if (query.length < 2) {
                results.innerHTML = '';
                results.style.display = 'none';
                if (hidden) hidden.value = '';
                return;
            }

            debounceTimer = setTimeout(() => {
                const filtered = this.usuarios.filter(u =>
                    u.nombre.toLowerCase().includes(query) ||
                    u.email.toLowerCase().includes(query) ||
                    (u.area && u.area.toLowerCase().includes(query))
                );

                if (filtered.length === 0) {
                    results.innerHTML = '<div class="autocomplete-item no-results">No se encontraron empleados</div>';
                    results.style.display = 'block';
                    return;
                }

                results.innerHTML = filtered.map(u => `
                    <div class="autocomplete-item" data-id="${u.id}">
                        <div class="autocomplete-name">${u.nombre}</div>
                        <div class="autocomplete-details">${u.area || 'Sin área'} - ${u.email}</div>
                    </div>
                `).join('');

                results.style.display = 'block';

                // Click en item
                results.querySelectorAll('.autocomplete-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const userId = item.dataset.id;
                        const user = this.usuarios.find(u => u.id === userId);
                        if (user) {
                            input.value = user.nombre;
                            if (hidden) hidden.value = user.id;
                            results.style.display = 'none';

                            // Habilitar botón de asignar si estamos en el modal de asignar
                            if (inputId === 'searchUserInput') {
                                document.getElementById('confirmAssignBtn').disabled = false;
                            }
                        }
                    });
                });
            }, 200);
        });

        // Cerrar al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !results.contains(e.target)) {
                results.style.display = 'none';
            }
        });
    }

    // ===== CARGAR DATOS =====

    async loadUsuarios() {
        try {
            // Cargar empleados en lugar de usuarios de la plataforma
            // Los empleados usan "estado: 'activo'" no "activo: true"
            const empleados = await this.fb.readAll('empleados', {
                where: [['estado', '==', 'activo']]
            });

            console.log('📋 Empleados raw desde Firestore:', empleados);

            // Concatenar nombre y apellido en un solo campo 'nombre'
            this.usuarios = empleados.map(emp => ({
                ...emp,
                nombre: `${emp.nombre || ''} ${emp.apellido || ''}`.trim(),
                area: emp.area || emp.areaId || '',
                email: emp.correo || emp.email || ''
            })).sort((a, b) => a.nombre.localeCompare(b.nombre));

            console.log('✅ Empleados cargados y procesados:', this.usuarios.length);
            if (this.usuarios.length > 0) {
                console.log('📝 Ejemplo de empleado:', this.usuarios[0]);
            }
        } catch (error) {
            console.error('❌ Error cargando empleados:', error);
            this.usuarios = [];
        }
    }

    async loadData() {
        try {
            this.showLoading(true);

            // Escuchar cambios en tiempo real
            this.unsubscribe = this.fb.onSnapshot('inventarios_desktops', (docs) => {
                console.log('📦 Datos de desktops recibidos:', docs);
                this.desktops = docs;
                this.filterData();
                this.showLoading(false);
            }, (error) => {
                console.error('❌ Error en listener:', error);
                this.showError('Error al cargar inventario: ' + error.message);
                this.showLoading(false);
            });
        } catch (error) {
            console.error('❌ Error al configurar listener:', error);
            this.showError('Error al cargar inventario: ' + error.message);
            this.showLoading(false);
        }
    }

    // ===== FILTRAR DATOS =====

    filterData() {
        console.log('🔍 Filtrando datos. Total desktops:', this.desktops.length);

        this.filteredDesktops = this.desktops.filter(desktop => {
            const matchesSearch =
                desktop.st.toLowerCase().includes(this.searchQuery) ||
                desktop.marca.toLowerCase().includes(this.searchQuery) ||
                desktop.modelo.toLowerCase().includes(this.searchQuery) ||
                (desktop.usuarioAsignado && desktop.usuarioAsignado.nombre.toLowerCase().includes(this.searchQuery));

            const matchesFilter =
                this.currentFilter === 'all' ||
                (this.currentFilter === 'activo' && desktop.activo) ||
                (this.currentFilter === 'inactivo' && !desktop.activo);

            return matchesSearch && matchesFilter;
        });

        // Actualizar contador
        const count = this.filteredDesktops.length;
        console.log('📊 Desktops filtradas:', count);

        const itemCount = document.getElementById('itemCount');
        if (itemCount) {
            itemCount.textContent = `${count} desktop${count !== 1 ? 's' : ''}`;
        }

        this.renderTable();
    }

    // ===== RENDERIZAR TABLA =====

    renderTable() {
        console.log('🎨 Renderizando tabla. Desktops filtradas:', this.filteredDesktops.length);

        const container = document.getElementById('tableContainer');
        if (!container) {
            console.error('❌ No se encontró tableContainer');
            return;
        }

        if (this.filteredDesktops.length === 0) {
            console.log('📭 Mostrando estado vacío');
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                    </svg>
                    <h3>No hay desktops registradas</h3>
                    <p>Comienza agregando una nueva desktop al inventario</p>
                    <button class="btn btn-primary" onclick="window.inventarioDesktopController.showModal()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Agregar Primera Desktop
                    </button>
                </div>
            `;
            return;
        }

        const tableHTML = `
            <div class="table-container">
                <table class="equipos-table">
                    <thead>
                        <tr>
                            <th>ST</th>
                            <th>Marca</th>
                            <th>Modelo</th>
                            <th>Usuario</th>
                            <th>Sistema</th>
                            <th>RAM</th>
                            <th>Disco</th>
                            <th>Propiedad</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.filteredDesktops.map(desktop => this.renderTableRow(desktop)).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tableHTML;
    }

    renderTableRow(desktop) {
        const marcaLabel = this.getMarcaLabel(desktop.marca);
        const sistemaLabel = this.getSistemaLabel(desktop.sistema);
        const propiedadLabel = this.getPropiedadLabel(desktop.propiedad);
        // Soporte para campo antiguo (usuarioAsignado) y nuevo (empleadoAsignado)
        const asignado = desktop.empleadoAsignado || desktop.usuarioAsignado;
        const usuarioNombre = asignado ? asignado.nombre : 'Sin asignar';

        return `
            <tr class="table-row">
                <td><strong>${desktop.st}</strong></td>
                <td>${marcaLabel}</td>
                <td>${desktop.modelo}</td>
                <td>${usuarioNombre}</td>
                <td>${sistemaLabel}</td>
                <td>${desktop.ram} GB</td>
                <td>${desktop.capacidadDisco} GB ${desktop.tipoDisco.toUpperCase()}</td>
                <td>${propiedadLabel}</td>
                <td>
                    <span class="status-badge ${desktop.activo ? 'activo' : 'inactivo'}">
                        ${desktop.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="window.inventarioDesktopController.viewDetails('${desktop.id}')" title="Ver detalles">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        </button>
                        <button class="btn-icon" onclick="window.inventarioDesktopController.edit('${desktop.id}')" title="Editar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="btn-icon" onclick="window.inventarioDesktopController.showAssignUserModal('${desktop.id}')" title="Asignar usuario">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                <circle cx="8.5" cy="7" r="4"/>
                                <line x1="20" y1="8" x2="20" y2="14"/>
                                <line x1="23" y1="11" x2="17" y2="11"/>
                            </svg>
                        </button>
                        <button class="btn-icon btn-delete" onclick="window.inventarioDesktopController.showDeleteModal('${desktop.id}')" title="Eliminar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    // ===== MODAL OPERACIONES =====

    showModal(editId = null) {
        const modal = document.getElementById('desktopModal');
        const title = document.getElementById('modalTitle');
        const saveBtn = document.getElementById('saveBtn');

        this.editingId = editId;

        if (editId) {
            title.textContent = 'Editar Desktop';
            saveBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                </svg>
                Guardar Cambios
            `;

            const desktop = this.desktops.find(l => l.id === editId);
            if (desktop) {
                this.fillFormWithDesktop(desktop);
                // Deshabilitar campo ST en modo edición
                document.getElementById('st').disabled = true;
            }
        } else {
            title.textContent = 'Nueva Desktop';
            saveBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                </svg>
                Guardar Desktop
            `;
            this.validator.reset();
            document.getElementById('st').disabled = false;
            document.getElementById('inactiveFields').style.display = 'none';
            document.getElementById('activoToggle').checked = true;
            document.getElementById('toggleText').textContent = 'Activo';
        }

        modal.classList.add('show');
    }

    fillFormWithDesktop(desktop) {
        document.getElementById('st').value = desktop.st;
        document.getElementById('marca').value = desktop.marca;
        document.getElementById('modelo').value = desktop.modelo;
        document.getElementById('fechaAdquisicion').value = desktop.fechaAdquisicion;
        document.getElementById('sistema').value = desktop.sistema;
        document.getElementById('procesador').value = desktop.procesador;
        document.getElementById('ram').value = desktop.ram;
        document.getElementById('capacidadDisco').value = desktop.capacidadDisco;
        document.getElementById('tipoDisco').value = desktop.tipoDisco;
        document.getElementById('propiedad').value = desktop.propiedad;

        // Soporte para campo antiguo (usuarioAsignado) y nuevo (empleadoAsignado)
        const asignado = desktop.empleadoAsignado || desktop.usuarioAsignado;
        if (asignado) {
            document.getElementById('empleadoAsignado').value = asignado.nombre;
            document.getElementById('empleadoAsignadoId').value = asignado.id;
        }

        document.getElementById('activoToggle').checked = desktop.activo;
        document.getElementById('toggleText').textContent = desktop.activo ? 'Activo' : 'Inactivo';
        document.getElementById('inactiveFields').style.display = desktop.activo ? 'none' : 'block';

        if (!desktop.activo) {
            document.getElementById('categoriaInactivo').value = desktop.categoriaInactivo || '';
            if (desktop.categoriaInactivo === 'otro') {
                document.getElementById('motivoOtroContainer').style.display = 'block';
                document.getElementById('motivoInactivo').value = desktop.motivoInactivo || '';
            }
        }
    }

    closeModal() {
        const modal = document.getElementById('desktopModal');
        modal.classList.remove('show');
        this.editingId = null;
        this.validator.reset();
        document.getElementById('st').disabled = false;
        document.getElementById('stError').textContent = '';
        document.getElementById('stError').style.display = 'none';
        document.getElementById('st').classList.remove('is-invalid');
    }

    // ===== GUARDAR =====

    async handleSave() {
        if (!this.validator.validate()) {
            this.showError('Por favor completa todos los campos obligatorios correctamente');
            return;
        }

        const formData = this.validator.getData();

        // Validar campos condicionales
        if (!formData.activo) {
            if (!formData.categoriaInactivo) {
                this.showError('Selecciona una categoría de inactividad');
                return;
            }
            if (formData.categoriaInactivo === 'otro' && !formData.motivoInactivo) {
                this.showError('Especifica el motivo de inactividad');
                return;
            }
        }

        // ⚠️ VALIDACIÓN CRÍTICA: Verificar ST único antes de guardar
        const stIsValid = await this.validateUniqueSTClient(formData.st);
        if (!stIsValid) {
            this.showError('Este ST ya está registrado en el sistema. No se puede duplicar.');
            document.getElementById('st').classList.add('is-invalid');
            document.getElementById('stError').textContent = 'Este ST ya está registrado en el sistema.';
            document.getElementById('stError').style.display = 'block';
            return;
        }

        try {
            const saveBtn = document.getElementById('saveBtn');
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner-small"></span> Guardando...';

            const desktopData = {
                st: formData.st.toUpperCase(),
                marca: formData.marca,
                modelo: formData.modelo,
                fechaAdquisicion: formData.fechaAdquisicion,
                sistema: formData.sistema,
                procesador: formData.procesador,
                ram: formData.ram,
                capacidadDisco: formData.capacidadDisco,
                tipoDisco: formData.tipoDisco,
                propiedad: formData.propiedad,
                activo: formData.activo,
                categoriaInactivo: formData.activo ? null : formData.categoriaInactivo,
                motivoInactivo: (formData.activo || formData.categoriaInactivo !== 'otro') ? null : formData.motivoInactivo
            };

            // Empleado asignado
            const empleadoId = document.getElementById('empleadoAsignadoId').value;
            console.log('🔍 Empleado ID capturado:', empleadoId);

            if (empleadoId) {
                const empleado = this.usuarios.find(u => u.id === empleadoId);
                console.log('👤 Empleado encontrado:', empleado);

                if (empleado) {
                    desktopData.empleadoAsignado = {
                        id: empleado.id,
                        nombre: empleado.nombre,
                        area: empleado.area || '',
                        email: empleado.email || ''
                    };
                    console.log('✅ Empleado asignado guardado:', desktopData.empleadoAsignado);
                } else {
                    desktopData.empleadoAsignado = null;
                }
            } else {
                desktopData.empleadoAsignado = null;
            }

            console.log('💾 Data completa a guardar:', desktopData);

            const userData = window.dashboard.auth.getUserData();
            const currentUserId = userData?.id || userData?.uid || firebase.auth().currentUser?.uid;

            if (this.editingId) {
                // Actualizar
                desktopData.modificadoPor = currentUserId;
                desktopData.fechaModificacion = firebase.firestore.FieldValue.serverTimestamp();

                await this.fb.update('inventarios_desktops', this.editingId, desktopData);
                this.showToast('Desktop actualizada correctamente', 'success');
            } else {
                // Crear nueva
                desktopData.creadoPor = currentUserId;
                desktopData.fechaCreacion = firebase.firestore.FieldValue.serverTimestamp();
                desktopData.modificadoPor = currentUserId;
                desktopData.fechaModificacion = firebase.firestore.FieldValue.serverTimestamp();
                desktopData.historial = [];

                // Si tiene empleado asignado, agregar al historial
                // NOTA: No se puede usar serverTimestamp() dentro de arrays en Firestore
                if (desktopData.empleadoAsignado) {
                    desktopData.historial = [{
                        id: this.generateId(),
                        empleadoId: desktopData.empleadoAsignado.id,
                        empleadoNombre: desktopData.empleadoAsignado.nombre,
                        empleadoArea: desktopData.empleadoAsignado.area,
                        fechaAsignacion: new Date(),
                        fechaRetiro: null
                    }];
                }

                await this.fb.create('inventarios_desktops', desktopData);
                this.showToast('Desktop agregada exitosamente', 'success');
            }

            this.closeModal();
        } catch (error) {
            console.error('Error al guardar desktop:', error);
            if (error.code === 'permission-denied') {
                this.showError('No tienes permisos para realizar esta acción');
            } else {
                this.showError('Error al guardar. Intenta nuevamente');
            }

            const saveBtn = document.getElementById('saveBtn');
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Guardar Desktop';
        }
    }

    // ===== EDITAR =====

    edit(id) {
        this.showModal(id);
    }

    // ===== ELIMINAR =====

    showDeleteModal(id) {
        this.deleteTargetId = id;
        const desktop = this.desktops.find(l => l.id === id);
        if (!desktop) return;

        document.getElementById('deleteDesktopST').textContent = desktop.st;
        document.getElementById('deleteModal').classList.add('show');
    }

    closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('show');
        this.deleteTargetId = null;
    }

    async confirmDelete() {
        if (!this.deleteTargetId) return;

        try {
            await this.fb.delete('inventarios_desktops', this.deleteTargetId);
            this.showToast('Desktop eliminada correctamente', 'success');
            this.closeDeleteModal();
        } catch (error) {
            console.error('Error al eliminar desktop:', error);
            this.showError('Error al eliminar');
        }
    }

    // ===== ASIGNAR USUARIO =====

    showAssignUserModal(desktopId) {
        const desktop = this.desktops.find(l => l.id === desktopId);
        if (!desktop) return;

        this.currentDesktopForAssign = desktopId;

        document.getElementById('assignDesktopInfo').textContent = `${desktop.st} - ${desktop.marca} ${desktop.modelo}`;

        // Soporte para empleado y usuario asignado
        const asignado = desktop.empleadoAsignado || desktop.usuarioAsignado;
        document.getElementById('assignCurrentUser').textContent = asignado ? asignado.nombre : 'Sin asignar';

        document.getElementById('searchUserInput').value = '';
        document.getElementById('selectedUserId').value = '';
        document.getElementById('confirmAssignBtn').disabled = true;
        document.getElementById('assignAutocompleteResults').innerHTML = '';

        const modal = document.getElementById('assignUserModal');
        modal.classList.add('show');
    }

    closeAssignModal() {
        const modal = document.getElementById('assignUserModal');
        modal.classList.remove('show');
        this.currentDesktopForAssign = null;
    }

    async confirmAssignUser() {
        const userId = document.getElementById('selectedUserId').value;
        if (!userId) {
            this.showError('Selecciona un usuario');
            return;
        }

        const desktop = this.desktops.find(l => l.id === this.currentDesktopForAssign);
        if (!desktop) return;

        const usuario = this.usuarios.find(u => u.id === userId);
        if (!usuario) return;

        try {
            const btn = document.getElementById('confirmAssignBtn');
            btn.disabled = true;
            btn.textContent = 'Asignando...';

            // Actualizar usuario asignado
            const updatedData = {
                usuarioAsignado: {
                    id: usuario.id,
                    nombre: usuario.nombre,
                    area: usuario.area || '',
                    email: usuario.email
                },
                modificadoPor: window.dashboard.auth.getUserData().uid,
                fechaModificacion: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Actualizar historial (máximo 5)
            let historial = desktop.historial || [];

            // Cerrar asignación anterior
            if (historial.length > 0 && historial[0].fechaRetiro === null) {
                historial[0].fechaRetiro = firebase.firestore.FieldValue.serverTimestamp();
            }

            // Agregar nueva asignación al inicio
            historial.unshift({
                id: this.generateId(),
                usuarioId: usuario.id,
                usuarioNombre: usuario.nombre,
                usuarioArea: usuario.area || '',
                fechaAsignacion: firebase.firestore.FieldValue.serverTimestamp(),
                fechaRetiro: null
            });

            // Mantener solo los últimos 5
            if (historial.length > 5) {
                historial = historial.slice(0, 5);
            }

            updatedData.historial = historial;

            await this.fb.update('inventarios_desktops', this.currentDesktopForAssign, updatedData);
            this.showToast('Usuario asignado correctamente', 'success');
            this.closeAssignModal();
        } catch (error) {
            console.error('Error al asignar usuario:', error);
            this.showError('Error al asignar usuario');

            const btn = document.getElementById('confirmAssignBtn');
            btn.disabled = false;
            btn.textContent = 'Asignar Usuario';
        }
    }

    // ===== VER DETALLES =====

    viewDetails(id) {
        const desktop = this.desktops.find(l => l.id === id);
        if (!desktop) return;

        this.currentDesktopForAssign = id;

        const modal = document.getElementById('detailModal');
        const title = document.getElementById('detailModalTitle');
        const body = document.getElementById('detailModalBody');

        title.textContent = `Detalles Completos - ${desktop.st}`;

        const historialHTML = (desktop.historial && desktop.historial.length > 0)
            ? desktop.historial.map((h, index) => {
                // Soporte para campos nuevos (empleado) y antiguos (usuario)
                const nombre = h.empleadoNombre || h.usuarioNombre || 'undefined';
                const area = h.empleadoArea || h.usuarioArea || 'Sin área';
                return `
                    <div class="historial-item">
                        <div class="historial-number">${index + 1}</div>
                        <div class="historial-details">
                            <strong>${nombre}</strong> - ${area}
                            <br>
                            <small>
                                ${h.fechaAsignacion ? (h.fechaAsignacion.toDate ? new Date(h.fechaAsignacion.toDate()).toLocaleDateString() : new Date(h.fechaAsignacion).toLocaleDateString()) : 'Fecha no disponible'}
                                ${h.fechaRetiro
                                    ? ` - ${h.fechaRetiro.toDate ? new Date(h.fechaRetiro.toDate()).toLocaleDateString() : new Date(h.fechaRetiro).toLocaleDateString()}`
                                    : ' - Presente'
                                }
                            </small>
                        </div>
                    </div>
                `;
            }).join('')
            : '<p class="text-muted">No hay historial de asignaciones</p>';

        body.innerHTML = `
            <div class="detail-section">
                <h3 class="detail-section-title">Información del Equipo</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">ST:</span>
                        <span class="detail-value">${desktop.st}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Marca:</span>
                        <span class="detail-value">${this.getMarcaLabel(desktop.marca)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Modelo:</span>
                        <span class="detail-value">${desktop.modelo}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Fecha Adquisición:</span>
                        <span class="detail-value">${desktop.fechaAdquisicion}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Sistema Operativo:</span>
                        <span class="detail-value">${this.getSistemaLabel(desktop.sistema)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Procesador:</span>
                        <span class="detail-value">${this.getProcesadorLabel(desktop.procesador)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">RAM:</span>
                        <span class="detail-value">${desktop.ram} GB</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Disco:</span>
                        <span class="detail-value">${desktop.capacidadDisco} GB ${desktop.tipoDisco.toUpperCase()}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Propiedad:</span>
                        <span class="detail-value">${this.getPropiedadLabel(desktop.propiedad)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Estado:</span>
                        <span class="detail-value">
                            <span class="status-badge ${desktop.activo ? 'activo' : 'inactivo'}">
                                ${desktop.activo ? 'Activo' : 'Inactivo'}
                            </span>
                        </span>
                    </div>
                    ${!desktop.activo ? `
                        <div class="detail-item">
                            <span class="detail-label">Motivo Inactivo:</span>
                            <span class="detail-value">${desktop.categoriaInactivo === 'otro' ? desktop.motivoInactivo : this.getCategoriaInactivoLabel(desktop.categoriaInactivo)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="detail-section">
                <h3 class="detail-section-title">Usuario Asignado</h3>
                ${(desktop.empleadoAsignado || desktop.usuarioAsignado) ? `
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Nombre:</span>
                            <span class="detail-value">${(desktop.empleadoAsignado || desktop.usuarioAsignado).nombre}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Área:</span>
                            <span class="detail-value">${(desktop.empleadoAsignado || desktop.usuarioAsignado).area || 'Sin área'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Email:</span>
                            <span class="detail-value">${(desktop.empleadoAsignado || desktop.usuarioAsignado).email || 'N/A'}</span>
                        </div>
                    </div>
                    <button class="btn btn-secondary mt-2" onclick="window.inventarioDesktopController.showAssignUserModal('${desktop.id}')">
                        Cambiar Usuario
                    </button>
                ` : '<p class="text-muted">Sin usuario asignado</p>'}
            </div>

            <div class="detail-section">
                <h3 class="detail-section-title">Historial de Asignaciones (Últimas 5)</h3>
                <div class="historial-list">
                    ${historialHTML}
                </div>
            </div>
        `;

        modal.classList.add('show');
    }

    closeDetailModal() {
        const modal = document.getElementById('detailModal');
        modal.classList.remove('show');
        this.currentDesktopForAssign = null;
    }

    // ===== EXPORTAR =====

    exportData() {
        if (this.filteredDesktops.length === 0) {
            this.showError('No hay datos para exportar');
            return;
        }

        const data = this.filteredDesktops.map(desktop => ({
            'ST': desktop.st,
            'ST Cargador': desktop.stCargador || '',
            'Marca': this.getMarcaLabel(desktop.marca),
            'Modelo': desktop.modelo,
            'Fecha Adquisición': desktop.fechaAdquisicion,
            'Sistema': this.getSistemaLabel(desktop.sistema),
            'Procesador': this.getProcesadorLabel(desktop.procesador),
            'RAM (GB)': desktop.ram,
            'Disco (GB)': desktop.capacidadDisco,
            'Tipo Disco': desktop.tipoDisco.toUpperCase(),
            'Propiedad': this.getPropiedadLabel(desktop.propiedad),
            'Usuario Asignado': desktop.usuarioAsignado ? desktop.usuarioAsignado.nombre : 'Sin asignar',
            'Área Usuario': desktop.usuarioAsignado ? desktop.usuarioAsignado.area : '',
            'Estado': desktop.activo ? 'Activo' : 'Inactivo',
            'Motivo Inactivo': !desktop.activo && desktop.categoriaInactivo === 'otro' ? desktop.motivoInactivo : ''
        }));

        const today = new Date().toISOString().split('T')[0];
        Utils.exportToCSV(data, `Inventario_Desktops_${today}.csv`);
        this.showToast('Inventario exportado exitosamente', 'success');
    }

    downloadSingleExcel() {
        if (!this.currentDesktopForAssign) return;

        const desktop = this.desktops.find(l => l.id === this.currentDesktopForAssign);
        if (!desktop) return;

        const data = [{
            'ST': desktop.st,
            'ST Cargador': desktop.stCargador || '',
            'Marca': this.getMarcaLabel(desktop.marca),
            'Modelo': desktop.modelo,
            'Fecha Adquisición': desktop.fechaAdquisicion,
            'Sistema': this.getSistemaLabel(desktop.sistema),
            'Procesador': this.getProcesadorLabel(desktop.procesador),
            'RAM (GB)': desktop.ram,
            'Disco (GB)': desktop.capacidadDisco,
            'Tipo Disco': desktop.tipoDisco.toUpperCase(),
            'Propiedad': this.getPropiedadLabel(desktop.propiedad),
            'Usuario Asignado': desktop.usuarioAsignado ? desktop.usuarioAsignado.nombre : 'Sin asignar',
            'Estado': desktop.activo ? 'Activo' : 'Inactivo'
        }];

        Utils.exportToCSV(data, `Desktop_${desktop.st}.csv`);
        this.showToast('Datos exportados exitosamente', 'success');
    }

    // ===== HELPERS =====

    getMarcaLabel(value) {
        const labels = {
            'dell': 'Dell',
            'hp': 'HP',
            'lenovo': 'Lenovo',
            'asus': 'Asus',
            'apple': 'Apple',
            'otra': 'Otra'
        };
        return labels[value] || value;
    }

    getSistemaLabel(value) {
        const labels = {
            'windows11': 'Windows 11',
            'windows10': 'Windows 10',
            'sequoia': 'macOS Sequoia',
            'sonoma': 'macOS Sonoma',
            'ventura': 'macOS Ventura',
            'highsierra': 'macOS High Sierra'
        };
        return labels[value] || value;
    }

    getProcesadorLabel(value) {
        const labels = {
            'i3': 'Intel Core i3',
            'i5': 'Intel Core i5',
            'i7': 'Intel Core i7'
        };
        return labels[value] || value;
    }

    getPropiedadLabel(value) {
        const labels = {
            'arrendamiento': 'Arrendamiento',
            'usuario': 'Usuario',
            'renta': 'Renta',
            'propiedadtyc': 'Propiedad T&C'
        };
        return labels[value] || value;
    }

    getCategoriaInactivoLabel(value) {
        const labels = {
            'falla': 'Falla',
            'robo': 'Robo',
            'otro': 'Otro'
        };
        return labels[value] || value;
    }

    generateId() {
        return 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    showLoading(show) {
        console.log(`⏳ ${show ? 'Mostrando' : 'Ocultando'} loading...`);
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            if (show) {
                overlay.classList.add('active');
                console.log(`✅ Loading overlay visible - clases:`, overlay.className);
            } else {
                overlay.classList.remove('active');
                console.log(`✅ Loading overlay oculto - clases:`, overlay.className);
            }
        } else {
            console.error('❌ No se encontró loadingOverlay');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            background: ${type === 'success' ? 'linear-gradient(135deg, #00ff88, #00cc6a)' : type === 'error' ? 'linear-gradient(135deg, #ff4757, #ff2e5c)' : 'linear-gradient(135deg, #00d4ff, #0066cc)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 400px;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showError(message) {
        this.showToast(message, 'error');
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    window.inventarioDesktopController = new InventarioDesktopController();
});

console.log('💻 Inventario Desktop Module Loaded');
