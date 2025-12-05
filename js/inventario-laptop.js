// ====================================================
// INVENTARIO-LAPTOP.JS - TyC Group Dashboard
// Gestión de Inventario de Laptops
// ====================================================

class InventarioLaptopController {
    constructor() {
        this.fb = getFirebaseHelper();
        this.validator = null;
        this.laptops = [];
        this.filteredLaptops = [];
        this.usuarios = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.editingId = null;
        this.currentLaptopForAssign = null;
        this.unsubscribe = null;
        this.init();
    }

    async init() {
        console.log('🚀 Iniciando Inventario de Laptops...');

        try {
            // Esperar autenticación
            await this.waitForAuth();

            // Verificar permisos
            if (!this.checkPermissions()) {
                this.showError('No tienes permisos para gestionar inventario de laptops');
                setTimeout(() => window.location.href = 'dashboard.html', 2000);
                return;
            }

            // Setup
            this.initValidator();
            this.setupEventListeners();
            await this.loadUsuarios();
            await this.loadData();

            console.log('✅ Inventario de Laptops inicializado');
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
        this.validator = new FormValidator('laptopForm');
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
                const currentLaptop = this.laptops.find(l => l.id === this.editingId);
                if (currentLaptop && currentLaptop.st === st) {
                    return true;
                }
            }

            // Buscar en Firestore si ya existe
            const exists = await this.fb.existsWhere('inventarios_laptops', 'st', '==', st);
            return !exists; // Retorna true si NO existe (válido)
        } catch (error) {
            console.error('Error validando ST único:', error);
            return false;
        }
    }

    // ===== EVENT LISTENERS =====

    setupEventListeners() {
        // Botón agregar laptop
        document.getElementById('addLaptopBtn')?.addEventListener('click', () => {
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
            const laptopId = this.currentLaptopForAssign;
            this.closeDetailModal();
            this.edit(laptopId);
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
            const empleados = await this.fb.readAll('empleados', {
                where: [['activo', '==', true]]
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
            this.unsubscribe = this.fb.onSnapshot('inventarios_laptops', (docs) => {
                console.log('📦 Datos de laptops recibidos:', docs);
                this.laptops = docs;
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
        console.log('🔍 Filtrando datos. Total laptops:', this.laptops.length);

        this.filteredLaptops = this.laptops.filter(laptop => {
            const matchesSearch =
                laptop.st.toLowerCase().includes(this.searchQuery) ||
                laptop.marca.toLowerCase().includes(this.searchQuery) ||
                laptop.modelo.toLowerCase().includes(this.searchQuery) ||
                (laptop.usuarioAsignado && laptop.usuarioAsignado.nombre.toLowerCase().includes(this.searchQuery));

            const matchesFilter =
                this.currentFilter === 'all' ||
                (this.currentFilter === 'activo' && laptop.activo) ||
                (this.currentFilter === 'inactivo' && !laptop.activo);

            return matchesSearch && matchesFilter;
        });

        // Actualizar contador
        const count = this.filteredLaptops.length;
        console.log('📊 Laptops filtradas:', count);

        const itemCount = document.getElementById('itemCount');
        if (itemCount) {
            itemCount.textContent = `${count} laptop${count !== 1 ? 's' : ''}`;
        }

        this.renderTable();
    }

    // ===== RENDERIZAR TABLA =====

    renderTable() {
        console.log('🎨 Renderizando tabla. Laptops filtradas:', this.filteredLaptops.length);

        const container = document.getElementById('tableContainer');
        if (!container) {
            console.error('❌ No se encontró tableContainer');
            return;
        }

        if (this.filteredLaptops.length === 0) {
            console.log('📭 Mostrando estado vacío');
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                    </svg>
                    <h3>No hay laptops registradas</h3>
                    <p>Comienza agregando una nueva laptop al inventario</p>
                    <button class="btn btn-primary" onclick="window.inventarioLaptopController.showModal()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Agregar Primera Laptop
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
                        ${this.filteredLaptops.map(laptop => this.renderTableRow(laptop)).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tableHTML;
    }

    renderTableRow(laptop) {
        const marcaLabel = this.getMarcaLabel(laptop.marca);
        const sistemaLabel = this.getSistemaLabel(laptop.sistema);
        const propiedadLabel = this.getPropiedadLabel(laptop.propiedad);
        const usuarioNombre = laptop.usuarioAsignado ? laptop.usuarioAsignado.nombre : 'Sin asignar';

        return `
            <tr class="table-row">
                <td><strong>${laptop.st}</strong></td>
                <td>${marcaLabel}</td>
                <td>${laptop.modelo}</td>
                <td>${usuarioNombre}</td>
                <td>${sistemaLabel}</td>
                <td>${laptop.ram} GB</td>
                <td>${laptop.capacidadDisco} GB ${laptop.tipoDisco.toUpperCase()}</td>
                <td>${propiedadLabel}</td>
                <td>
                    <span class="status-badge ${laptop.activo ? 'activo' : 'inactivo'}">
                        ${laptop.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="window.inventarioLaptopController.viewDetails('${laptop.id}')" title="Ver detalles">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        </button>
                        <button class="btn-icon" onclick="window.inventarioLaptopController.edit('${laptop.id}')" title="Editar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="btn-icon" onclick="window.inventarioLaptopController.showAssignUserModal('${laptop.id}')" title="Asignar usuario">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                <circle cx="8.5" cy="7" r="4"/>
                                <line x1="20" y1="8" x2="20" y2="14"/>
                                <line x1="23" y1="11" x2="17" y2="11"/>
                            </svg>
                        </button>
                        <button class="btn-icon btn-danger" onclick="window.inventarioLaptopController.delete('${laptop.id}')" title="Eliminar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    // ===== MODAL OPERACIONES =====

    showModal(editId = null) {
        const modal = document.getElementById('laptopModal');
        const title = document.getElementById('modalTitle');
        const saveBtn = document.getElementById('saveBtn');

        this.editingId = editId;

        if (editId) {
            title.textContent = 'Editar Laptop';
            saveBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                </svg>
                Guardar Cambios
            `;

            const laptop = this.laptops.find(l => l.id === editId);
            if (laptop) {
                this.fillFormWithLaptop(laptop);
                // Deshabilitar campo ST en modo edición
                document.getElementById('st').disabled = true;
            }
        } else {
            title.textContent = 'Nueva Laptop';
            saveBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                </svg>
                Guardar Laptop
            `;
            this.validator.reset();
            document.getElementById('st').disabled = false;
            document.getElementById('inactiveFields').style.display = 'none';
            document.getElementById('activoToggle').checked = true;
            document.getElementById('toggleText').textContent = 'Activo';
        }

        modal.classList.add('show');
    }

    fillFormWithLaptop(laptop) {
        document.getElementById('st').value = laptop.st;
        document.getElementById('stCargador').value = laptop.stCargador || '';
        document.getElementById('marca').value = laptop.marca;
        document.getElementById('modelo').value = laptop.modelo;
        document.getElementById('fechaAdquisicion').value = laptop.fechaAdquisicion;
        document.getElementById('sistema').value = laptop.sistema;
        document.getElementById('procesador').value = laptop.procesador;
        document.getElementById('ram').value = laptop.ram;
        document.getElementById('capacidadDisco').value = laptop.capacidadDisco;
        document.getElementById('tipoDisco').value = laptop.tipoDisco;
        document.getElementById('propiedad').value = laptop.propiedad;

        // Soporte para campo antiguo (usuarioAsignado) y nuevo (empleadoAsignado)
        const asignado = laptop.empleadoAsignado || laptop.usuarioAsignado;
        if (asignado) {
            document.getElementById('empleadoAsignado').value = asignado.nombre;
            document.getElementById('empleadoAsignadoId').value = asignado.id;
        }

        document.getElementById('activoToggle').checked = laptop.activo;
        document.getElementById('toggleText').textContent = laptop.activo ? 'Activo' : 'Inactivo';
        document.getElementById('inactiveFields').style.display = laptop.activo ? 'none' : 'block';

        if (!laptop.activo) {
            document.getElementById('categoriaInactivo').value = laptop.categoriaInactivo || '';
            if (laptop.categoriaInactivo === 'otro') {
                document.getElementById('motivoOtroContainer').style.display = 'block';
                document.getElementById('motivoInactivo').value = laptop.motivoInactivo || '';
            }
        }
    }

    closeModal() {
        const modal = document.getElementById('laptopModal');
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

            const laptopData = {
                st: formData.st.toUpperCase(),
                stCargador: formData.stCargador ? formData.stCargador.toUpperCase() : null,
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
            if (empleadoId) {
                const empleado = this.usuarios.find(u => u.id === empleadoId);
                if (empleado) {
                    laptopData.empleadoAsignado = {
                        id: empleado.id,
                        nombre: empleado.nombre,
                        area: empleado.area || '',
                        email: empleado.email || ''
                    };
                } else {
                    laptopData.empleadoAsignado = null;
                }
            } else {
                laptopData.empleadoAsignado = null;
            }

            const userData = window.dashboard.auth.getUserData();

            if (this.editingId) {
                // Actualizar
                laptopData.modificadoPor = userData.uid;
                laptopData.fechaModificacion = firebase.firestore.FieldValue.serverTimestamp();

                await this.fb.update('inventarios_laptops', this.editingId, laptopData);
                this.showToast('Laptop actualizada correctamente', 'success');
            } else {
                // Crear nueva
                laptopData.creadoPor = userData.uid;
                laptopData.fechaCreacion = firebase.firestore.FieldValue.serverTimestamp();
                laptopData.modificadoPor = userData.uid;
                laptopData.fechaModificacion = firebase.firestore.FieldValue.serverTimestamp();
                laptopData.historial = [];

                // Si tiene usuario asignado, agregar al historial
                if (laptopData.usuarioAsignado) {
                    laptopData.historial = [{
                        id: this.generateId(),
                        usuarioId: laptopData.usuarioAsignado.id,
                        usuarioNombre: laptopData.usuarioAsignado.nombre,
                        usuarioArea: laptopData.usuarioAsignado.area,
                        fechaAsignacion: firebase.firestore.FieldValue.serverTimestamp(),
                        fechaRetiro: null
                    }];
                }

                await this.fb.create('inventarios_laptops', laptopData);
                this.showToast('Laptop agregada exitosamente', 'success');
            }

            this.closeModal();
        } catch (error) {
            console.error('Error al guardar laptop:', error);
            if (error.code === 'permission-denied') {
                this.showError('No tienes permisos para realizar esta acción');
            } else {
                this.showError('Error al guardar. Intenta nuevamente');
            }

            const saveBtn = document.getElementById('saveBtn');
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Guardar Laptop';
        }
    }

    // ===== EDITAR =====

    edit(id) {
        this.showModal(id);
    }

    // ===== ELIMINAR =====

    async delete(id) {
        const laptop = this.laptops.find(l => l.id === id);
        if (!laptop) return;

        const confirmed = confirm(`¿Estás seguro de eliminar la laptop ${laptop.st}?\n\nEsta acción no se puede deshacer.`);
        if (!confirmed) return;

        try {
            await this.fb.delete('inventarios_laptops', id);
            this.showToast('Laptop eliminada correctamente', 'success');
        } catch (error) {
            console.error('Error al eliminar laptop:', error);
            this.showError('Error al eliminar');
        }
    }

    // ===== ASIGNAR USUARIO =====

    showAssignUserModal(laptopId) {
        const laptop = this.laptops.find(l => l.id === laptopId);
        if (!laptop) return;

        this.currentLaptopForAssign = laptopId;

        document.getElementById('assignLaptopInfo').textContent = `${laptop.st} - ${laptop.marca} ${laptop.modelo}`;
        document.getElementById('assignCurrentUser').textContent = laptop.usuarioAsignado ? laptop.usuarioAsignado.nombre : 'Sin asignar';
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
        this.currentLaptopForAssign = null;
    }

    async confirmAssignUser() {
        const userId = document.getElementById('selectedUserId').value;
        if (!userId) {
            this.showError('Selecciona un usuario');
            return;
        }

        const laptop = this.laptops.find(l => l.id === this.currentLaptopForAssign);
        if (!laptop) return;

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
            let historial = laptop.historial || [];

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

            await this.fb.update('inventarios_laptops', this.currentLaptopForAssign, updatedData);
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
        const laptop = this.laptops.find(l => l.id === id);
        if (!laptop) return;

        this.currentLaptopForAssign = id;

        const modal = document.getElementById('detailModal');
        const title = document.getElementById('detailModalTitle');
        const body = document.getElementById('detailModalBody');

        title.textContent = `Detalles Completos - ${laptop.st}`;

        const historialHTML = (laptop.historial && laptop.historial.length > 0)
            ? laptop.historial.map((h, index) => `
                <div class="historial-item">
                    <div class="historial-number">${index + 1}</div>
                    <div class="historial-details">
                        <strong>${h.usuarioNombre}</strong> - ${h.usuarioArea || 'Sin área'}
                        <br>
                        <small>
                            ${h.fechaAsignacion ? new Date(h.fechaAsignacion.toDate()).toLocaleDateString() : 'Fecha no disponible'}
                            ${h.fechaRetiro
                                ? ` - ${new Date(h.fechaRetiro.toDate()).toLocaleDateString()}`
                                : ' - Presente'
                            }
                        </small>
                    </div>
                </div>
            `).join('')
            : '<p class="text-muted">No hay historial de asignaciones</p>';

        body.innerHTML = `
            <div class="detail-section">
                <h3 class="detail-section-title">Información del Equipo</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">ST:</span>
                        <span class="detail-value">${laptop.st}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">ST Cargador:</span>
                        <span class="detail-value">${laptop.stCargador || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Marca:</span>
                        <span class="detail-value">${this.getMarcaLabel(laptop.marca)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Modelo:</span>
                        <span class="detail-value">${laptop.modelo}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Fecha Adquisición:</span>
                        <span class="detail-value">${laptop.fechaAdquisicion}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Sistema Operativo:</span>
                        <span class="detail-value">${this.getSistemaLabel(laptop.sistema)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Procesador:</span>
                        <span class="detail-value">${this.getProcesadorLabel(laptop.procesador)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">RAM:</span>
                        <span class="detail-value">${laptop.ram} GB</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Disco:</span>
                        <span class="detail-value">${laptop.capacidadDisco} GB ${laptop.tipoDisco.toUpperCase()}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Propiedad:</span>
                        <span class="detail-value">${this.getPropiedadLabel(laptop.propiedad)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Estado:</span>
                        <span class="detail-value">
                            <span class="status-badge ${laptop.activo ? 'activo' : 'inactivo'}">
                                ${laptop.activo ? 'Activo' : 'Inactivo'}
                            </span>
                        </span>
                    </div>
                    ${!laptop.activo ? `
                        <div class="detail-item">
                            <span class="detail-label">Motivo Inactivo:</span>
                            <span class="detail-value">${laptop.categoriaInactivo === 'otro' ? laptop.motivoInactivo : this.getCategoriaInactivoLabel(laptop.categoriaInactivo)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="detail-section">
                <h3 class="detail-section-title">Usuario Asignado</h3>
                ${laptop.usuarioAsignado ? `
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Nombre:</span>
                            <span class="detail-value">${laptop.usuarioAsignado.nombre}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Área:</span>
                            <span class="detail-value">${laptop.usuarioAsignado.area || 'Sin área'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Email:</span>
                            <span class="detail-value">${laptop.usuarioAsignado.email}</span>
                        </div>
                    </div>
                    <button class="btn btn-secondary mt-2" onclick="window.inventarioLaptopController.showAssignUserModal('${laptop.id}')">
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
        this.currentLaptopForAssign = null;
    }

    // ===== EXPORTAR =====

    exportData() {
        if (this.filteredLaptops.length === 0) {
            this.showError('No hay datos para exportar');
            return;
        }

        const data = this.filteredLaptops.map(laptop => ({
            'ST': laptop.st,
            'ST Cargador': laptop.stCargador || '',
            'Marca': this.getMarcaLabel(laptop.marca),
            'Modelo': laptop.modelo,
            'Fecha Adquisición': laptop.fechaAdquisicion,
            'Sistema': this.getSistemaLabel(laptop.sistema),
            'Procesador': this.getProcesadorLabel(laptop.procesador),
            'RAM (GB)': laptop.ram,
            'Disco (GB)': laptop.capacidadDisco,
            'Tipo Disco': laptop.tipoDisco.toUpperCase(),
            'Propiedad': this.getPropiedadLabel(laptop.propiedad),
            'Usuario Asignado': laptop.usuarioAsignado ? laptop.usuarioAsignado.nombre : 'Sin asignar',
            'Área Usuario': laptop.usuarioAsignado ? laptop.usuarioAsignado.area : '',
            'Estado': laptop.activo ? 'Activo' : 'Inactivo',
            'Motivo Inactivo': !laptop.activo && laptop.categoriaInactivo === 'otro' ? laptop.motivoInactivo : ''
        }));

        const today = new Date().toISOString().split('T')[0];
        Utils.exportToCSV(data, `Inventario_Laptops_${today}.csv`);
        this.showToast('Inventario exportado exitosamente', 'success');
    }

    downloadSingleExcel() {
        if (!this.currentLaptopForAssign) return;

        const laptop = this.laptops.find(l => l.id === this.currentLaptopForAssign);
        if (!laptop) return;

        const data = [{
            'ST': laptop.st,
            'ST Cargador': laptop.stCargador || '',
            'Marca': this.getMarcaLabel(laptop.marca),
            'Modelo': laptop.modelo,
            'Fecha Adquisición': laptop.fechaAdquisicion,
            'Sistema': this.getSistemaLabel(laptop.sistema),
            'Procesador': this.getProcesadorLabel(laptop.procesador),
            'RAM (GB)': laptop.ram,
            'Disco (GB)': laptop.capacidadDisco,
            'Tipo Disco': laptop.tipoDisco.toUpperCase(),
            'Propiedad': this.getPropiedadLabel(laptop.propiedad),
            'Usuario Asignado': laptop.usuarioAsignado ? laptop.usuarioAsignado.nombre : 'Sin asignar',
            'Estado': laptop.activo ? 'Activo' : 'Inactivo'
        }];

        Utils.exportToCSV(data, `Laptop_${laptop.st}.csv`);
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
    window.inventarioLaptopController = new InventarioLaptopController();
});

console.log('💻 Inventario Laptop Module Loaded');
