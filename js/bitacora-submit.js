/* =========================================
   BITACORA-SUBMIT.JS
   Funciones de Submit y Lista
   ========================================= */

// Extender el controlador con métodos adicionales
BitacoraController.prototype.handleSubmit = async function() {
    try {
        // Validar tipo de servicio
        const tipoServicio = document.querySelector('input[name="tipoServicio"]:checked');
        if (!tipoServicio) {
            document.getElementById('tipoServicioError').textContent = 
                'DEBE SELECCIONAR UN TIPO DE SERVICIO';
            return;
        }

        // Validar categoría según tipo
        let categoriaData = {};
        if (tipoServicio.value === 'ERP') {
            const categoriaERP = document.getElementById('categoriaERP').value;
            if (!categoriaERP) {
                window.dashboard.showToast('DEBE SELECCIONAR UNA CATEGORÍA ERP', 'error');
                return;
            }
            const catData = window.BitacoraData.categoriasERP.find(c => c.id === categoriaERP);
            categoriaData = {
                categoria: catData.nombre,
                categoriaId: catData.id
            };
        } else {
            const categoriaPrincipal = document.getElementById('categoriaPrincipal').value;
            const subcategoria = document.getElementById('subcategoria').value;
            
            if (!categoriaPrincipal || !subcategoria) {
                window.dashboard.showToast('DEBE SELECCIONAR CATEGORÍA Y SUBCATEGORÍA', 'error');
                return;
            }

            const catPrincipal = window.BitacoraData.categoriasTecnico.find(c => c.id === categoriaPrincipal);
            const subcat = catPrincipal.subcategorias.find(s => s.id === subcategoria);
            
            categoriaData = {
                categoriaPrincipal: catPrincipal.nombre,
                categoriaPrincipalId: catPrincipal.id,
                subcategoria: subcat.nombre,
                subcategoriaId: subcat.id
            };
        }

        // Validar formulario base
        if (!this.validator.validate()) {
            window.dashboard.showToast('POR FAVOR COMPLETE TODOS LOS CAMPOS OBLIGATORIOS', 'error');
            return;
        }

        this.showLoading(true);

        // Obtener datos del formulario
        const formData = this.getFormData();
        
        // Agregar datos adicionales
        const registro = {
            ...formData,
            ...categoriaData,
            tipoServicio: tipoServicio.value,
            createdAt: this.fb.serverTimestamp(),
            createdBy: window.dashboard.auth.getUserData().uid,
            createdByName: window.dashboard.auth.getUserData().nombre || 'SISTEMA'
        };

        // Guardar en Firestore
        await this.fb.create('bitacora', registro);

        window.dashboard.showToast('✅ REGISTRO GUARDADO EXITOSAMENTE', 'success');
        
        // Esperar y volver al landing
        setTimeout(() => {
            this.resetForm();
            this.showView('landing');
        }, 1500);

    } catch (error) {
        console.error('❌ Error al guardar registro:', error);
        window.dashboard.showToast('ERROR AL GUARDAR REGISTRO', 'error');
    } finally {
        this.showLoading(false);
    }
};

BitacoraController.prototype.getFormData = function() {
    const formData = {};
    
    // Fecha de solicitud
    formData.fechaSolicitud = document.getElementById('fechaSolicitud').value;
    
    // Fecha de finalización (opcional)
    const fechaFin = document.getElementById('fechaFinalizacion').value;
    if (fechaFin) {
        formData.fechaFinalizacion = fechaFin;
    }
    
    // Área
    const areaId = document.getElementById('area').value;
    const area = this.areas.find(a => a.id === areaId);
    formData.area = area ? area.nombre.toUpperCase() : '';
    formData.areaId = areaId;
    
    // Colaborador
    const colaboradorId = document.getElementById('colaborador').value;
    const colaborador = this.empleados.find(e => e.id === colaboradorId);
    if (colaborador) {
        formData.colaborador = `${colaborador.nombre} ${colaborador.apellido}`.toUpperCase();
        formData.colaboradorId = colaboradorId;
    }
    
    // Solución
    formData.solucion = document.getElementById('solucion').value.toUpperCase();
    
    // Revisó
    const revisoId = document.getElementById('reviso').value;
    const reviso = this.empleadosTI.find(e => e.id === revisoId);
    if (reviso) {
        formData.reviso = `${reviso.nombre} ${reviso.apellido}`.toUpperCase();
        formData.revisoId = revisoId;
    }
    
    // Status
    formData.status = document.getElementById('status').value;
    
    return formData;
};

