// ============================================
// USUARIOS.JS - TyC Group Dashboard
// Gestión de Empleados de la Empresa
// ============================================

class EmpleadosController {
    constructor() {
        this.fb = getFirebaseHelper();
        this.validator = null;
        this.empleados = [];
        this.areas = [];
        this.filteredEmpleados = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.editingId = null;
        this.importData = []; // ⭐ NUEVO
        this.init();
    }

    async init() {
        console.log('🚀 Iniciando Gestión de Empleados...');
        
        try {
            await this.waitForAuth();
            
            if (!this.checkPermissions()) {
                this.showError('No tienes permisos para acceder a esta sección');
                setTimeout(() => window.location.href = 'dashboard.html', 2000);
                return;
            }

            this.initValidator();
            this.setupEventListeners();
            await this.cargarAreas();
            await this.cargarEmpleados();
            
            console.log('✅ Gestión de Empleados inicializada correctamente');
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
    // VALIDACIÓN
    // ==========================================

    initValidator() {
        this.validator = new FormValidator('userForm');
        
        this.validator.setRules({
            nombre: {
                required: true,
                minLength: 2,
                maxLength: 50,
                alpha: true,
                message: {
                    required: 'El nombre es obligatorio',
                    minLength: 'Mínimo 2 caracteres',
                    maxLength: 'Máximo 50 caracteres',
                    alpha: 'Solo letras y espacios'
                }
            },
            apellido: {
                required: true,
                minLength: 2,
                maxLength: 50,
                alpha: true,
                message: {
                    required: 'El apellido es obligatorio',
                    minLength: 'Mínimo 2 caracteres',
                    maxLength: 'Máximo 50 caracteres',
                    alpha: 'Solo letras y espacios'
                }
            },
            area: {
                required: true,
                message: {
                    required: 'Debes seleccionar un área'
                }
            },
            puesto: {
                required: true,
                minLength: 3,
                maxLength: 100,
                message: {
                    required: 'El puesto es obligatorio',
                    minLength: 'Mínimo 3 caracteres',
                    maxLength: 'Máximo 100 caracteres'
                }
            },
            correoUsuario: {
                required: true,
                minLength: 3,
                alphanumeric: true,
                message: {
                    required: 'El nombre de usuario es obligatorio',
                    minLength: 'Mínimo 3 caracteres',
                    alphanumeric: 'Solo letras, números y puntos'
                }
            }
        });
    }

    // ==========================================
    // CARGAR DATOS
    // ==========================================

    async cargarAreas() {
        try {
            console.log('📂 Cargando áreas...');
            this.showLoading(true);

            const areasSnapshot = await this.fb.readAll('areas', {
                where: [['estado', '==', 'activo']],
                orderBy: ['nombre', 'asc']
            });

            this.areas = areasSnapshot;
            console.log(`✅ ${this.areas.length} áreas cargadas`);

            this.renderAreasSelect();
        } catch (error) {
            console.error('❌ Error al cargar áreas:', error);
            this.showError('Error al cargar las áreas');
        } finally {
            this.showLoading(false);
        }
    }

    renderAreasSelect() {
        const select = document.getElementById('area');
        select.innerHTML = '<option value="">Selecciona un área</option>';

        this.areas.forEach(area => {
            const option = document.createElement('option');
            const nombreArea = (area.nombre || 'Sin nombre').toUpperCase();
            option.value = nombreArea;
            option.textContent = nombreArea;
            select.appendChild(option);
        });
    }

    async cargarEmpleados() {
        try {
            console.log('👥 Cargando empleados...');
            this.showLoading(true);

            this.empleados = await this.fb.readAll('empleados', {
                orderBy: ['nombre', 'asc']
            });

            console.log(`✅ ${this.empleados.length} empleados cargados`);
            
            this.applyFilters();
        } catch (error) {
            console.error('❌ Error al cargar empleados:', error);
            this.showError('Error al cargar los empleados');
        } finally {
            this.showLoading(false);
        }
    }

    // ==========================================
    // FILTROS Y BÚSQUEDA
    // ==========================================

    applyFilters() {
        let filtered = [...this.empleados];

        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(emp => (emp.estado || 'inactivo') === this.currentFilter);
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

        this.filteredEmpleados = filtered;
        this.render();
    }

    // ==========================================
    // RENDERIZADO
    // ==========================================

    render() {
        const container = document.getElementById('tableContainer');

        if (this.filteredEmpleados.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; background: var(--card-bg); border-radius: 16px; border: 1px solid rgba(0, 212, 255, 0.15);">
                    <div style="margin: 0 auto 1.5rem; width: 80px; height: 80px; background: rgba(0, 212, 255, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--primary-color);">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                    </div>
                    <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--text-primary);">
                        ${this.searchQuery || this.currentFilter !== 'all' ? 'No se encontraron empleados' : 'No hay empleados registrados'}
                    </h3>
                    <p style="opacity: 0.7; margin-bottom: 1.5rem; color: var(--text-secondary);">
                        ${this.searchQuery || this.currentFilter !== 'all' ? 'Intenta cambiar los filtros de búsqueda' : 'Comienza agregando el primer empleado de la empresa'}
                    </p>
                    <button class="btn btn-primary" onclick="window.empleadosController.showAddModal()" style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #00d4ff, #0099cc); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 0.5rem;">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Agregar Empleado
                    </button>
                </div>
            `;
            return;
        }

        let tableHTML = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Apellido</th>
                            <th>Área</th>
                            <th>Puesto</th>
                            <th>Correo</th>
                            <th>Estado</th>
                            <th class="actions-column">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        this.filteredEmpleados.forEach((emp, index) => {
            tableHTML += `
                <tr>
                    <td>${emp.nombre || 'N/A'}</td>
                    <td>${emp.apellido || 'N/A'}</td>
                    <td>${emp.area || 'N/A'}</td>
                    <td>${emp.puesto || 'N/A'}</td>
                    <td>${emp.correo || 'N/A'}</td>
                    <td>
                        <span class="status-badge ${emp.estado || 'inactivo'}">
                            ${(emp.estado || 'inactivo').toUpperCase()}
                        </span>
                    </td>
                    <td class="actions-cell">
                        <button class="action-btn" onclick="window.empleadosController.edit(${index})" title="Editar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="action-btn danger" onclick="window.empleadosController.delete(${index})" title="Eliminar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
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

    showAddModal() {
        this.editingId = null;
        document.getElementById('modalTitle').textContent = 'Agregar Empleado';
        this.resetForm();
        this.showModal();
    }

    showEditModal(index) {
        const emp = this.filteredEmpleados[index];
        this.editingId = emp.id;
        
        document.getElementById('modalTitle').textContent = 'Editar Empleado';
        
        document.getElementById('nombre').value = emp.nombre || '';
        document.getElementById('apellido').value = emp.apellido || '';
        document.getElementById('area').value = emp.area || '';
        document.getElementById('puesto').value = emp.puesto || '';
        
        const username = emp.correo ? emp.correo.split('@')[0] : '';
        document.getElementById('correoUsuario').value = username;
        
        const estadoCheckbox = document.getElementById('estado');
        estadoCheckbox.checked = emp.estado === 'activo';
        document.querySelector('.toggle-text').textContent = emp.estado === 'activo' ? 'Activo' : 'Inactivo';
        
        this.showModal();
    }

    showModal() {
        const modal = document.getElementById('userModal');
        modal.classList.add('show');
        if (window.dashboard) {
            window.dashboard.sounds.playClick();
        }
    }

    hideModal() {
        const modal = document.getElementById('userModal');
        modal.classList.remove('show');
    }

    // ==========================================
    // CRUD OPERATIONS
    // ==========================================

    async save() {
        try {
            this.showLoading(true);
            
            const nombre = document.getElementById('nombre').value.trim();
            const apellido = document.getElementById('apellido').value.trim();
            const area = document.getElementById('area').value.trim();
            const puesto = document.getElementById('puesto').value.trim();
            const correoUsuario = document.getElementById('correoUsuario').value.trim();
            const estado = document.getElementById('estado').checked;
            
            // Validaciones
            if (!nombre || nombre.length < 2) {
                this.showError('El nombre debe tener al menos 2 caracteres');
                this.showLoading(false);
                return;
            }
            
            if (!apellido || apellido.length < 2) {
                this.showError('El apellido debe tener al menos 2 caracteres');
                this.showLoading(false);
                return;
            }
            
            if (!area) {
                this.showError('Debes seleccionar un área');
                this.showLoading(false);
                return;
            }
            
            if (!puesto || puesto.length < 3) {
                this.showError('El puesto debe tener al menos 3 caracteres');
                this.showLoading(false);
                return;
            }
            
            if (!correoUsuario || correoUsuario.length < 3) {
                this.showError('El correo debe tener al menos 3 caracteres');
                this.showLoading(false);
                return;
            }
            
            const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
            if (!soloLetras.test(nombre)) {
                this.showError('El nombre solo puede contener letras');
                this.showLoading(false);
                return;
            }
            
            if (!soloLetras.test(apellido)) {
                this.showError('El apellido solo puede contener letras');
                this.showLoading(false);
                return;
            }
            
            const correoValido = /^[a-z0-9.-]+$/;
            if (!correoValido.test(correoUsuario)) {
                this.showError('El correo solo puede contener letras, números, puntos y guiones');
                this.showLoading(false);
                return;
            }
            
            const correoCompleto = `${correoUsuario.toLowerCase()}@tycgroup.com`;
            
            const empleadoData = {
                nombre: nombre.toUpperCase(),
                apellido: apellido.toUpperCase(),
                area: area.toUpperCase(),
                puesto: puesto.toUpperCase(),
                correo: correoCompleto,
                estado: estado ? 'activo' : 'inactivo'
            };

            if (this.editingId) {
                empleadoData.updatedAt = this.fb.serverTimestamp();
                empleadoData.updatedBy = window.dashboard.auth.getUserData().uid;
                
                await this.fb.update('empleados', this.editingId, empleadoData);
                this.showSuccess('Empleado actualizado exitosamente');
            } else {
                empleadoData.createdAt = this.fb.serverTimestamp();
                empleadoData.createdBy = window.dashboard.auth.getUserData().uid;
                
                await this.fb.create('empleados', empleadoData);
                this.showSuccess('Empleado creado exitosamente');
            }

            this.hideModal();
            this.resetForm();
            await this.cargarEmpleados();
            
        } catch (error) {
            console.error('❌ Error al guardar empleado:', error);
            this.showError('Error al guardar: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    resetForm() {
        document.getElementById('nombre').value = '';
        document.getElementById('apellido').value = '';
        document.getElementById('area').value = '';
        document.getElementById('puesto').value = '';
        document.getElementById('correoUsuario').value = '';
        document.getElementById('estado').checked = true;
        document.querySelector('.toggle-text').textContent = 'Activo';
    }

    async delete(index) {
        const emp = this.filteredEmpleados[index];
        
        const confirmed = confirm(
            `¿Estás seguro de eliminar al empleado?\n\n` +
            `${emp.nombre} ${emp.apellido}\n` +
            `${emp.correo}\n\n` +
            `Esta acción no se puede deshacer.`
        );

        if (!confirmed) return;

        try {
            this.showLoading(true);
            await this.fb.delete('empleados', emp.id);
            this.showSuccess('Empleado eliminado exitosamente');
            await this.cargarEmpleados();
        } catch (error) {
            console.error('❌ Error al eliminar empleado:', error);
            this.showError('Error al eliminar el empleado');
        } finally {
            this.showLoading(false);
        }
    }

    edit(index) {
        this.showEditModal(index);
    }

    // ==========================================
    // EXPORTAR
    // ==========================================

    exportData() {
        if (this.filteredEmpleados.length === 0) {
            this.showError('No hay empleados para exportar');
            return;
        }

        try {
            const dataToExport = this.filteredEmpleados.map(emp => ({
                Nombre: emp.nombre || 'N/A',
                Apellido: emp.apellido || 'N/A',
                Área: emp.area || 'N/A',
                Puesto: emp.puesto || 'N/A',
                Correo: emp.correo || 'N/A',
                Estado: (emp.estado || 'inactivo').toUpperCase(),
                'Fecha Creación': emp.createdAt ? Utils.formatDate(Utils.timestampToDate(emp.createdAt)) : 'N/A'
            }));

            Utils.exportToCSV(
                dataToExport,
                `empleados_${Utils.formatDate(new Date(), 'short').replace(/\//g, '-')}.csv`
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
    // ⭐ IMPORTACIÓN MASIVA - NUEVO
    // ==========================================

    showImportModal() {
        document.getElementById('importModal').classList.add('show');
        if (window.dashboard) {
            window.dashboard.sounds.playClick();
        }
    }

    hideImportModal() {
        document.getElementById('importModal').classList.remove('show');
        this.resetImportModal();
    }

    resetImportModal() {
        document.getElementById('excelFileInput').value = '';
        document.getElementById('importPreview').style.display = 'none';
        document.getElementById('importProgress').style.display = 'none';
        document.getElementById('confirmImportBtn').style.display = 'none';
        document.getElementById('previewContent').innerHTML = '';
        this.importData = [];
    }

    async handleExcelFile(file) {
        if (!file) return;
        
        const validExtensions = ['.xlsx', '.xls'];
        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        
        if (!validExtensions.includes(fileExtension)) {
            this.showError('Por favor selecciona un archivo Excel válido (.xlsx o .xls)');
            return;
        }
        
        try {
            this.showLoading(true);
            
            const data = await this.readExcelFile(file);
            const processedData = this.processExcelData(data);
            this.showImportPreview(processedData);
            
            this.showLoading(false);
        } catch (error) {
            console.error('Error al leer Excel:', error);
            this.showError('Error al procesar el archivo Excel');
            this.showLoading(false);
        }
    }

        readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    
                    // ⭐ ACTUALIZADO: Columnas correctas A-F
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
                        header: ['estado', 'nombre', 'apellido', 'area', 'puesto', 'correo'],
                        range: 1 // Empezar desde fila 2
                    });
                    
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsArrayBuffer(file);
        });
    }

processExcelData(data) {
    const processed = [];
    
    data.forEach((row, index) => {
        const rowNumber = index + 2;
        const errors = [];
        
        // Validar campos obligatorios
        if (!row.nombre || String(row.nombre).trim() === '') {
            errors.push('Nombre vacío');
        }
        
        // ⭐ NUEVO: Validar apellido
        if (!row.apellido || String(row.apellido).trim() === '') {
            errors.push('Apellido vacío');
        }
        
        if (!row.area || String(row.area).trim() === '') {
            errors.push('Área vacía');
        }
        
        if (!row.puesto || String(row.puesto).trim() === '') {
            errors.push('Puesto vacío');
        }
        
        if (!row.correo || String(row.correo).trim() === '') {
            errors.push('Correo vacío');
        }
        
        // Procesar correo
        let correoFinal = String(row.correo || '').trim();
        
        // Si el correo ya tiene @tycgroup.com, usarlo tal cual
        if (correoFinal.includes('@')) {
            if (!correoFinal.endsWith('@tycgroup.com')) {
                errors.push('El correo debe ser @tycgroup.com');
            }
        } else {
            // Si solo tiene el usuario, agregar el dominio
            correoFinal = `${correoFinal}@tycgroup.com`;
        }
        
        // Procesar estado
        const estadoStr = String(row.estado || 'activo').toLowerCase().trim();
        const estado = (estadoStr === 'activo' || estadoStr === 'active' || estadoStr === '1') ? 'activo' : 'inactivo';
        
        processed.push({
            rowNumber,
            nombre: String(row.nombre || '').trim().toUpperCase(),
            apellido: String(row.apellido || '').trim().toUpperCase(), // ⭐ ACTUALIZADO
            area: String(row.area || '').trim().toUpperCase(),
            puesto: String(row.puesto || '').trim().toUpperCase(),
            correo: correoFinal.toLowerCase(),
            estado,
            errors,
            valid: errors.length === 0
        });
    });
    
    return processed;
}

showImportPreview(data) {
    this.importData = data;
    
    const validCount = data.filter(item => item.valid).length;
    const errorCount = data.filter(item => !item.valid).length;
    
    document.getElementById('importPreview').style.display = 'block';
    document.getElementById('validCount').textContent = `${validCount} válidos`;
    document.getElementById('errorCount').textContent = `${errorCount} errores`;
    
    const previewContent = document.getElementById('previewContent');
    previewContent.innerHTML = data.map(item => `
        <div class="preview-row ${item.valid ? 'valid' : 'error'}">
            <strong>Fila ${item.rowNumber}</strong>
            <span>${item.nombre}</span>
            <span>${item.apellido}</span>
            <span>${item.area}</span>
            <span>${item.puesto}</span>
            <span>${item.correo}</span>
            <span>${item.estado === 'activo' ? '✅' : '❌'}</span>
            ${!item.valid ? `<div style="grid-column: 1 / -1; color: var(--danger-color); font-size: 0.85rem;">❌ ${item.errors.join(', ')}</div>` : ''}
        </div>
    `).join('');
    
    if (validCount > 0) {
        const confirmBtn = document.getElementById('confirmImportBtn');
        confirmBtn.style.display = 'inline-flex';
        document.getElementById('importCount').textContent = validCount;
    }
}

    async importEmployees() {
        const validData = this.importData.filter(item => item.valid);
        
        if (validData.length === 0) {
            this.showError('No hay datos válidos para importar');
            return;
        }
        
        const confirmed = confirm(`¿Estás seguro de importar ${validData.length} empleados?`);
        if (!confirmed) return;
        
        try {
            document.getElementById('importPreview').style.display = 'none';
            document.getElementById('importProgress').style.display = 'block';
            
            let imported = 0;
            const total = validData.length;
            
            for (const item of validData) {
                try {
                    const empleadoData = {
                        nombre: item.nombre,
                        apellido: item.apellido,
                        area: item.area,
                        puesto: item.puesto,
                        correo: item.correo,
                        estado: item.estado,
                        createdAt: this.fb.serverTimestamp(),
                        createdBy: window.dashboard.auth.getUserData().uid
                    };
                    
                    await this.fb.create('empleados', empleadoData);
                    imported++;
                    
                    const progress = Math.round((imported / total) * 100);
                    document.getElementById('progressFill').style.width = `${progress}%`;
                    document.getElementById('progressText').textContent = `Importando... ${imported}/${total}`;
                    
                } catch (error) {
                    console.error(`Error al importar fila ${item.rowNumber}:`, error);
                }
            }
            
            this.showSuccess(`✅ Importados ${imported} de ${total} empleados`);
            this.hideImportModal();
            await this.cargarEmpleados();
            
        } catch (error) {
            console.error('Error en importación:', error);
            this.showError('Error durante la importación');
        }
    }

    // ==========================================
    // EVENT LISTENERS
    // ==========================================

    setupEventListeners() {
        // Botones principales
        document.getElementById('addUserBtn').addEventListener('click', () => {
            this.showAddModal();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        // ⭐ NUEVO - Botón importar
        document.getElementById('importBtn').addEventListener('click', () => {
            this.showImportModal();
        });

        // Modal usuario
        document.getElementById('closeModalBtn').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('saveBtn').addEventListener('click', () => {
            this.save();
        });

        document.getElementById('userModal').addEventListener('click', (e) => {
            if (e.target.id === 'userModal') {
                this.hideModal();
            }
        });

        // ⭐ NUEVO - Modal importación
        document.getElementById('closeImportModalBtn').addEventListener('click', () => {
            this.hideImportModal();
        });

        document.getElementById('cancelImportBtn').addEventListener('click', () => {
            this.hideImportModal();
        });

        document.getElementById('importModal').addEventListener('click', (e) => {
            if (e.target.id === 'importModal') {
                this.hideImportModal();
            }
        });

        // ⭐ NUEVO - Input archivo Excel
        const excelInput = document.getElementById('excelFileInput');
        excelInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                this.handleExcelFile(e.target.files[0]);
            }
        });

        // ⭐ NUEVO - Drag and drop
        const uploadArea = document.getElementById('fileUploadArea');
            uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                this.handleExcelFile(e.dataTransfer.files[0]);
            }
        });

