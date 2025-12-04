/* =========================================
   BITACORA-DATA.JS
   Datos de Categorías y Subcategorías
   ========================================= */

const BitacoraData = {
    // Categorías ERP
    categoriasERP: [
        {
            id: 'INCIDENCIA_MODULO',
            nombre: 'INCIDENCIA EN MÓDULO',
            descripcion: 'Errores o fallos específicos dentro de una sección del ERP, como contabilidad, ventas o recursos humanos, que impiden realizar una tarea.'
        },
        {
            id: 'CONSULTA_GENERAL_ERP',
            nombre: 'CONSULTA GENERAL ERP',
            descripcion: 'Preguntas de los usuarios sobre cómo utilizar el sistema, dónde encontrar una función o cómo realizar un proceso correctamente.'
        },
        {
            id: 'FALLA_REPORTE',
            nombre: 'FALLA EN REPORTE',
            descripcion: 'Problemas al generar o visualizar informes desde el ERP, como datos incorrectos, reportes que no se cargan o errores de exportación.'
        },
        {
            id: 'REINICIO_SISTEMA',
            nombre: 'REINICIO DE SISTEMA',
            descripcion: 'Solicitudes para reiniciar el servicio del ERP, generalmente para solucionar un bloqueo o aplicar actualizaciones menores.'
        },
        {
            id: 'CAPACITACION_ERP',
            nombre: 'CAPACITACIÓN ERP',
            descripcion: 'Sesiones de formación o guías para enseñar a los usuarios a manejar módulos nuevos o existentes del sistema.'
        }
    ],

    // Categorías Principales de Soporte Técnico
    categoriasTecnico: [
        {
            id: 'SOPORTE_HARDWARE',
            nombre: 'SOPORTE HARDWARE',
            descripcion: 'Problemas físicos relacionados con los equipos informáticos y sus periféricos.',
            subcategorias: [
                {
                    id: 'PROBLEMA_IMPRESION',
                    nombre: 'PROBLEMA DE IMPRESIÓN',
                    descripcion: 'Cualquier fallo relacionado con impresoras, como atascos de papel, problemas de conexión, mala calidad de impresión o cambio de tóner.'
                },
                {
                    id: 'FALLA_DISCO_DURO',
                    nombre: 'FALLA DE DISCO DURO',
                    descripcion: 'Errores en el disco de almacenamiento de un equipo, que pueden causar lentitud en el sistema, pérdida de información o que el sistema no inicie.'
                },
                {
                    id: 'CONFIGURACION_EQUIPO',
                    nombre: 'CONFIGURACIÓN DE EQUIPO',
                    descripcion: 'Tareas de instalación, configuración inicial, reubicación o cambio de componentes, laptops y otros dispositivos para los usuarios.'
                },
                {
                    id: 'SOPORTE_TELEFONIA',
                    nombre: 'SOPORTE TELEFONÍA',
                    descripcion: 'Incidencias con teléfonos fijos, conmutadores o sistemas de voz, como problemas con las llamadas, configuración de extensiones o buzón de voz.'
                },
                {
                    id: 'FALLA_EQUIPO',
                    nombre: 'FALLA DE EQUIPO',
                    descripcion: 'Problemas generales de funcionamiento de una computadora, como que esté lenta, se congele, no encienda o se apague inesperadamente.'
                },
                {
                    id: 'PROYECTORES_SALAS',
                    nombre: 'PROYECTORES Y SALAS',
                    descripcion: 'Asistencia con equipos de salas de juntas, como proyectores, pantallas, sistemas de videoconferencia o dispositivos para compartir pantalla (ClickShare).'
                },
                {
                    id: 'FALLA_PERIFERICO',
                    nombre: 'FALLA DE PERIFÉRICO',
                    descripcion: 'Problemas con dispositivos externos conectados al equipo, como teclados, ratones (mouse), monitores, cámaras web o audífonos.'
                },
                {
                    id: 'MANTENIMIENTO_FISICO',
                    nombre: 'MANTENIMIENTO FÍSICO',
                    descripcion: 'Tareas preventivas y administrativas como limpieza de equipos, realización de inventarios de hardware o respaldos físicos de equipos.'
                }
            ]
        },
        {
            id: 'SOPORTE_SOFTWARE',
            nombre: 'SOPORTE SOFTWARE',
            descripcion: 'Incidencias relacionadas con programas, aplicaciones y sistemas operativos instalados en los equipos.',
            subcategorias: [
                {
                    id: 'SOPORTE_EXCEL',
                    nombre: 'SOPORTE EXCEL',
                    descripcion: 'Ayuda específica con Microsoft Excel, incluyendo resolución de dudas sobre fórmulas, creación o reparación de macros y problemas de formato.'
                },
                {
                    id: 'SOPORTE_OUTLOOK',
                    nombre: 'SOPORTE OFFICE (OUTLOOK)',
                    descripcion: 'Problemas con la plataforma de correo electrónico, principalmente Outlook, como fallos de sincronización, configuración de cuentas o problemas con el calendario.'
                },
                {
                    id: 'INSTALACION_SOFTWARE',
                    nombre: 'INSTALACIÓN/ACTUALIZACIÓN SOFTWARE',
                    descripcion: 'Solicitudes para instalar nuevos programas, actualizar versiones existentes o instalar drivers necesarios para el funcionamiento de hardware.'
                },
                {
                    id: 'SOPORTE_OFFICE_GENERAL',
                    nombre: 'SOPORTE OFFICE (GENERAL)',
                    descripcion: 'Asistencia con aplicaciones de la suite de Office que no son Excel u Outlook, como Word, PowerPoint, etc.'
                },
                {
                    id: 'SOPORTE_COLABORACION',
                    nombre: 'SOPORTE COLABORACIÓN (TEAMS/ZOOM)',
                    descripcion: 'Problemas con plataformas de comunicación y videoconferencia como Microsoft Teams o Zoom.'
                },
                {
                    id: 'SOPORTE_ONEDRIVE',
                    nombre: 'SOPORTE ONEDRIVE',
                    descripcion: 'Fallos o dudas relacionadas con el servicio de almacenamiento en la nube de Microsoft, como problemas de sincronización de archivos.'
                },
                {
                    id: 'NAVEGADORES_WEB',
                    nombre: 'NAVEGADORES Y WEB',
                    descripcion: 'Dificultades para acceder a páginas web, errores en navegadores como Chrome o Mozilla, o problemas de visualización de contenido online.'
                },
                {
                    id: 'PROBLEMAS_SO',
                    nombre: 'PROBLEMAS DE SO',
                    descripcion: 'Errores relacionados con el sistema operativo (Windows o macOS), como fallos de arranque, actualizaciones o configuración del sistema.'
                },
                {
                    id: 'SOPORTE_FACTORIAL',
                    nombre: 'SOPORTE FACTORIAL',
                    descripcion: 'Asistencia técnica con el sistema Factorial, incluyendo problemas de acceso, configuración y uso de sus módulos.'
                },
                {
                    id: 'SOPORTE_CRM',
                    nombre: 'SOPORTE CRM',
                    descripcion: 'Soporte para el sistema de gestión de relaciones con clientes (CRM), incluyendo problemas de acceso, configuración y uso.'
                },
                {
                    id: 'SOPORTE_SIN',
                    nombre: 'SOPORTE SIN',
                    descripcion: 'Asistencia técnica con el sistema SIN, incluyendo problemas de acceso, configuración y funcionamiento.'
                },
                {
                    id: 'SOPORTE_SABRE',
                    nombre: 'SOPORTE SABRE',
                    descripcion: 'Soporte para el sistema Sabre, incluyendo problemas de acceso, configuración y operación del sistema.'
                },
                {
                    id: 'SOPORTE_SIP',
                    nombre: 'SOPORTE SIP',
                    descripcion: 'Asistencia técnica con el sistema SIP, incluyendo problemas de acceso, configuración y uso de sus funcionalidades.'
                },
                {
                    id: 'SOPORTE_ICAAV',
                    nombre: 'SOPORTE ICAAV',
                    descripcion: 'Soporte para el sistema ICAAV, incluyendo problemas de acceso, configuración y operación.'
                }
            ]
        },
        {
            id: 'CUENTAS_ACCESOS',
            nombre: 'CUENTAS Y ACCESOS',
            descripcion: 'Gestión de las identidades digitales de los usuarios y sus permisos para acceder a sistemas y servicios.',
            subcategorias: [
                {
                    id: 'GESTION_FIRMAS',
                    nombre: 'GESTIÓN DE FIRMAS',
                    descripcion: 'Solicitudes para crear, instalar o modificar las firmas de correo electrónico de los usuarios.'
                },
                {
                    id: 'PROBLEMAS_ACCESO',
                    nombre: 'PROBLEMAS DE ACCESO/LOGIN',
                    descripcion: 'Dificultades de un usuario para iniciar sesión en algún sistema, aplicación o en la red (Intranet).'
                },
                {
                    id: 'GESTION_CONTRASENAS',
                    nombre: 'GESTIÓN DE CONTRASEÑAS',
                    descripcion: 'Solicitudes para restablecer contraseñas olvidadas o cambiar las existentes por seguridad.'
                },
                {
                    id: 'GESTION_CUENTAS',
                    nombre: 'GESTIÓN DE CUENTAS',
                    descripcion: 'Tareas administrativas como la creación de nuevas cuentas de usuario, la desactivación de cuentas por baja de personal o la activación de servicios.'
                }
            ]
        },
        {
            id: 'REDES_INTERNET',
            nombre: 'REDES E INTERNET',
            descripcion: 'Incidencias relacionadas con la conectividad a la red local y a Internet.',
            subcategorias: [
                {
                    id: 'PROBLEMA_WIFI',
                    nombre: 'PROBLEMA DE WI-FI',
                    descripcion: 'Dificultades para conectarse a la red inalámbrica, señal débil o desconexiones constantes.'
                },
                {
                    id: 'FALLA_INTERNET',
                    nombre: 'FALLA DE INTERNET',
                    descripcion: 'Caída total o parcial del servicio de Internet que afecta a uno o varios usuarios.'
                },
                {
                    id: 'PROBLEMA_RED_INTERNA',
                    nombre: 'PROBLEMA DE RED INTERNA',
                    descripcion: 'Fallos en la conexión por cable (Ethernet), problemas con la asignación de IPs o lentitud en el acceso a recursos locales.'
                }
            ]
        },
        {
            id: 'SOPORTE_GENERAL',
            nombre: 'SOPORTE GENERAL',
            descripcion: 'Solicitudes de asistencia que no encajan en una categoría técnica específica pero que requieren la intervención del equipo de TI.',
            subcategorias: [
                {
                    id: 'ASISTENCIA_GENERAL',
                    nombre: 'ASISTENCIA GENERAL',
                    descripcion: 'Ayuda o apoyo general en tareas informáticas que el usuario no sabe cómo realizar.'
                },
                {
                    id: 'RESPALDO_INFORMACION',
                    nombre: 'RESPALDO DE INFORMACIÓN',
                    descripcion: 'Solicitudes para realizar copias de seguridad de datos de usuario, cambio de equipo o por prevención.'
                },
                {
                    id: 'CONSULTA',
                    nombre: 'CONSULTA',
                    descripcion: 'Preguntas generales sobre tecnología o procedimientos internos del área de TI.'
                },
                {
                    id: 'CAPACITACION',
                    nombre: 'CAPACITACIÓN',
                    descripcion: 'Instrucción o explicación a los usuarios sobre el uso de alguna herramienta o software.'
                }
            ]
        },
        {
            id: 'OTRA',
            nombre: 'OTRA',
            descripcion: 'Categoría para registrar incidencias que no pueden ser clasificadas en ninguna de las anteriores.',
            subcategorias: [
                {
                    id: 'SIN_CLASIFICAR',
                    nombre: 'SIN CLASIFICAR',
                    descripcion: 'Tickets que, por falta de información o por su naturaleza atípica, no corresponden a ninguna de las categorías definidas.'
                }
            ]
        }
    ],

    // Método para obtener subcategorías por categoría principal
    getSubcategorias(categoriaPrincipalId) {
        const categoria = this.categoriasTecnico.find(cat => cat.id === categoriaPrincipalId);
        return categoria ? categoria.subcategorias : [];
    },

    // Método para obtener descripción de categoría ERP
    getDescripcionCategoriaERP(categoriaId) {
        const categoria = this.categoriasERP.find(cat => cat.id === categoriaId);
        return categoria ? categoria.descripcion : '';
    },

    // Método para obtener descripción de categoría técnico
    getDescripcionCategoriaTecnico(categoriaId) {
        const categoria = this.categoriasTecnico.find(cat => cat.id === categoriaId);
        return categoria ? categoria.descripcion : '';
    },

    // Método para obtener descripción de subcategoría
    getDescripcionSubcategoria(categoriaPrincipalId, subcategoriaId) {
        const categoria = this.categoriasTecnico.find(cat => cat.id === categoriaPrincipalId);
        if (categoria && categoria.subcategorias) {
            const subcategoria = categoria.subcategorias.find(sub => sub.id === subcategoriaId);
            return subcategoria ? subcategoria.descripcion : '';
        }
        return '';
    }
};

// Hacer disponible globalmente
window.BitacoraData = BitacoraData;