// ==================== VISTA DE LISTA ====================

BitacoraController.prototype.loadRegistros = async function() {
    try {
        this.showLoading(true);
        
        const snapshot = await this.fb.db
            .collection('bitacora')
            .orderBy('createdAt', 'desc')
            .get();
        
        this.registros = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convertir timestamp a fecha
            fechaSolicitud: this.formatFirestoreDate(doc.data().fechaSolicitud),
            createdAtDate: doc.data().createdAt?.toDate()
        }));
        
        this.filteredRegistros = [...this.registros];
        this.currentPage = 1;
        this.renderRegistros();
        
        console.log('✅ Registros cargados:', this.registros.length);
        
    } catch (error) {
        console.error('❌ Error al cargar registros:', error);
        window.dashboard.showToast('ERROR AL CARGAR REGISTROS', 'error');
    } finally {
        this.showLoading(false);
    }
};

BitacoraController.prototype.filterRegistros = function() {
    const searchTerm = document.getElementById('searchRegistros')?.value.toUpperCase() || '';
    const statusFilter = document.getElementById('filterStatus')?.value || '';
    const tipoServicioFilter = document.getElementById('filterTipoServicio')?.value || '';
    
    this.filteredRegistros = this.registros.filter(registro => {
        // Filtro de búsqueda
        const matchSearch = !searchTerm || 
            registro.area?.includes(searchTerm) ||
            registro.colaborador?.includes(searchTerm) ||
            registro.categoria?.includes(searchTerm) ||
            registro.categoriaPrincipal?.includes(searchTerm) ||
            registro.subcategoria?.includes(searchTerm);
        
        // Filtro de status
        const matchStatus = !statusFilter || registro.status === statusFilter;
        
        // Filtro de tipo de servicio
        const matchTipo = !tipoServicioFilter || registro.tipoServicio === tipoServicioFilter;
        
        return matchSearch && matchStatus && matchTipo;
    });
    
    this.currentPage = 1;
    this.renderRegistros();
};

