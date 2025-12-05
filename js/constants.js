// =====================================================
// CONSTANTES Y CONFIGURACIÓN GLOBAL - TyC GROUP
// constants.js
// Define todas las constantes y configuraciones del sistema
// =====================================================

const CONFIG = {
    // ===== INFORMACIÓN DEL SISTEMA =====
    APP_NAME: 'TyC Group Dashboard',
    APP_VERSION: '1.0.0',
    COMPANY: 'TyC Group - Tecnología e Innovación',
    DEPARTMENT: 'Departamento de Tecnologías de la Innovación',
    
    // ===== RUTAS =====
    ROUTES: {
        LOGIN: '../index.html',
        DASHBOARD: './dashboard.html',
        INVENTARIO: './inventario.html',
        DOCUMENTOS: './documentos.html',
        BITACORA: './bitacora.html',
        HISTORIAL: './historial.html',
        TIPS: './tips.html',
        RESPALDOS: './respaldos.html',
        MANTENIMIENTO: './mantenimiento.html',
        ADMINISTRACION: './administracion.html',
    },

    // ===== ROLES Y PERMISOS =====
    ROLES: {
        SUPER_ADMIN: 'SuperAdmin',
        ADMIN: 'Admin',
        USUARIO: 'Usuario',
        BECARIO: 'Becario'
    },

    PERMISSIONS: {
        // Inventario General
        VIEW_INVENTORY: 'view_inventory',
        CREATE_INVENTORY: 'create_inventory',
        EDIT_INVENTORY: 'edit_inventory',
        DELETE_INVENTORY: 'delete_inventory',
        EXPORT_INVENTORY: 'export_inventory',

        // Inventario Laptops
        VIEW_LAPTOP_INVENTORY: 'view_laptop_inventory',
        CREATE_LAPTOP: 'create_laptop',
        EDIT_LAPTOP: 'edit_laptop',
        DELETE_LAPTOP: 'delete_laptop',
        ASSIGN_USER_LAPTOP: 'assign_user_laptop',
        VIEW_LAPTOP_HISTORY: 'view_laptop_history',
        EXPORT_LAPTOP_INVENTORY: 'export_laptop_inventory',

        // Inventario Desktops
        VIEW_DESKTOP_INVENTORY: 'view_desktop_inventory',
        CREATE_DESKTOP: 'create_desktop',
        EDIT_DESKTOP: 'edit_desktop',
        DELETE_DESKTOP: 'delete_desktop',

        // Inventario Periféricos
        VIEW_PERIPHERAL_INVENTORY: 'view_peripheral_inventory',
        CREATE_PERIPHERAL: 'create_peripheral',
        EDIT_PERIPHERAL: 'edit_peripheral',
        DELETE_PERIPHERAL: 'delete_peripheral',

        // Documentos
        VIEW_DOCUMENTS: 'view_documents',
        UPLOAD_DOCUMENTS: 'upload_documents',
        DELETE_DOCUMENTS: 'delete_documents',

        // Usuarios
        VIEW_USERS: 'view_users',
        CREATE_USERS: 'create_users',
        EDIT_USERS: 'edit_users',
        DELETE_USERS: 'delete_users',

        // Configuración
        MANAGE_SETTINGS: 'manage_settings',
        VIEW_LOGS: 'view_logs',
        MANAGE_BACKUPS: 'manage_backups'
    },

    // Permisos por rol
    ROLE_PERMISSIONS: {
        SuperAdmin: [
            'view_inventory', 'create_inventory', 'edit_inventory', 'delete_inventory', 'export_inventory',
            'view_laptop_inventory', 'create_laptop', 'edit_laptop', 'delete_laptop', 'assign_user_laptop', 'view_laptop_history', 'export_laptop_inventory',
            'view_desktop_inventory', 'create_desktop', 'edit_desktop', 'delete_desktop',
            'view_peripheral_inventory', 'create_peripheral', 'edit_peripheral', 'delete_peripheral',
            'view_documents', 'upload_documents', 'delete_documents',
            'view_users', 'create_users', 'edit_users', 'delete_users',
            'manage_settings', 'view_logs', 'manage_backups'
        ],
        Admin: [
            'view_inventory', 'create_inventory', 'edit_inventory', 'export_inventory',
            'view_laptop_inventory', 'create_laptop', 'edit_laptop', 'assign_user_laptop', 'view_laptop_history', 'export_laptop_inventory',
            'view_desktop_inventory', 'create_desktop', 'edit_desktop',
            'view_peripheral_inventory', 'create_peripheral', 'edit_peripheral',
            'view_documents', 'upload_documents',
            'view_users', 'manage_settings'
        ],
        Usuario: [
            'view_inventory', 'view_laptop_inventory', 'view_desktop_inventory', 'view_peripheral_inventory',
            'view_documents', 'view_laptop_history'
        ],
        Becario: [
            'view_inventory', 'view_laptop_inventory', 'view_desktop_inventory', 'view_peripheral_inventory',
            'view_documents'
        ]
    },

    // ===== COLECCIONES DE FIRESTORE =====
    COLLECTIONS: {
        USERS: 'usuarios',
        EQUIPMENT: 'equipos',
        DOCUMENTS: 'documentos',
        LOG: 'bitacora',
        TASKS: 'tareas',
        BACKUPS: 'respaldos',
        MAINTENANCE: 'mantenimiento',
        SETTINGS: 'configuracion',
        // Inventarios
        INVENTORY_LAPTOPS: 'inventarios_laptops',
        INVENTORY_DESKTOPS: 'inventarios_desktops',
        INVENTORY_PERIPHERALS: 'inventarios_perifericos'
    },

    // ===== ESTADOS =====
    EQUIPMENT_STATUS: {
        ACTIVE: 'activo',
        MAINTENANCE: 'mantenimiento',
        INACTIVE: 'inactivo'
    },

    TASK_STATUS: {
        PENDING: 'pendiente',
        IN_PROGRESS: 'en_progreso',
        COMPLETED: 'completada',
        CANCELLED: 'cancelada'
    },

    PRIORITY_LEVELS: {
        LOW: 'baja',
        MEDIUM: 'media',
        HIGH: 'alta',
        URGENT: 'urgente'
    },

    // ===== TIPOS DE EQUIPOS =====
    EQUIPMENT_TYPES: [
        'Laptop',
        'Desktop',
        'Monitor',
        'Impresora',
        'Escáner',
        'Servidor',
        'Switch',
        'Router',
        'Firewall',
        'Access Point',
        'UPS',
        'Proyector',
        'Teléfono IP',
        'Otro'
    ],

    // ===== TIPOS DE DOCUMENTOS =====
    DOCUMENT_TYPES: {
        PDF: 'application/pdf',
        WORD: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        IMAGE: ['image/jpeg', 'image/png', 'image/gif'],
        TEXT: 'text/plain'
    },

    DOCUMENT_CATEGORIES: [
        'Manual',
        'Procedimiento',
        'Política',
        'Reporte',
        'Factura',
        'Contrato',
        'Otros'
    ],

    // ===== LÍMITES Y VALIDACIONES =====
    LIMITS: {
        MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
        MAX_FILES_UPLOAD: 5,
        MAX_SEARCH_RESULTS: 50,
        ITEMS_PER_PAGE: 20,
        SESSION_TIMEOUT: 60 * 60 * 1000, // 1 hora
        DEBOUNCE_DELAY: 300 // ms
    },

    VALIDATION: {
        MIN_PASSWORD_LENGTH: 6,
        MAX_PASSWORD_LENGTH: 50,
        MIN_USERNAME_LENGTH: 3,
        MAX_USERNAME_LENGTH: 50,
        PHONE_LENGTH: 10,
        MIN_DESCRIPTION_LENGTH: 10,
        MAX_DESCRIPTION_LENGTH: 500
    },

    // ===== CONFIGURACIÓN DE UI =====
    UI: {
        TOAST_DURATION: 4000, // ms
        MODAL_ANIMATION_DURATION: 300, // ms
        SCROLL_ANIMATION_DURATION: 500, // ms
        DEBOUNCE_SEARCH: 300, // ms
        AUTO_SAVE_INTERVAL: 30000, // 30 segundos
        DEFAULT_THEME: 'dark',
        SIDEBAR_WIDTH: 260, // px
        HEADER_HEIGHT: 70 // px
    },

    // ===== COLORES =====
    COLORS: {
        PRIMARY: '#00d4ff',
        SECONDARY: '#0066cc',
        SUCCESS: '#00ff88',
        DANGER: '#ff4757',
        WARNING: '#ffa502',
        INFO: '#00d4ff',
        DARK: '#0a0e27',
        LIGHT: '#f5f7fa'
    },

    // ===== MENSAJES =====
    MESSAGES: {
        SUCCESS: {
            SAVE: 'Guardado exitosamente',
            UPDATE: 'Actualizado exitosamente',
            DELETE: 'Eliminado exitosamente',
            UPLOAD: 'Archivo subido exitosamente',
            EXPORT: 'Exportado exitosamente',
            LOGIN: 'Sesión iniciada',
            LOGOUT: 'Sesión cerrada'
        },
        ERROR: {
            GENERIC: 'Ocurrió un error inesperado',
            NETWORK: 'Error de conexión',
            UNAUTHORIZED: 'No tienes permisos para esta acción',
            NOT_FOUND: 'Elemento no encontrado',
            INVALID_DATA: 'Datos inválidos',
            FILE_TOO_LARGE: 'El archivo es demasiado grande',
            INVALID_FILE_TYPE: 'Tipo de archivo no permitido'
        },
        CONFIRM: {
            DELETE: '¿Estás seguro de eliminar este elemento?',
            LOGOUT: '¿Estás seguro de cerrar sesión?',
            CANCEL: '¿Deseas cancelar los cambios?',
            RESET: '¿Restablecer a valores predeterminados?'
        }
    },

    // ===== CONFIGURACIÓN DE FIREBASE =====
    FIREBASE: {
        TIMESTAMP_FORMAT: 'YYYY-MM-DD HH:mm:ss',
        CACHE_SIZE: 40000000, // 40MB
        ENABLE_PERSISTENCE: true
    },

    // ===== CONFIGURACIÓN DE BÚSQUEDA =====
    SEARCH: {
        MIN_QUERY_LENGTH: 2,
        MAX_RESULTS: 10,
        HIGHLIGHT_COLOR: '#00d4ff'
    },

    // ===== CONFIGURACIÓN DE SONIDOS =====
    SOUNDS: {
        CLICK_FREQUENCY: 800, // Hz
        KEYPRESS_FREQUENCY: 400, // Hz
        SUCCESS_FREQUENCIES: [523.25, 659.25, 783.99], // Do, Mi, Sol
        DEFAULT_VOLUME: 50, // %
        MAX_VOLUME: 100 // %
    },

    // ===== UBICACIONES COMUNES =====
    LOCATIONS: [
        'Oficina 101',
        'Oficina 102',
        'Oficina 201',
        'Oficina 202',
        'Oficina 301',
        'Sala de Servidores',
        'Sala de Juntas A',
        'Sala de Juntas B',
        'Recepción',
        'Almacén',
        'Bodega'
    ],

    // ===== MARCAS COMUNES =====
    BRANDS: {
        COMPUTERS: ['HP', 'Dell', 'Lenovo', 'Apple', 'Asus', 'Acer', 'MSI'],
        PRINTERS: ['HP', 'Canon', 'Epson', 'Brother', 'Xerox'],
        NETWORK: ['Cisco', 'Ubiquiti', 'TP-Link', 'D-Link', 'Netgear', 'Mikrotik'],
        MONITORS: ['Dell', 'LG', 'Samsung', 'BenQ', 'Asus', 'AOC']
    },

    // ===== FORMATO DE FECHAS =====
    DATE_FORMATS: {
        SHORT: 'DD/MM/YYYY',
        LONG: 'DD [de] MMMM [de] YYYY',
        WITH_TIME: 'DD/MM/YYYY HH:mm',
        FULL: 'dddd, DD [de] MMMM [de] YYYY HH:mm',
        TIME_ONLY: 'HH:mm',
        ISO: 'YYYY-MM-DD'
    },

    // ===== ICONOS POR TIPO =====
    ICONS: {
        EQUIPMENT: {
            Laptop: '<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0l1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>',
            Desktop: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
            Monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
            Servidor: '<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>'
        },
        STATUS: {
            activo: '<circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>',
            mantenimiento: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
            inactivo: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
        }
    },

    // ===== CONFIGURACIÓN DEV/PROD =====
    ENVIRONMENT: {
        MODE: 'development', // 'development' o 'production'
        DEBUG: true,
        ENABLE_LOGS: true,
        ENABLE_ANALYTICS: false
    }
};

