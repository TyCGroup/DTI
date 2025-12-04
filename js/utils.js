// =====================================================
// UTILIDADES Y HELPERS ADICIONALES - TyC GROUP
// utils.js
// Funciones útiles para todas las páginas
// =====================================================

class Utils {
    // ===== VALIDACIONES =====
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validatePhone(phone) {
        const re = /^[0-9]{10}$/;
        return re.test(phone.replace(/[\s\-()]/g, ''));
    }

    static validateURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // ===== FORMATEO =====
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    static titleCase(str) {
        return str.toLowerCase().split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    static truncate(str, length = 50) {
        if (str.length <= length) return str;
        return str.substring(0, length) + '...';
    }

    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    static formatPhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            return '(' + match[1] + ') ' + match[2] + '-' + match[3];
        }
        return phone;
    }

    // ===== MANIPULACIÓN DE FECHAS =====
    
    /**
     * Formatea una fecha en español
     * @param {Date} date - Fecha a formatear
     * @param {string} format - 'short' | 'long' | 'full'
     * @returns {string} Fecha formateada
     */
    static formatDate(date, format = 'long') {
        if (!date) return '-';
        
        // Convertir a Date si es necesario
        const dateObj = date instanceof Date ? date : new Date(date);
        
        if (isNaN(dateObj.getTime())) return '-';
        
        const options = {
            short: { year: 'numeric', month: '2-digit', day: '2-digit' },
            long: { year: 'numeric', month: 'long', day: 'numeric' },
            full: { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
            }
        };
        
        return dateObj.toLocaleDateString('es-MX', options[format] || options.long);
    }

    /**
     * Formatea fecha y hora
     * @param {Date} date - Fecha a formatear
     * @returns {string} Fecha y hora formateada
     */
    static formatDateTime(date) {
        if (!date) return '-';
        
        const dateObj = date instanceof Date ? date : new Date(date);
        
        if (isNaN(dateObj.getTime())) return '-';
        
        return dateObj.toLocaleString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Formatea solo la hora
     * @param {Date} date - Fecha a formatear
     * @returns {string} Hora formateada
     */
    static formatTime(date) {
        if (!date) return '-';
        
        const dateObj = date instanceof Date ? date : new Date(date);
        
        if (isNaN(dateObj.getTime())) return '-';
        
        return dateObj.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static getRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 7) {
            return new Date(date).toLocaleDateString('es-MX');
        } else if (days > 0) {
            return `Hace ${days} día${days > 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
        } else if (minutes > 0) {
            return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
        } else {
            return 'Hace un momento';
        }
    }

    static addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    static getDaysDifference(date1, date2) {
        const diff = Math.abs(new Date(date1) - new Date(date2));
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    /**
     * Convierte Timestamp de Firestore a Date
     * @param {Object} timestamp - Timestamp de Firestore
     * @returns {Date} Objeto Date
     */
    static timestampToDate(timestamp) {
        if (!timestamp) return null;
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            return timestamp.toDate();
        }
        if (timestamp.seconds) {
            return new Date(timestamp.seconds * 1000);
        }
        return new Date(timestamp);
    }

    // ===== ARRAYS =====
    static groupBy(array, key) {
        return array.reduce((result, item) => {
            const group = item[key];
            if (!result[group]) {
                result[group] = [];
            }
            result[group].push(item);
            return result;
        }, {});
    }

    static sortBy(array, key, ascending = true) {
        return array.sort((a, b) => {
            const valA = a[key];
            const valB = b[key];
            if (valA < valB) return ascending ? -1 : 1;
            if (valA > valB) return ascending ? 1 : -1;
            return 0;
        });
    }

    static unique(array) {
        return [...new Set(array)];
    }

    static chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    // ===== OBJETOS =====
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    static isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }

    static pick(obj, keys) {
        return keys.reduce((result, key) => {
            if (key in obj) {
                result[key] = obj[key];
            }
            return result;
        }, {});
    }

    static omit(obj, keys) {
        const result = { ...obj };
        keys.forEach(key => delete result[key]);
        return result;
    }

    // ===== NÚMEROS =====
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static randomFloat(min, max, decimals = 2) {
        const value = Math.random() * (max - min) + min;
        return parseFloat(value.toFixed(decimals));
    }

    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static percentage(value, total) {
        return ((value / total) * 100).toFixed(2);
    }

    // ===== COLORES =====
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    static generateRandomColor() {
        return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    }

    // ===== ANIMACIONES =====
    static smoothScrollTo(element, duration = 500) {
        const target = typeof element === 'string' ? document.querySelector(element) : element;
        if (!target) return;

        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            const ease = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            window.scrollTo(0, startPosition + distance * ease);

            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        }

        requestAnimationFrame(animation);
    }

    static fadeIn(element, duration = 300) {
        element.style.opacity = 0;
        element.style.display = 'block';

        let start = null;
        function step(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            element.style.opacity = Math.min(progress / duration, 1);

            if (progress < duration) {
                requestAnimationFrame(step);
            }
        }

        requestAnimationFrame(step);
    }

    static fadeOut(element, duration = 300) {
        element.style.opacity = 1;

        let start = null;
        function step(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            element.style.opacity = 1 - Math.min(progress / duration, 1);

            if (progress < duration) {
                requestAnimationFrame(step);
            } else {
                element.style.display = 'none';
            }
        }

        requestAnimationFrame(step);
    }

    // ===== DOM =====
    static createElement(tag, attrs = {}, children = []) {
        const element = document.createElement(tag);
        
        Object.keys(attrs).forEach(key => {
            if (key === 'className') {
                element.className = attrs[key];
            } else if (key === 'dataset') {
                Object.assign(element.dataset, attrs[key]);
            } else {
                element.setAttribute(key, attrs[key]);
            }
        });

        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });

        return element;
    }

    static insertAfter(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }

    static removeChildren(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    // ===== STORAGE =====
    static setStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Error al guardar en localStorage:', e);
            return false;
        }
    }

    static getStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Error al leer de localStorage:', e);
            return defaultValue;
        }
    }

    static removeStorage(key) {
        localStorage.removeItem(key);
    }

    static clearStorage() {
        localStorage.clear();
    }

    // ===== EXPORTAR DATOS =====
    static exportToJSON(data, filename = 'export.json') {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        this.downloadFile(blob, filename);
    }

    static exportToCSV(data, filename = 'export.csv', headers = null) {
        if (!data.length) return;

        const csvHeaders = headers || Object.keys(data[0]);
        const csvRows = data.map(row => 
            csvHeaders.map(header => {
                const value = row[header] || '';
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(',')
        );

        const csv = [csvHeaders.join(','), ...csvRows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        this.downloadFile(blob, filename);
    }

    static downloadFile(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    // ===== IMPRIMIR =====
    static printElement(element) {
        const printWindow = window.open('', '', 'width=800,height=600');
        const styles = Array.from(document.styleSheets)
            .map(sheet => {
                try {
                    return Array.from(sheet.cssRules)
                        .map(rule => rule.cssText)
                        .join('\n');
                } catch (e) {
                    return '';
                }
            })
            .join('\n');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Imprimir</title>
                    <style>${styles}</style>
                </head>
                <body>
                    ${element.innerHTML}
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }

    // ===== PERFORMANCE =====
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static memoize(func) {
        const cache = new Map();
        return function(...args) {
            const key = JSON.stringify(args);
            if (cache.has(key)) {
                return cache.get(key);
            }
            const result = func.apply(this, args);
            cache.set(key, result);
            return result;
        };
    }

    // ===== NETWORK =====
    static async fetchWithTimeout(url, options = {}, timeout = 5000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
    }

    static isOnline() {
        return navigator.onLine;
    }

    // ===== DEVICE =====
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    static isTouch() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    static getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            isMobile: this.isMobile(),
            isTouch: this.isTouch(),
            isOnline: this.isOnline()
        };
    }
}

// ===== NOTIFICACIONES =====
class NotificationManager {
    static async requestPermission() {
        if (!('Notification' in window)) {
            console.warn('Este navegador no soporta notificaciones');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    static async show(title, options = {}) {
        const hasPermission = await this.requestPermission();
        if (!hasPermission) return null;

        const notification = new Notification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            ...options
        });

        return notification;
    }
}

// ===== CLIPBOARD MANAGER =====
class ClipboardManager {
    static async copy(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback para navegadores antiguos
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (e) {
                document.body.removeChild(textArea);
                return false;
            }
        }
    }

    static async paste() {
        try {
            return await navigator.clipboard.readText();
        } catch (err) {
            console.error('Error al leer del portapapeles:', err);
            return null;
        }
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.Utils = Utils;
    window.NotificationManager = NotificationManager;
    window.ClipboardManager = ClipboardManager;
}

console.log('🛠️ Utilidades cargadas y disponibles globalmente');