        // ⭐ NUEVO - Confirmar importación
        document.getElementById('confirmImportBtn').addEventListener('click', () => {
            this.importEmployees();
        });

        // Tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (document.getElementById('userModal').classList.contains('show')) {
                    this.hideModal();
                }
                if (document.getElementById('importModal').classList.contains('show')) {
                    this.hideImportModal();
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

        // Toggle estado
        const estadoCheckbox = document.getElementById('estado');
        estadoCheckbox.addEventListener('change', (e) => {
            document.querySelector('.toggle-text').textContent = e.target.checked ? 'Activo' : 'Inactivo';
        });

        // Auto-uppercase en campos
        ['nombre', 'apellido', 'puesto'].forEach(fieldId => {
            const input = document.getElementById(fieldId);
            input.addEventListener('input', (e) => {
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                e.target.value = e.target.value.toUpperCase();
                e.target.setSelectionRange(start, end);
            });
        });

        // Área select
        const areaSelect = document.getElementById('area');
        areaSelect.addEventListener('change', (e) => {
            if (window.dashboard) {
                window.dashboard.sounds.playClick();
            }
        });

        // Correo - auto lowercase y limpieza
        const correoInput = document.getElementById('correoUsuario');
        correoInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toLowerCase();
            e.target.value = e.target.value.replace(/[^a-z0-9.-]/g, '');
        });

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
    window.empleadosController = new EmpleadosController();
});

console.log('📦 Módulo de Gestión de Empleados cargado correctamente');