// ===== FUNCIONES HELPER PARA CONFIGURACIÓN =====
class ConfigHelper {
    static hasPermission(userRole, permission) {
        const rolePermissions = CONFIG.ROLE_PERMISSIONS[userRole] || [];
        return rolePermissions.includes(permission);
    }

    static getStatusColor(status) {
        const colors = {
            [CONFIG.EQUIPMENT_STATUS.ACTIVE]: CONFIG.COLORS.SUCCESS,
            [CONFIG.EQUIPMENT_STATUS.MAINTENANCE]: CONFIG.COLORS.WARNING,
            [CONFIG.EQUIPMENT_STATUS.INACTIVE]: CONFIG.COLORS.DANGER,
            [CONFIG.TASK_STATUS.PENDING]: CONFIG.COLORS.WARNING,
            [CONFIG.TASK_STATUS.IN_PROGRESS]: CONFIG.COLORS.INFO,
            [CONFIG.TASK_STATUS.COMPLETED]: CONFIG.COLORS.SUCCESS,
            [CONFIG.TASK_STATUS.CANCELLED]: CONFIG.COLORS.DANGER
        };
        return colors[status] || CONFIG.COLORS.DARK;
    }

    static getStatusLabel(status) {
        const labels = {
            [CONFIG.EQUIPMENT_STATUS.ACTIVE]: 'Activo',
            [CONFIG.EQUIPMENT_STATUS.MAINTENANCE]: 'En Mantenimiento',
            [CONFIG.EQUIPMENT_STATUS.INACTIVE]: 'Inactivo',
            [CONFIG.TASK_STATUS.PENDING]: 'Pendiente',
            [CONFIG.TASK_STATUS.IN_PROGRESS]: 'En Progreso',
            [CONFIG.TASK_STATUS.COMPLETED]: 'Completada',
            [CONFIG.TASK_STATUS.CANCELLED]: 'Cancelada'
        };
        return labels[status] || status;
    }

