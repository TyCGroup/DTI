// =====================================================
// VALIDADOR DE FORMULARIOS - TyC GROUP
// form-validator.js
// Sistema de validación de formularios con feedback visual
// =====================================================

class FormValidator {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.errors = {};
        this.rules = {};
        
        if (!this.form) {
            console.error(`Formulario con ID "${formId}" no encontrado`);
            return;
        }

        this.init();
    }

    init() {
        this.form.setAttribute('novalidate', 'true');
        this.setupEventListeners();
        console.log(`✅ Validador inicializado para formulario: ${this.form.id}`);
    }

    // ===== DEFINIR REGLAS DE VALIDACIÓN =====
    setRules(rules) {
        this.rules = rules;
        return this;
    }

    // ===== REGLAS DE VALIDACIÓN PREDEFINIDAS =====
    static RULES = {
        required: (value) => {
            return value !== null && value !== undefined && value.toString().trim() !== '';
        },

        email: (value) => {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(value);
        },

        minLength: (value, length) => {
            return value.length >= length;
        },

        maxLength: (value, length) => {
            return value.length <= length;
        },

        min: (value, min) => {
            return parseFloat(value) >= min;
        },

        max: (value, max) => {
            return parseFloat(value) <= max;
        },

        numeric: (value) => {
            return /^\d+$/.test(value);
        },

        alpha: (value) => {
            return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value);
        },

        alphanumeric: (value) => {
            return /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/.test(value);
        },

        phone: (value) => {
            const cleaned = value.replace(/\D/g, '');
            return cleaned.length === 10;
        },

        url: (value) => {
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        },

        date: (value) => {
            const date = new Date(value);
            return date instanceof Date && !isNaN(date);
        },

        match: (value, matchValue) => {
            return value === matchValue;
        },

        pattern: (value, pattern) => {
            const regex = new RegExp(pattern);
            return regex.test(value);
        }
    };

    // ===== MENSAJES DE ERROR PREDETERMINADOS =====
    static MESSAGES = {
        required: 'Este campo es obligatorio',
        email: 'Ingresa un email válido',
        minLength: 'Debe tener al menos {length} caracteres',
        maxLength: 'No debe exceder {length} caracteres',
        min: 'El valor mínimo es {min}',
        max: 'El valor máximo es {max}',
        numeric: 'Solo se permiten números',
        alpha: 'Solo se permiten letras',
        alphanumeric: 'Solo se permiten letras y números',
        phone: 'Ingresa un teléfono válido (10 dígitos)',
        url: 'Ingresa una URL válida',
        date: 'Ingresa una fecha válida',
        match: 'Los campos no coinciden',
        pattern: 'El formato no es válido'
    };

    // ===== VALIDAR UN CAMPO =====
    validateField(fieldName) {
        const field = this.form.elements[fieldName];
        if (!field) return true;

        const rules = this.rules[fieldName];
        if (!rules) return true;

        const value = field.value;
        const errors = [];

        // Validar cada regla
        for (const [ruleName, ruleValue] of Object.entries(rules)) {
            if (ruleName === 'message') continue;

            let isValid = false;
            let message = rules.message?.[ruleName] || FormValidator.MESSAGES[ruleName] || 'Campo inválido';

            // Aplicar regla
            switch (ruleName) {
                case 'required':
                    isValid = FormValidator.RULES.required(value);
                    break;
                case 'email':
                    isValid = !value || FormValidator.RULES.email(value);
                    break;
                case 'minLength':
                    isValid = !value || FormValidator.RULES.minLength(value, ruleValue);
                    message = message.replace('{length}', ruleValue);
                    break;
                case 'maxLength':
                    isValid = !value || FormValidator.RULES.maxLength(value, ruleValue);
                    message = message.replace('{length}', ruleValue);
                    break;
                case 'min':
                    isValid = !value || FormValidator.RULES.min(value, ruleValue);
                    message = message.replace('{min}', ruleValue);
                    break;
                case 'max':
                    isValid = !value || FormValidator.RULES.max(value, ruleValue);
                    message = message.replace('{max}', ruleValue);
                    break;
                case 'numeric':
                    isValid = !value || FormValidator.RULES.numeric(value);
                    break;
                case 'alpha':
                    isValid = !value || FormValidator.RULES.alpha(value);
                    break;
                case 'alphanumeric':
                    isValid = !value || FormValidator.RULES.alphanumeric(value);
                    break;
                case 'phone':
                    isValid = !value || FormValidator.RULES.phone(value);
                    break;
                case 'url':
                    isValid = !value || FormValidator.RULES.url(value);
                    break;
                case 'date':
                    isValid = !value || FormValidator.RULES.date(value);
                    break;
                case 'match':
                    const matchField = this.form.elements[ruleValue];
                    isValid = !value || FormValidator.RULES.match(value, matchField?.value);
                    break;
                case 'pattern':
                    isValid = !value || FormValidator.RULES.pattern(value, ruleValue);
                    break;
                case 'custom':
                    isValid = ruleValue(value, this.form);
                    break;
            }

            if (!isValid) {
                errors.push(message);
            }
        }

        // Actualizar estado del campo
        if (errors.length > 0) {
            this.errors[fieldName] = errors;
            this.showFieldError(field, errors[0]);
            return false;
        } else {
            delete this.errors[fieldName];
            this.clearFieldError(field);
            return true;
        }
    }

    // ===== VALIDAR TODO EL FORMULARIO =====
    validate() {
        this.errors = {};
        let isValid = true;

        for (const fieldName in this.rules) {
            if (!this.validateField(fieldName)) {
                isValid = false;
            }
        }

        return isValid;
    }

    // ===== MOSTRAR ERROR EN CAMPO =====
    showFieldError(field, message) {
        // Agregar clase de error
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');

        // Buscar o crear contenedor de error
        let errorDiv = field.parentElement.querySelector('.error-message');
        
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            field.parentElement.appendChild(errorDiv);
        }

        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    // ===== LIMPIAR ERROR DE CAMPO =====
    clearFieldError(field) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');

        const errorDiv = field.parentElement.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    // ===== LIMPIAR TODOS LOS ERRORES =====
    clearErrors() {
        this.errors = {};
        const fields = this.form.querySelectorAll('.is-invalid, .is-valid');
        fields.forEach(field => {
            field.classList.remove('is-invalid', 'is-valid');
        });

        const errorDivs = this.form.querySelectorAll('.error-message');
        errorDivs.forEach(div => div.style.display = 'none');
    }

    // ===== CONFIGURAR EVENT LISTENERS =====
    setupEventListeners() {
        // Validar en blur
        this.form.addEventListener('blur', (e) => {
            if (e.target.name && this.rules[e.target.name]) {
                this.validateField(e.target.name);
            }
        }, true);

        // Limpiar error en input
        this.form.addEventListener('input', (e) => {
            if (e.target.classList.contains('is-invalid')) {
                this.validateField(e.target.name);
            }
        });

        // Prevenir submit si hay errores
        this.form.addEventListener('submit', (e) => {
            if (!this.validate()) {
                e.preventDefault();
                e.stopPropagation();
                
                // Hacer scroll al primer error
                const firstError = this.form.querySelector('.is-invalid');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstError.focus();
                }
            }
        });
    }

    // ===== OBTENER DATOS DEL FORMULARIO =====
    getData() {
        const formData = new FormData(this.form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    // ===== ESTABLECER DATOS EN EL FORMULARIO =====
    setData(data) {
        for (const [key, value] of Object.entries(data)) {
            const field = this.form.elements[key];
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = value;
                } else if (field.type === 'radio') {
                    const radio = this.form.querySelector(`input[name="${key}"][value="${value}"]`);
                    if (radio) radio.checked = true;
                } else {
                    field.value = value;
                }
            }
        }
    }

    // ===== RESETEAR FORMULARIO =====
    reset() {
        this.form.reset();
        this.clearErrors();
    }

    // ===== DESHABILITAR/HABILITAR FORMULARIO =====
    disable() {
        const elements = this.form.elements;
        for (let i = 0; i < elements.length; i++) {
            elements[i].disabled = true;
        }
    }

    enable() {
        const elements = this.form.elements;
        for (let i = 0; i < elements.length; i++) {
            elements[i].disabled = false;
        }
    }
}