BitacoraController.prototype.renderRegistros = function() {
    const tbody = document.getElementById('registrosTableBody');
    if (!tbody) return;
    
    // Si no hay registros
    if (this.filteredRegistros.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    <h3>NO HAY REGISTROS</h3>
                    <p>No se encontraron registros con los filtros aplicados</p>
                </td>
            </tr>
        `;
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    // Paginación
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    const pageRegistros = this.filteredRegistros.slice(start, end);
    
    // Renderizar filas
    tbody.innerHTML = pageRegistros.map(registro => `
        <tr>
            <td>${this.formatDate(registro.fechaSolicitud)}</td>
            <td>${registro.area || 'N/A'}</td>
            <td>${registro.colaborador || 'N/A'}</td>
            <td>
                <span class="service-badge ${registro.tipoServicio?.toLowerCase()}">
                    ${registro.tipoServicio === 'ERP' ? 'SOPORTE ERP' : 'SOPORTE TÉCNICO'}
                </span>
            </td>
            <td>
                ${this.getCategoriaDisplay(registro)}
            </td>
            <td>
                <span class="status-badge ${registro.status?.toLowerCase()}">
                    ${registro.status || 'N/A'}
                </span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon" onclick="bitacoraController.viewDetalle('${registro.id}')" title="VER DETALLE">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                    <button class="btn-icon" onclick="bitacoraController.editRegistro('${registro.id}')" title="EDITAR">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-icon" onclick="bitacoraController.deleteRegistro('${registro.id}')" title="ELIMINAR">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Renderizar paginación
    this.renderPagination();
};

BitacoraController.prototype.getCategoriaDisplay = function(registro) {
    if (registro.tipoServicio === 'ERP') {
        return registro.categoria || 'N/A';
    } else {
        const principal = registro.categoriaPrincipal || 'N/A';
        const sub = registro.subcategoria || '';
        return sub ? `${principal}<br><small style="color: var(--text-secondary);">${sub}</small>` : principal;
    }
};

BitacoraController.prototype.renderPagination = function() {
    const paginationDiv = document.getElementById('pagination');
    if (!paginationDiv) return;
    
    const totalPages = Math.ceil(this.filteredRegistros.length / this.itemsPerPage);
    
    if (totalPages <= 1) {
        paginationDiv.innerHTML = '';
        return;
    }
    
    let html = `
        <button ${this.currentPage === 1 ? 'disabled' : ''} 
                onclick="bitacoraController.goToPage(${this.currentPage - 1})">
            ANTERIOR
        </button>
    `;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
            html += `
                <button class="${i === this.currentPage ? 'active' : ''}"
                        onclick="bitacoraController.goToPage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
            html += '<span>...</span>';
        }
    }
    
    html += `
        <button ${this.currentPage === totalPages ? 'disabled' : ''}
                onclick="bitacoraController.goToPage(${this.currentPage + 1})">
            SIGUIENTE
        </button>
    `;
    
    paginationDiv.innerHTML = html;
};

BitacoraController.prototype.goToPage = function(page) {
    this.currentPage = page;
    this.renderRegistros();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ==================== ACCIONES DE REGISTROS ====================

BitacoraController.prototype.viewDetalle = function(id) {
    const registro = this.registros.find(r => r.id === id);
    if (!registro) return;

    const html = `
        <div class="detalle-container">
            <!-- Información General -->
            <div class="detalle-section">
                <h3 class="detalle-section-title">INFORMACIÓN GENERAL</h3>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <span class="detalle-label">FECHA SOLICITUD:</span>
                        <span class="detalle-value">${this.formatDate(registro.fechaSolicitud)}</span>
                    </div>

                    ${registro.fechaFinalizacion ? `
                        <div class="detalle-item">
                            <span class="detalle-label">FECHA FINALIZACIÓN:</span>
                            <span class="detalle-value">${this.formatDate(registro.fechaFinalizacion)}</span>
                        </div>
                    ` : ''}

                    <div class="detalle-item">
                        <span class="detalle-label">ÁREA:</span>
                        <span class="detalle-value">${registro.area}</span>
                    </div>

                    <div class="detalle-item">
                        <span class="detalle-label">COLABORADOR:</span>
                        <span class="detalle-value">${registro.colaborador}</span>
                    </div>
                </div>
            </div>

            <!-- Tipo de Servicio y Categoría -->
            <div class="detalle-section">
                <h3 class="detalle-section-title">SERVICIO Y CATEGORÍA</h3>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <span class="detalle-label">TIPO SERVICIO:</span>
                        <span class="service-badge ${registro.tipoServicio?.toLowerCase()}">${registro.tipoServicio === 'ERP' ? 'SOPORTE ERP' : 'SOPORTE TÉCNICO'}</span>
                    </div>

                    <div class="detalle-item">
                        <span class="detalle-label">CATEGORÍA:</span>
                        <span class="detalle-value">${this.getCategoriaDetailDisplay(registro)}</span>
                    </div>
                </div>
            </div>

            <!-- Solución (Con énfasis) -->
            <div class="detalle-section detalle-section-highlight">
                <div class="detalle-highlight-header">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <h3 class="detalle-section-title">SOLUCIÓN IMPLEMENTADA</h3>
                </div>
                <div class="detalle-solucion">
                    ${registro.solucion}
                </div>
            </div>

            <!-- Estado y Revisión -->
            <div class="detalle-section">
                <h3 class="detalle-section-title">ESTADO Y REVISIÓN</h3>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <span class="detalle-label">REVISÓ:</span>
                        <span class="detalle-value">${registro.reviso}</span>
                    </div>

                    <div class="detalle-item">
                        <span class="detalle-label">STATUS:</span>
                        <span class="status-badge ${registro.status?.toLowerCase()}">${registro.status}</span>
                    </div>
                </div>
            </div>

            <!-- Metadatos -->
            <div class="detalle-section detalle-metadata">
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <span class="detalle-label">CREADO POR:</span>
                        <span class="detalle-value">${registro.createdByName || 'SISTEMA'}</span>
                    </div>

                    <div class="detalle-item">
                        <span class="detalle-label">FECHA CREACIÓN:</span>
                        <span class="detalle-value">${registro.createdAtDate ? this.formatDateTime(registro.createdAtDate) : 'N/A'}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Mostrar modal
    const modal = document.getElementById('detalleModal');
    const modalBody = document.getElementById('detalleModalBody');

    if (modal && modalBody) {
        modalBody.innerHTML = html;
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    }
};

BitacoraController.prototype.closeDetalleModal = function() {
    const modal = document.getElementById('detalleModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = ''; // Restaurar scroll del body
    }
};

BitacoraController.prototype.getCategoriaDetailDisplay = function(registro) {
    if (registro.tipoServicio === 'ERP') {
        return registro.categoria || 'N/A';
    } else {
        return `${registro.categoriaPrincipal} → ${registro.subcategoria}`;
    }
};

BitacoraController.prototype.editRegistro = function(id) {
    const registro = this.registros.find(r => r.id === id);
    if (!registro) return;

    // Guardar el ID del registro que se está editando
    this.currentEditId = id;

    // Poblar selects del modal de edición
    this.populateEditSelects();

    // Llenar campos del formulario
    document.getElementById('editFechaSolicitud').value = registro.fechaSolicitud;
    document.getElementById('editFechaFinalizacion').value = registro.fechaFinalizacion || '';
    document.getElementById('editSolucion').value = registro.solucion;
    document.getElementById('editStatus').value = registro.status;

    // Seleccionar área
    document.getElementById('editArea').value = registro.areaId;
    this.populateEditColaboradores(registro.areaId);

    // Esperar un momento para que se carguen los colaboradores
    setTimeout(() => {
        document.getElementById('editColaborador').value = registro.colaboradorId;
    }, 100);

    // Seleccionar tipo de servicio
    if (registro.tipoServicio === 'ERP') {
        document.getElementById('editServicioERP').checked = true;
        this.showEditCategoriaSection('ERP');

        setTimeout(() => {
            document.getElementById('editCategoriaERP').value = registro.categoriaId;
        }, 100);
    } else {
        document.getElementById('editServicioTecnico').checked = true;
        this.showEditCategoriaSection('TECNICO');

        setTimeout(() => {
            document.getElementById('editCategoriaPrincipal').value = registro.categoriaPrincipalId;
            this.populateEditSubcategorias(registro.categoriaPrincipalId);

            setTimeout(() => {
                document.getElementById('editSubcategoria').value = registro.subcategoriaId;
            }, 100);
        }, 100);
    }

    // Seleccionar quien revisó
    setTimeout(() => {
        document.getElementById('editReviso').value = registro.revisoId;
    }, 100);

    // Mostrar modal
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
};

BitacoraController.prototype.populateEditSelects = function() {
    // Poblar áreas
    const selectArea = document.getElementById('editArea');
    selectArea.innerHTML = '<option value="">SELECCIONE UN ÁREA</option>';
    this.areas.forEach(area => {
        const option = document.createElement('option');
        option.value = area.id;
        option.textContent = area.nombre.toUpperCase();
        selectArea.appendChild(option);
    });

    // Poblar revisó
    const selectReviso = document.getElementById('editReviso');
    selectReviso.innerHTML = '<option value="">SELECCIONE QUIEN REVISÓ</option>';
    this.empleadosTI.forEach(empleado => {
        const option = document.createElement('option');
        option.value = empleado.id;
        option.textContent = `${empleado.nombre} ${empleado.apellido}`.toUpperCase();
        selectReviso.appendChild(option);
    });

    // Poblar categorías ERP
    const selectCategoriaERP = document.getElementById('editCategoriaERP');
    selectCategoriaERP.innerHTML = '<option value="">SELECCIONE UNA CATEGORÍA</option>';
    window.BitacoraData.categoriasERP.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.id;
        option.textContent = categoria.nombre;
        selectCategoriaERP.appendChild(option);
    });

    // Poblar categorías técnico
    const selectCategoriaPrincipal = document.getElementById('editCategoriaPrincipal');
    selectCategoriaPrincipal.innerHTML = '<option value="">SELECCIONE UNA CATEGORÍA</option>';
    window.BitacoraData.categoriasTecnico.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.id;
        option.textContent = categoria.nombre;
        selectCategoriaPrincipal.appendChild(option);
    });
};