    static getPriorityColor(priority) {
        const colors = {
            [CONFIG.PRIORITY_LEVELS.LOW]: CONFIG.COLORS.SUCCESS,
            [CONFIG.PRIORITY_LEVELS.MEDIUM]: CONFIG.COLORS.WARNING,
            [CONFIG.PRIORITY_LEVELS.HIGH]: CONFIG.COLORS.DANGER,
            [CONFIG.PRIORITY_LEVELS.URGENT]: '#ff0000'
        };
        return colors[priority] || CONFIG.COLORS.DARK;
    }

    static validateFileSize(size) {
        return size <= CONFIG.LIMITS.MAX_FILE_SIZE;
    }

    static validateFileType(type, allowedTypes) {
        if (Array.isArray(allowedTypes)) {
            return allowedTypes.includes(type);
        }
        return type === allowedTypes;
    }

    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    static log(...args) {
        if (CONFIG.ENVIRONMENT.ENABLE_LOGS && CONFIG.ENVIRONMENT.DEBUG) {
            console.log('[TyC Dashboard]', ...args);
        }
    }

    static error(...args) {
        if (CONFIG.ENVIRONMENT.ENABLE_LOGS) {
            console.error('[TyC Dashboard ERROR]', ...args);
        }
    }

    static warn(...args) {
        if (CONFIG.ENVIRONMENT.ENABLE_LOGS) {
            console.warn('[TyC Dashboard WARN]', ...args);
        }
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
    window.ConfigHelper = ConfigHelper;
}

// Log de inicialización
ConfigHelper.log('Configuración cargada', {
    version: CONFIG.APP_VERSION,
    mode: CONFIG.ENVIRONMENT.MODE
});