// ===== ESTILOS CSS PARA VALIDACIÓN =====
const validationStyles = `
    .is-invalid {
        border-color: var(--danger-color, #ff4757) !important;
        background-color: rgba(255, 71, 87, 0.05);
    }

    .is-valid {
        border-color: var(--success-color, #00ff88) !important;
        background-color: rgba(0, 255, 136, 0.05);
    }

    .error-message {
        color: var(--danger-color, #ff4757);
        font-size: 0.85rem;
        margin-top: 0.25rem;
        display: none;
        animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .form-field.has-error .form-input {
        border-color: var(--danger-color, #ff4757);
    }

    .form-field.has-success .form-input {
        border-color: var(--success-color, #00ff88);
    }
`;

// Insertar estilos si no existen
if (typeof document !== 'undefined' && !document.getElementById('validation-styles')) {
    const style = document.createElement('style');
    style.id = 'validation-styles';
    style.textContent = validationStyles;
    document.head.appendChild(style);
}

// ===== EJEMPLO DE USO =====
/*
const validator = new FormValidator('myForm');

validator.setRules({
    nombre: {
        required: true,
        minLength: 3,
        maxLength: 50,
        alpha: true,
        message: {
            required: 'El nombre es obligatorio',
            minLength: 'El nombre debe tener al menos 3 caracteres',
            alpha: 'El nombre solo puede contener letras'
        }
    },
    email: {
        required: true,
        email: true
    },
    telefono: {
        required: true,
        phone: true
    },
    password: {
        required: true,
        minLength: 8
    },
    confirmPassword: {
        required: true,
        match: 'password',
        message: {
            match: 'Las contraseñas no coinciden'
        }
    },
    edad: {
        required: true,
        numeric: true,
        min: 18,
        max: 99
    }
});

// Manejar submit
document.getElementById('myForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (validator.validate()) {
        const data = validator.getData();
        console.log('Datos válidos:', data);
        // Enviar datos...
    }
});
*/

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.FormValidator = FormValidator;
}

console.log('✅ Sistema de validación de formularios cargado');