BitacoraController.prototype.populateEditColaboradores = function(areaId) {
    const selectColaborador = document.getElementById('editColaborador');
    selectColaborador.innerHTML = '<option value="">SELECCIONE UN COLABORADOR</option>';

    if (!areaId) return;

    const area = this.areas.find(a => a.id === areaId);
    if (!area) return;

    const empleadosArea = this.empleados.filter(emp =>
        emp.area === area.nombre || emp.area === area.nombre.toUpperCase()
    );

    empleadosArea.forEach(empleado => {
        const option = document.createElement('option');
        option.value = empleado.id;
        option.textContent = `${empleado.nombre} ${empleado.apellido}`.toUpperCase();
        selectColaborador.appendChild(option);
    });
};

BitacoraController.prototype.populateEditSubcategorias = function(categoriaPrincipalId) {
    const selectSubcategoria = document.getElementById('editSubcategoria');
    selectSubcategoria.innerHTML = '<option value="">SELECCIONE UNA SUBCATEGORÍA</option>';

    if (!categoriaPrincipalId) return;

    const subcategorias = window.BitacoraData.getSubcategorias(categoriaPrincipalId);
    subcategorias.forEach(subcategoria => {
        const option = document.createElement('option');
        option.value = subcategoria.id;
        option.textContent = subcategoria.nombre;
        selectSubcategoria.appendChild(option);
    });
};

