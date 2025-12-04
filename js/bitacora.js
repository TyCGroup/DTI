/* =========================================
   BITACORA.JS - CONTROLADOR PRINCIPAL
   Sistema de Bitácora de Servicios TyC
   ========================================= */

class BitacoraController {
    constructor() {
        this.fb = null;
        this.validator = null;
        this.currentView = 'landing'; // landing, form, list
        this.registros = [];
        this.filteredRegistros = [];
        this.areas = [];
        this.empleados = [];
        this.empleadosTI = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        
        this.init();
    }

    async init() {
        try {
            await this.waitForAuth();
            
            // Inicializar Firebase Helpers
            this.fb = new FirebaseHelper();
            
            // Configurar navegación
            this.setupNavigation();
            
            // Cargar datos iniciales
            await this.loadInitialData();
            
            // Configurar formulario
            this.setupForm();
            
            // Configurar listeners
            this.setupEventListeners();
            
            console.log('✅ Bitácora inicializada correctamente');
        } catch (error) {
            console.error('❌ Error al inicializar bitácora:', error);
            window.dashboard.showToast('ERROR AL INICIALIZAR SISTEMA', 'error');
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

    // ==================== NAVEGACIÓN ====================
    setupNavigation() {
        // Botones de landing
        const btnNuevoRegistro = document.getElementById('btnNuevoRegistro');
        const btnVistaEdicion = document.getElementById('btnVistaEdicion');
        
        btnNuevoRegistro?.addEventListener('click', () => {
            this.showView('form');
            this.resetForm();
        });
        
        btnVistaEdicion?.addEventListener('click', () => {
            this.showView('list');
            this.loadRegistros();
        });

        // Botones de volver
        const btnBackToLanding = document.getElementById('btnBackToLanding');
        const btnBackToLandingFromList = document.getElementById('btnBackToLandingFromList');
        const btnCancelar = document.getElementById('btnCancelar');
        
        btnBackToLanding?.addEventListener('click', () => this.showView('landing'));
        btnBackToLandingFromList?.addEventListener('click', () => this.showView('landing'));
        btnCancelar?.addEventListener('click', () => {
            if (confirm('¿DESEA CANCELAR? SE PERDERÁN LOS DATOS NO GUARDADOS.')) {
                this.showView('landing');
            }
        });
    }

    showView(view) {
        const landing = document.getElementById('bitacoraLanding');
        const formView = document.getElementById('bitacoraFormView');
        const listView = document.getElementById('bitacoraListView');

        // Ocultar todas las vistas
        landing?.classList.add('hidden');
        formView?.classList.add('hidden');
        listView?.classList.add('hidden');

        // Mostrar la vista solicitada
        switch(view) {
            case 'landing':
                landing?.classList.remove('hidden');
                break;
            case 'form':
                formView?.classList.remove('hidden');
                this.setDefaultDate();
                break;
            case 'list':
                listView?.classList.remove('hidden');
                break;
        }

        this.currentView = view;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ==================== CARGA DE DATOS ====================
    async loadInitialData() {
        try {
            this.showLoading(true);
            
            // Cargar áreas activas
            const areasSnapshot = await this.fb.db
                .collection('areas')
                .where('estado', '==', 'activo')
                .get();
            
            this.areas = areasSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => a.nombre.localeCompare(b.nombre));

            // Cargar empleados activos
            const empleadosSnapshot = await this.fb.db
                .collection('empleados')
                .where('estado', '==', 'activo')
                .get();
            
            this.empleados = empleadosSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => {
                const nombreA = `${a.nombre} ${a.apellido}`;
                const nombreB = `${b.nombre} ${b.apellido}`;
                return nombreA.localeCompare(nombreB);
            });

            // Filtrar empleados de TI
            this.empleadosTI = this.empleados.filter(emp => 
                emp.area === 'TECNOLOGIA E INNOVACIÓN' || 
                emp.area === 'TECNOLOGÍA E INNOVACIÓN'
            );

            // Poblar selects
            this.populateAreas();
            this.populateReviso();
            this.populateCategoriasERP();
            this.populateCategoriasTecnico();

            console.log('✅ Datos iniciales cargados:', {
                areas: this.areas.length,
                empleados: this.empleados.length,
                empleadosTI: this.empleadosTI.length
            });

        } catch (error) {
            console.error('❌ Error al cargar datos iniciales:', error);
            window.dashboard.showToast('ERROR AL CARGAR DATOS', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // ==================== POBLACIÓN DE SELECTS ====================
    populateAreas() {
        const selectArea = document.getElementById('area');
        if (!selectArea) return;

        selectArea.innerHTML = '<option value="">SELECCIONE UN ÁREA</option>';
        
        this.areas.forEach(area => {
            const option = document.createElement('option');
            option.value = area.id;
            option.textContent = area.nombre.toUpperCase();
            selectArea.appendChild(option);
        });
    }

    populateColaboradores(areaId) {
        const selectColaborador = document.getElementById('colaborador');
        if (!selectColaborador) return;

        selectColaborador.innerHTML = '<option value="">SELECCIONE UN COLABORADOR</option>';
        selectColaborador.disabled = false;

        // Obtener nombre del área
        const area = this.areas.find(a => a.id === areaId);
        if (!area) return;

        // Filtrar empleados por área
        const empleadosArea = this.empleados.filter(emp => 
            emp.area === area.nombre || emp.area === area.nombre.toUpperCase()
        );

        if (empleadosArea.length === 0) {
            selectColaborador.innerHTML = '<option value="">NO HAY COLABORADORES EN ESTA ÁREA</option>';
            selectColaborador.disabled = true;
            return;
        }

        empleadosArea.forEach(empleado => {
            const option = document.createElement('option');
            option.value = empleado.id;
            option.textContent = `${empleado.nombre} ${empleado.apellido}`.toUpperCase();
            selectColaborador.appendChild(option);
        });
    }

    populateReviso() {
        const selectReviso = document.getElementById('reviso');
        if (!selectReviso) return;

        selectReviso.innerHTML = '<option value="">SELECCIONE QUIEN REVISÓ</option>';

        if (this.empleadosTI.length === 0) {
            selectReviso.innerHTML = '<option value="">NO HAY PERSONAL DE TI DISPONIBLE</option>';
            selectReviso.disabled = true;
            return;
        }

        this.empleadosTI.forEach(empleado => {
            const option = document.createElement('option');
            option.value = empleado.id;
            option.textContent = `${empleado.nombre} ${empleado.apellido}`.toUpperCase();
            selectReviso.appendChild(option);
        });
    }

    populateCategoriasERP() {
        const selectCategoriaERP = document.getElementById('categoriaERP');
        if (!selectCategoriaERP) return;

        selectCategoriaERP.innerHTML = '<option value="">SELECCIONE UNA CATEGORÍA</option>';

        window.BitacoraData.categoriasERP.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.id;
            option.textContent = categoria.nombre;
            selectCategoriaERP.appendChild(option);
        });
    }

    populateCategoriasTecnico() {
        const selectCategoriaPrincipal = document.getElementById('categoriaPrincipal');
        if (!selectCategoriaPrincipal) return;

        selectCategoriaPrincipal.innerHTML = '<option value="">SELECCIONE UNA CATEGORÍA</option>';

        window.BitacoraData.categoriasTecnico.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.id;
            option.textContent = categoria.nombre;
            selectCategoriaPrincipal.appendChild(option);
        });
    }

