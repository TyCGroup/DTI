// =====================================================
// MÓDULO DE CARGA DINÁMICA DE FAVICON - TyC GROUP
// favicon-loader.js
// =====================================================

(function() {
    'use strict';
    
    // Configuración
    const CONFIG = {
        // Carpeta donde están los favicons
        faviconPath: 'assets/favicon',
        
        // Color del tema
        themeColor: '#00d4ff',
        
        // Detectar automáticamente la ruta base
        autoDetectPath: true
    };
    
    // Detectar si estamos en un subdirectorio
    function getBasePath() {
        if (!CONFIG.autoDetectPath) {
            return './';
        }
        
        const path = window.location.pathname;
        const isInVistas = path.includes('/Vistas/');
        const isInSubdir = path.split('/').length > 2;
        
        return isInVistas || isInSubdir ? '../' : './';
    }
    
    // Cargar favicons
    function loadFavicons() {
        const basePath = getBasePath();
        const faviconBasePath = `${basePath}${CONFIG.faviconPath}`;
        
        // Definir todos los favicons
        const favicons = [
            {
                rel: 'icon',
                type: 'image/svg+xml',
                href: `${faviconBasePath}/favicon.svg`,
                priority: 1
            },
            {
                rel: 'icon',
                type: 'image/x-icon',
                href: `${faviconBasePath}/favicon.ico`,
                priority: 2
            },
            {
                rel: 'icon',
                type: 'image/png',
                sizes: '16x16',
                href: `${faviconBasePath}/favicon-16x16.png`,
                priority: 3
            },
            {
                rel: 'icon',
                type: 'image/png',
                sizes: '32x32',
                href: `${faviconBasePath}/favicon-32x32.png`,
                priority: 3
            },
            {
                rel: 'apple-touch-icon',
                sizes: '180x180',
                href: `${faviconBasePath}/apple-touch-icon.png`,
                priority: 4
            },
            {
                rel: 'icon',
                type: 'image/png',
                sizes: '192x192',
                href: `${faviconBasePath}/android-chrome-192x192.png`,
                priority: 5
            },
            {
                rel: 'icon',
                type: 'image/png',
                sizes: '512x512',
                href: `${faviconBasePath}/android-chrome-512x512.png`,
                priority: 5
            }
        ];
        
        // Limpiar favicons existentes (opcional)
        document.querySelectorAll('link[rel*="icon"]').forEach(link => {
            link.remove();
        });
        
        // Inyectar nuevos favicons
        favicons.forEach(faviconData => {
            const link = document.createElement('link');
            
            Object.keys(faviconData).forEach(key => {
                if (key !== 'priority') {
                    link.setAttribute(key, faviconData[key]);
                }
            });
            
            document.head.appendChild(link);
        });
        
        // Agregar meta theme-color
        let themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeColorMeta) {
            themeColorMeta = document.createElement('meta');
            themeColorMeta.name = 'theme-color';
            themeColorMeta.content = CONFIG.themeColor;
            document.head.appendChild(themeColorMeta);
        } else {
            themeColorMeta.content = CONFIG.themeColor;
        }
        
        // Agregar manifest solo si ya existe en el HTML
        // No lo cargamos automáticamente para evitar errores 404
        // Si quieres usar manifest, agrégalo manualmente en el HTML
        
        console.log('✅ Favicon cargado desde:', faviconBasePath);
    }
    
    // Función para cambiar el favicon dinámicamente
    window.updateFavicon = function(newPath) {
        const link = document.querySelector('link[rel="icon"][type="image/svg+xml"]');
        if (link) {
            link.href = newPath;
        }
    };
    
    // Función para cambiar el theme-color dinámicamente
    window.updateThemeColor = function(newColor) {
        CONFIG.themeColor = newColor;
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.content = newColor;
        }
    };
    
    // Cargar favicons cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadFavicons);
    } else {
        loadFavicons();
    }
    
})();

// Exportar configuración para uso global
window.FaviconLoader = {
    reload: function() {
        location.reload();
    },
    getBasePath: function() {
        return window.location.pathname.includes('/Vistas/') ? '../' : './';
    }
};