BitacoraController.prototype.showEditCategoriaSection = function(tipo) {
    const categoriasERP = document.getElementById('editCategoriasERP');
    const categoriasTecnico = document.getElementById('editCategoriasTecnico');

    if (tipo === 'ERP') {
        categoriasERP?.classList.remove('hidden');
        categoriasTecnico?.classList.add('hidden');
    } else {
        categoriasERP?.classList.add('hidden');
        categoriasTecnico?.classList.remove('hidden');
    }
};

BitacoraController.prototype.closeEditModal = function() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        this.currentEditId = null;
        document.getElementById('editForm').reset();
    }
};

BitacoraController.prototype.saveEdit = async function() {
    try {
        if (!this.currentEditId) {
            window.dashboard.showToast('ERROR: NO HAY REGISTRO SELECCIONADO', 'error');
            return;
        }

        // Validar tipo de servicio
        const tipoServicio = document.querySelector('input[name="editTipoServicio"]:checked');
        if (!tipoServicio) {
            window.dashboard.showToast('DEBE SELECCIONAR UN TIPO DE SERVICIO', 'error');
            return;
        }

        // Validar campos requeridos
        const fechaSolicitud = document.getElementById('editFechaSolicitud').value;
        const areaId = document.getElementById('editArea').value;
        const colaboradorId = document.getElementById('editColaborador').value;
        const solucion = document.getElementById('editSolucion').value;
        const revisoId = document.getElementById('editReviso').value;
        const status = document.getElementById('editStatus').value;

        if (!fechaSolicitud || !areaId || !colaboradorId || !solucion || !revisoId || !status) {
            window.dashboard.showToast('POR FAVOR COMPLETE TODOS LOS CAMPOS OBLIGATORIOS', 'error');
            return;
        }

        this.showLoading(true);

        // Preparar datos de categoría
        let categoriaData = {};
        if (tipoServicio.value === 'ERP') {
            const categoriaERPId = document.getElementById('editCategoriaERP').value;
            if (!categoriaERPId) {
                window.dashboard.showToast('DEBE SELECCIONAR UNA CATEGORÍA ERP', 'error');
                this.showLoading(false);
                return;
            }
            const catData = window.BitacoraData.categoriasERP.find(c => c.id === categoriaERPId);
            categoriaData = {
                categoria: catData.nombre,
                categoriaId: catData.id
            };
        } else {
            const categoriaPrincipalId = document.getElementById('editCategoriaPrincipal').value;
            const subcategoriaId = document.getElementById('editSubcategoria').value;

            if (!categoriaPrincipalId || !subcategoriaId) {
                window.dashboard.showToast('DEBE SELECCIONAR CATEGORÍA Y SUBCATEGORÍA', 'error');
                this.showLoading(false);
                return;
            }

            const catPrincipal = window.BitacoraData.categoriasTecnico.find(c => c.id === categoriaPrincipalId);
            const subcat = catPrincipal.subcategorias.find(s => s.id === subcategoriaId);

            categoriaData = {
                categoriaPrincipal: catPrincipal.nombre,
                categoriaPrincipalId: catPrincipal.id,
                subcategoria: subcat.nombre,
                subcategoriaId: subcat.id
            };
        }

        // Obtener nombres para guardar
        const area = this.areas.find(a => a.id === areaId);
        const colaborador = this.empleados.find(e => e.id === colaboradorId);
        const reviso = this.empleadosTI.find(e => e.id === revisoId);
        const fechaFinalizacion = document.getElementById('editFechaFinalizacion').value;

        // Preparar objeto de actualización
        const updateData = {
            fechaSolicitud,
            area: area.nombre.toUpperCase(),
            areaId,
            colaborador: `${colaborador.nombre} ${colaborador.apellido}`.toUpperCase(),
            colaboradorId,
            solucion: solucion.toUpperCase(),
            reviso: `${reviso.nombre} ${reviso.apellido}`.toUpperCase(),
            revisoId,
            status,
            tipoServicio: tipoServicio.value,
            ...categoriaData,
            updatedAt: this.fb.serverTimestamp(),
            updatedBy: window.dashboard.auth.getUserData().uid,
            updatedByName: window.dashboard.auth.getUserData().nombre || 'SISTEMA'
        };

        // Agregar fecha de finalización si existe
        if (fechaFinalizacion) {
            updateData.fechaFinalizacion = fechaFinalizacion;
        }

        // Actualizar en Firestore
        await this.fb.update('bitacora', this.currentEditId, updateData);

        window.dashboard.showToast('✅ REGISTRO ACTUALIZADO EXITOSAMENTE', 'success');

        // Cerrar modal
        this.closeEditModal();

        // Recargar registros
        await this.loadRegistros();

    } catch (error) {
        console.error('❌ Error al actualizar registro:', error);
        window.dashboard.showToast('ERROR AL ACTUALIZAR REGISTRO', 'error');
    } finally {
        this.showLoading(false);
    }
};