    populateSubcategorias(categoriaPrincipalId) {
        const selectSubcategoria = document.getElementById('subcategoria');
        if (!selectSubcategoria) return;

        selectSubcategoria.innerHTML = '<option value="">SELECCIONE UNA SUBCATEGORÍA</option>';
        selectSubcategoria.disabled = false;

        const subcategorias = window.BitacoraData.getSubcategorias(categoriaPrincipalId);

        if (subcategorias.length === 0) {
            selectSubcategoria.innerHTML = '<option value="">NO HAY SUBCATEGORÍAS</option>';
            selectSubcategoria.disabled = true;
            return;
        }

        subcategorias.forEach(subcategoria => {
            const option = document.createElement('option');
            option.value = subcategoria.id;
            option.textContent = subcategoria.nombre;
            selectSubcategoria.appendChild(option);
        });
    }

    // ==================== CONFIGURACIÓN DE FORMULARIO ====================
    setupForm() {
        const form = document.getElementById('bitacoraForm');
        if (!form) return;

        // Inicializar validador
        this.validator = new FormValidator('bitacoraForm', {
            fechaSolicitud: {
                required: true,
                message: 'LA FECHA DE SOLICITUD ES OBLIGATORIA'
            },
            area: {
                required: true,
                message: 'DEBE SELECCIONAR UN ÁREA'
            },
            colaborador: {
                required: true,
                message: 'DEBE SELECCIONAR UN COLABORADOR'
            },
            solucion: {
                required: true,
                minLength: 10,
                message: 'LA SOLUCIÓN DEBE TENER AL MENOS 10 CARACTERES'
            },
            reviso: {
                required: true,
                message: 'DEBE SELECCIONAR QUIEN REVISÓ'
            },
            status: {
                required: true,
                message: 'DEBE SELECCIONAR UN STATUS'
            }
        });

        // Submit del formulario
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit();
        });
    }

    setupEventListeners() {
        // Cambio de área
        const selectArea = document.getElementById('area');
        selectArea?.addEventListener('change', (e) => {
            const areaId = e.target.value;
            if (areaId) {
                this.populateColaboradores(areaId);
            } else {
                const selectColaborador = document.getElementById('colaborador');
                selectColaborador.innerHTML = '<option value="">PRIMERO SELECCIONE UN ÁREA</option>';
                selectColaborador.disabled = true;
            }
        });

        // Cambio de tipo de servicio
        const radioERP = document.getElementById('servicioERP');
        const radioTecnico = document.getElementById('servicioTecnico');

        radioERP?.addEventListener('change', () => {
            if (radioERP.checked) {
                this.showCategoriaSection('ERP');
            }
        });

        radioTecnico?.addEventListener('change', () => {
            if (radioTecnico.checked) {
                this.showCategoriaSection('TECNICO');
            }
        });

        // Cambio de categoría ERP
        const selectCategoriaERP = document.getElementById('categoriaERP');
        selectCategoriaERP?.addEventListener('change', (e) => {
            const categoriaId = e.target.value;
            const descDiv = document.getElementById('categoriaERPDesc');
            if (categoriaId && descDiv) {
                const descripcion = window.BitacoraData.getDescripcionCategoriaERP(categoriaId);
                descDiv.textContent = descripcion;
            } else if (descDiv) {
                descDiv.textContent = '';
            }
        });

        // Cambio de categoría principal (técnico)
        const selectCategoriaPrincipal = document.getElementById('categoriaPrincipal');
        selectCategoriaPrincipal?.addEventListener('change', (e) => {
            const categoriaId = e.target.value;
            const descDiv = document.getElementById('categoriaPrincipalDesc');
            
            if (categoriaId) {
                // Mostrar descripción
                if (descDiv) {
                    const descripcion = window.BitacoraData.getDescripcionCategoriaTecnico(categoriaId);
                    descDiv.textContent = descripcion;
                }
                
                // Poblar subcategorías
                this.populateSubcategorias(categoriaId);
            } else {
                if (descDiv) descDiv.textContent = '';
                const selectSubcategoria = document.getElementById('subcategoria');
                selectSubcategoria.innerHTML = '<option value="">PRIMERO SELECCIONE CATEGORÍA</option>';
                selectSubcategoria.disabled = true;
            }
        });

        // Cambio de subcategoría
        const selectSubcategoria = document.getElementById('subcategoria');
        selectSubcategoria?.addEventListener('change', (e) => {
            const subcategoriaId = e.target.value;
            const categoriaPrincipalId = document.getElementById('categoriaPrincipal')?.value;
            const descDiv = document.getElementById('subcategoriaDesc');
            
            if (subcategoriaId && categoriaPrincipalId && descDiv) {
                const descripcion = window.BitacoraData.getDescripcionSubcategoria(
                    categoriaPrincipalId, 
                    subcategoriaId
                );
                descDiv.textContent = descripcion;
            } else if (descDiv) {
                descDiv.textContent = '';
            }
        });

        // Filtros en vista de lista
        const searchInput = document.getElementById('searchRegistros');
        const filterStatus = document.getElementById('filterStatus');
        const filterTipoServicio = document.getElementById('filterTipoServicio');

        searchInput?.addEventListener('input', () => this.filterRegistros());
        filterStatus?.addEventListener('change', () => this.filterRegistros());
        filterTipoServicio?.addEventListener('change', () => this.filterRegistros());

        // Event listeners para modal de edición
        this.setupEditModalListeners();
    }

    setupEditModalListeners() {
        // Cambio de área en modal de edición
        const editArea = document.getElementById('editArea');
        editArea?.addEventListener('change', (e) => {
            const areaId = e.target.value;
            if (areaId) {
                this.populateEditColaboradores(areaId);
            }
        });

        // Cambio de tipo de servicio en modal de edición
        const editRadioERP = document.getElementById('editServicioERP');
        const editRadioTecnico = document.getElementById('editServicioTecnico');

        editRadioERP?.addEventListener('change', () => {
            if (editRadioERP.checked) {
                this.showEditCategoriaSection('ERP');
            }
        });

        editRadioTecnico?.addEventListener('change', () => {
            if (editRadioTecnico.checked) {
                this.showEditCategoriaSection('TECNICO');
            }
        });

        // Cambio de categoría principal en modal de edición
        const editCategoriaPrincipal = document.getElementById('editCategoriaPrincipal');
        editCategoriaPrincipal?.addEventListener('change', (e) => {
            const categoriaId = e.target.value;
            if (categoriaId) {
                this.populateEditSubcategorias(categoriaId);
            }
        });
    }

    showCategoriaSection(tipo) {
        const categoriaSection = document.getElementById('categoriaSection');
        const categoriasERP = document.getElementById('categoriasERP');
        const categoriasTecnico = document.getElementById('categoriasTecnico');
        const tipoServicioError = document.getElementById('tipoServicioError');

        // Limpiar error
        if (tipoServicioError) {
            tipoServicioError.textContent = '';
        }

        // Mostrar sección
        categoriaSection?.classList.remove('hidden');

        if (tipo === 'ERP') {
            categoriasERP?.classList.remove('hidden');
            categoriasTecnico?.classList.add('hidden');
            
            // Limpiar campos técnico
            document.getElementById('categoriaPrincipal').value = '';
            document.getElementById('subcategoria').value = '';
            document.getElementById('categoriaPrincipalDesc').textContent = '';
            document.getElementById('subcategoriaDesc').textContent = '';
        } else {
            categoriasERP?.classList.add('hidden');
            categoriasTecnico?.classList.remove('hidden');
            
            // Limpiar campo ERP
            document.getElementById('categoriaERP').value = '';
            document.getElementById('categoriaERPDesc').textContent = '';
        }
    }

    setDefaultDate() {
        const fechaSolicitudInput = document.getElementById('fechaSolicitud');
        if (fechaSolicitudInput && !fechaSolicitudInput.value) {
            const today = new Date().toISOString().split('T')[0];
            fechaSolicitudInput.value = today;
        }
    }

    resetForm() {
        const form = document.getElementById('bitacoraForm');
        form?.reset();
        
        // Ocultar sección de categorías
        document.getElementById('categoriaSection')?.classList.add('hidden');
        
        // Resetear colaborador
        const selectColaborador = document.getElementById('colaborador');
        selectColaborador.innerHTML = '<option value="">PRIMERO SELECCIONE UN ÁREA</option>';
        selectColaborador.disabled = true;
        
        // Limpiar descripciones
        document.getElementById('categoriaERPDesc').textContent = '';
        document.getElementById('categoriaPrincipalDesc').textContent = '';
        document.getElementById('subcategoriaDesc').textContent = '';
        
        // Establecer fecha actual
        this.setDefaultDate();
        
        // Limpiar errores
        this.validator?.clearErrors();
    }

    // Continúa en bitacora-submit.js...

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            if (show) {
                overlay.classList.add('show');
            } else {
                overlay.classList.remove('show');
            }
        }
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.bitacoraController = new BitacoraController();
    });
} else {
    window.bitacoraController = new BitacoraController();
}