BitacoraController.prototype.deleteRegistro = function(id) {
    const registro = this.registros.find(r => r.id === id);
    if (!registro) return;

    // Guardar el ID del registro a eliminar
    this.currentDeleteId = id;

    // Crear el contenido del modal con información del registro
    const deleteInfo = document.getElementById('deleteInfo');
    if (deleteInfo) {
        deleteInfo.innerHTML = `
            <div class="delete-info-item">
                <strong>FECHA:</strong> ${this.formatDate(registro.fechaSolicitud)}
            </div>
            <div class="delete-info-item">
                <strong>ÁREA:</strong> ${registro.area}
            </div>
            <div class="delete-info-item">
                <strong>COLABORADOR:</strong> ${registro.colaborador}
            </div>
            <div class="delete-info-item">
                <strong>TIPO:</strong> ${registro.tipoServicio === 'ERP' ? 'SOPORTE ERP' : 'SOPORTE TÉCNICO'}
            </div>
        `;
    }

    // Mostrar modal
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
};

BitacoraController.prototype.closeDeleteModal = function() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        this.currentDeleteId = null;
    }
};

BitacoraController.prototype.confirmDelete = async function() {
    if (!this.currentDeleteId) {
        window.dashboard.showToast('ERROR: NO HAY REGISTRO SELECCIONADO', 'error');
        return;
    }

    // Guardar el ID antes de cerrar el modal
    const idToDelete = this.currentDeleteId;

    try {
        this.showLoading(true);

        // Cerrar modal
        const modal = document.getElementById('deleteModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }

        // Eliminar de Firestore
        await this.fb.delete('bitacora', idToDelete);

        window.dashboard.showToast('✅ REGISTRO ELIMINADO EXITOSAMENTE', 'success');

        // Recargar registros
        await this.loadRegistros();

    } catch (error) {
        console.error('❌ Error al eliminar registro:', error);
        window.dashboard.showToast('ERROR AL ELIMINAR REGISTRO', 'error');
    } finally {
        this.currentDeleteId = null;
        this.showLoading(false);
    }
};

// ==================== UTILIDADES ====================

BitacoraController.prototype.formatDate = function(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (e) {
        return dateStr;
    }
};

BitacoraController.prototype.formatDateTime = function(date) {
    if (!date) return 'N/A';
    try {
        return date.toLocaleString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return 'N/A';
    }
};

BitacoraController.prototype.formatFirestoreDate = function(dateStr) {
    // Firestore guarda como string YYYY-MM-DD
    return dateStr;
};

// ==================== EXPORTAR A EXCEL ====================

BitacoraController.prototype.exportToExcel = function() {
    try {
        // Verificar que hay registros para exportar
        if (!this.registros || this.registros.length === 0) {
            window.dashboard.showToast('NO HAY REGISTROS PARA EXPORTAR', 'warning');
            return;
        }

        // Preparar datos para Excel
        const excelData = this.registros.map(registro => {
            const row = {
                'FECHA SOLICITUD': this.formatDate(registro.fechaSolicitud),
                'FECHA FINALIZACIÓN': registro.fechaFinalizacion ? this.formatDate(registro.fechaFinalizacion) : 'N/A',
                'ÁREA': registro.area,
                'COLABORADOR': registro.colaborador,
                'TIPO SERVICIO': registro.tipoServicio === 'ERP' ? 'SOPORTE ERP' : 'SOPORTE TÉCNICO',
                'STATUS': registro.status
            };

            // Agregar categorías según el tipo de servicio
            if (registro.tipoServicio === 'ERP') {
                row['CATEGORÍA'] = registro.categoria || 'N/A';
            } else {
                row['CATEGORÍA PRINCIPAL'] = registro.categoriaPrincipal || 'N/A';
                row['SUBCATEGORÍA'] = registro.subcategoria || 'N/A';
            }

            // Agregar campos adicionales
            row['SOLUCIÓN'] = registro.solucion || 'N/A';
            row['REVISÓ'] = registro.reviso || 'N/A';
            row['CREADO POR'] = registro.createdByName || 'SISTEMA';
            row['FECHA CREACIÓN'] = registro.createdAtDate ? this.formatDateTime(registro.createdAtDate) : 'N/A';

            return row;
        });

        // Crear libro de trabajo
        const wb = XLSX.utils.book_new();

        // Crear hoja de trabajo
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Ajustar ancho de columnas
        const colWidths = [
            { wch: 15 },  // Fecha Solicitud
            { wch: 15 },  // Fecha Finalización
            { wch: 20 },  // Área
            { wch: 25 },  // Colaborador
            { wch: 18 },  // Tipo Servicio
            { wch: 12 },  // Status
            { wch: 30 },  // Categoría/Principal
            { wch: 30 },  // Subcategoría (si aplica)
            { wch: 50 },  // Solución
            { wch: 25 },  // Revisó
            { wch: 20 },  // Creado Por
            { wch: 18 }   // Fecha Creación
        ];
        ws['!cols'] = colWidths;

        // Agregar hoja al libro
        XLSX.utils.book_append_sheet(wb, ws, 'Bitácora de Servicios');

        // Generar nombre de archivo con fecha actual
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        const filename = `Bitacora_Servicios_${dateStr}_${timeStr}.xlsx`;

        // Descargar archivo
        XLSX.writeFile(wb, filename);

        window.dashboard.showToast(`✅ ARCHIVO EXPORTADO: ${excelData.length} REGISTROS`, 'success');

    } catch (error) {
        console.error('❌ Error al exportar a Excel:', error);
        window.dashboard.showToast('ERROR AL EXPORTAR A EXCEL', 'error');
    }
};