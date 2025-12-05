// =====================================================
// FIREBASE HELPERS - TyC GROUP
// firebase-helpers.js
// Funciones auxiliares para operaciones con Firebase
// =====================================================

class FirebaseHelper {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.storage = firebase.storage?.() || null;
        console.log('🔥 Firebase Helper inicializado');
    }

    // ===== FIRESTORE - CRUD =====

    /**
     * Crear un documento
     * @param {string} collection - Nombre de la colección
     * @param {object} data - Datos del documento
     * @param {string} id - ID opcional del documento
     * @returns {Promise<string>} - ID del documento creado
     */
    async create(collection, data, id = null) {
        try {
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            const dataWithTimestamp = {
                ...data,
                createdAt: timestamp,
                updatedAt: timestamp,
                createdBy: this.auth.currentUser?.uid || null
            };

            if (id) {
                await this.db.collection(collection).doc(id).set(dataWithTimestamp);
                return id;
            } else {
                const docRef = await this.db.collection(collection).add(dataWithTimestamp);
                return docRef.id;
            }
        } catch (error) {
            console.error('Error al crear documento:', error);
            throw error;
        }
    }

    /**
     * Leer un documento por ID
     * @param {string} collection - Nombre de la colección
     * @param {string} id - ID del documento
     * @returns {Promise<object>} - Datos del documento
     */
    async read(collection, id) {
        try {
            const doc = await this.db.collection(collection).doc(id).get();
            
            if (!doc.exists) {
                throw new Error('Documento no encontrado');
            }

            return { id: doc.id, ...doc.data() };
        } catch (error) {
            console.error('Error al leer documento:', error);
            throw error;
        }
    }

    /**
     * Leer todos los documentos de una colección
     * @param {string} collection - Nombre de la colección
     * @param {object} options - Opciones de consulta
     * @returns {Promise<array>} - Array de documentos
     */
    async readAll(collection, options = {}) {
        try {
            let query = this.db.collection(collection);

            // Aplicar filtros
            if (options.where) {
                options.where.forEach(([field, operator, value]) => {
                    query = query.where(field, operator, value);
                });
            }

            // Aplicar ordenamiento
            if (options.orderBy) {
                const [field, direction = 'asc'] = options.orderBy;
                query = query.orderBy(field, direction);
            }

            // Aplicar límite
            if (options.limit) {
                query = query.limit(options.limit);
            }

            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error al leer documentos:', error);
            throw error;
        }
    }

    /**
     * Actualizar un documento
     * @param {string} collection - Nombre de la colección
     * @param {string} id - ID del documento
     * @param {object} data - Datos a actualizar
     * @returns {Promise<void>}
     */
    async update(collection, id, data) {
        try {
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            const dataWithTimestamp = {
                ...data,
                updatedAt: timestamp,
                updatedBy: this.auth.currentUser?.uid || null
            };

            await this.db.collection(collection).doc(id).update(dataWithTimestamp);
        } catch (error) {
            console.error('Error al actualizar documento:', error);
            throw error;
        }
    }

    /**
     * Eliminar un documento
     * @param {string} collection - Nombre de la colección
     * @param {string} id - ID del documento
     * @returns {Promise<void>}
     */
    async delete(collection, id) {
        try {
            await this.db.collection(collection).doc(id).delete();
        } catch (error) {
            console.error('Error al eliminar documento:', error);
            throw error;
        }
    }

    // ===== FIRESTORE - CONSULTAS AVANZADAS =====

    /**
     * Buscar documentos con texto
     * @param {string} collection - Nombre de la colección
     * @param {string} field - Campo donde buscar
     * @param {string} searchText - Texto a buscar
     * @returns {Promise<array>}
     */
    async search(collection, field, searchText) {
        try {
            const snapshot = await this.db.collection(collection)
                .where(field, '>=', searchText)
                .where(field, '<=', searchText + '\uf8ff')
                .get();

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error al buscar:', error);
            throw error;
        }
    }

    /**
     * Contar documentos en una colección
     * @param {string} collection - Nombre de la colección
     * @param {array} whereConditions - Condiciones opcionales
     * @returns {Promise<number>}
     */
    async count(collection, whereConditions = []) {
        try {
            let query = this.db.collection(collection);

            whereConditions.forEach(([field, operator, value]) => {
                query = query.where(field, operator, value);
            });

            const snapshot = await query.get();
            return snapshot.size;
        } catch (error) {
            console.error('Error al contar documentos:', error);
            throw error;
        }
    }

    /**
     * Paginación de documentos
     * @param {string} collection - Nombre de la colección
     * @param {object} options - Opciones de paginación
     * @returns {Promise<object>} - Documentos y último documento
     */
    async paginate(collection, options = {}) {
        try {
            const { orderBy = ['createdAt', 'desc'], limit = 20, startAfter = null } = options;
            
            let query = this.db.collection(collection)
                .orderBy(...orderBy)
                .limit(limit);

            if (startAfter) {
                query = query.startAfter(startAfter);
            }

            const snapshot = await query.get();
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const lastDoc = snapshot.docs[snapshot.docs.length - 1];

            return { docs, lastDoc };
        } catch (error) {
            console.error('Error en paginación:', error);
            throw error;
        }
    }

    // ===== FIRESTORE - TRANSACCIONES Y BATCH =====

    /**
     * Ejecutar múltiples operaciones en batch
     * @param {array} operations - Array de operaciones
     * @returns {Promise<void>}
     */
    async batch(operations) {
        try {
            const batch = this.db.batch();

            operations.forEach(({ type, collection, id, data }) => {
                const ref = this.db.collection(collection).doc(id);

                switch (type) {
                    case 'set':
                        batch.set(ref, data);
                        break;
                    case 'update':
                        batch.update(ref, data);
                        break;
                    case 'delete':
                        batch.delete(ref);
                        break;
                }
            });

            await batch.commit();
        } catch (error) {
            console.error('Error en batch:', error);
            throw error;
        }
    }

    // ===== STORAGE (si está disponible) =====

    /**
     * Subir archivo a Storage
     * @param {File} file - Archivo a subir
     * @param {string} path - Ruta en Storage
     * @param {function} onProgress - Callback de progreso
     * @returns {Promise<string>} - URL de descarga
     */
    async uploadFile(file, path, onProgress = null) {
        if (!this.storage) {
            throw new Error('Firebase Storage no está configurado');
        }

        try {
            const storageRef = this.storage.ref();
            const fileRef = storageRef.child(path);
            const uploadTask = fileRef.put(file);

            return new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        if (onProgress) onProgress(progress);
                    },
                    (error) => reject(error),
                    async () => {
                        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                        resolve(downloadURL);
                    }
                );
            });
        } catch (error) {
            console.error('Error al subir archivo:', error);
            throw error;
        }
    }

    /**
     * Eliminar archivo de Storage
     * @param {string} path - Ruta del archivo
     * @returns {Promise<void>}
     */
    async deleteFile(path) {
        if (!this.storage) {
            throw new Error('Firebase Storage no está configurado');
        }

        try {
            const storageRef = this.storage.ref();
            const fileRef = storageRef.child(path);
            await fileRef.delete();
        } catch (error) {
            console.error('Error al eliminar archivo:', error);
            throw error;
        }
    }

    // ===== LISTENERS EN TIEMPO REAL =====

    /**
     * Escuchar cambios en un documento
     * @param {string} collection - Nombre de la colección
     * @param {string} id - ID del documento
     * @param {function} callback - Función a ejecutar en cambios
     * @returns {function} - Función para detener el listener
     */
    onDocumentChange(collection, id, callback) {
        return this.db.collection(collection).doc(id).onSnapshot((doc) => {
            if (doc.exists) {
                callback({ id: doc.id, ...doc.data() });
            } else {
                callback(null);
            }
        }, (error) => {
            console.error('Error en listener:', error);
        });
    }

    /**
     * Escuchar cambios en una colección
     * @param {string} collection - Nombre de la colección
     * @param {function} callback - Función a ejecutar en cambios
     * @param {object} options - Opciones de consulta
     * @returns {function} - Función para detener el listener
     */
    onCollectionChange(collection, callback, options = {}) {
        let query = this.db.collection(collection);

        if (options.where) {
            options.where.forEach(([field, operator, value]) => {
                query = query.where(field, operator, value);
            });
        }

        if (options.orderBy) {
            const [field, direction = 'asc'] = options.orderBy;
            query = query.orderBy(field, direction);
        }

        if (options.limit) {
            query = query.limit(options.limit);
        }

        return query.onSnapshot((snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(docs);
        }, (error) => {
            console.error('Error en listener:', error);
        });
    }

    /**
     * Alias para onCollectionChange (compatibilidad)
     * @param {string} collection - Nombre de la colección
     * @param {function} callback - Función a ejecutar en cambios
     * @param {function|object} errorCallbackOrOptions - Callback de error o opciones
     * @param {object} options - Opciones de consulta (si segundo param es callback)
     * @returns {function} - Función para detener el listener
     */
    onSnapshot(collection, callback, errorCallbackOrOptions = {}, options = {}) {
        // Detectar si el tercer parámetro es función (error callback) u objeto (options)
        let errorCallback = null;
        let queryOptions = {};

        if (typeof errorCallbackOrOptions === 'function') {
            errorCallback = errorCallbackOrOptions;
            queryOptions = options;
        } else {
            queryOptions = errorCallbackOrOptions;
        }

        let query = this.db.collection(collection);

        if (queryOptions.where) {
            queryOptions.where.forEach(([field, operator, value]) => {
                query = query.where(field, operator, value);
            });
        }

        if (queryOptions.orderBy) {
            const [field, direction = 'asc'] = queryOptions.orderBy;
            query = query.orderBy(field, direction);
        }

        if (queryOptions.limit) {
            query = query.limit(queryOptions.limit);
        }

        return query.onSnapshot((snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(docs);
        }, (error) => {
            console.error('Error en listener:', error);
            if (errorCallback) {
                errorCallback(error);
            }
        });
    }

    /**
     * Verificar si existe un documento con una condición where
     * @param {string} collection - Nombre de la colección
     * @param {string} field - Campo a verificar
     * @param {string} operator - Operador de comparación
     * @param {any} value - Valor a comparar
     * @returns {Promise<boolean>}
     */
    async existsWhere(collection, field, operator, value) {
        try {
            const snapshot = await this.db.collection(collection)
                .where(field, operator, value)
                .limit(1)
                .get();
            return !snapshot.empty;
        } catch (error) {
            console.error('Error al verificar existencia con where:', error);
            return false;
        }
    }

    // ===== UTILIDADES =====

    /**
     * Verificar si existe un documento
     * @param {string} collection - Nombre de la colección
     * @param {string} id - ID del documento
     * @returns {Promise<boolean>}
     */
    async exists(collection, id) {
        try {
            const doc = await this.db.collection(collection).doc(id).get();
            return doc.exists;
        } catch (error) {
            console.error('Error al verificar existencia:', error);
            return false;
        }
    }

    /**
     * Generar ID único
     * @param {string} collection - Nombre de la colección
     * @returns {string}
     */
    generateId(collection) {
        return this.db.collection(collection).doc().id;
    }

    /**
     * Obtener timestamp del servidor
     * @returns {FieldValue}
     */
    serverTimestamp() {
        return firebase.firestore.FieldValue.serverTimestamp();
    }

    /**
     * Incrementar valor numérico
     * @param {number} value - Valor a incrementar
     * @returns {FieldValue}
     */
    increment(value) {
        return firebase.firestore.FieldValue.increment(value);
    }

    /**
     * Agregar elemento a array
     * @param {any} element - Elemento a agregar
     * @returns {FieldValue}
     */
    arrayUnion(element) {
        return firebase.firestore.FieldValue.arrayUnion(element);
    }

    /**
     * Remover elemento de array
     * @param {any} element - Elemento a remover
     * @returns {FieldValue}
     */
    arrayRemove(element) {
        return firebase.firestore.FieldValue.arrayRemove(element);
    }
}

// ===== INSTANCIA SINGLETON =====
let firebaseHelperInstance = null;

function getFirebaseHelper() {
    if (!firebaseHelperInstance) {
        firebaseHelperInstance = new FirebaseHelper();
    }
    return firebaseHelperInstance;
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.FirebaseHelper = FirebaseHelper;
    window.getFirebaseHelper = getFirebaseHelper;
}

console.log('🔥 Firebase Helpers cargado');

// ===== EJEMPLO DE USO =====
/*
const fb = getFirebaseHelper();

// Crear documento
const id = await fb.create('equipos', {
    nombre: 'Laptop HP',
    tipo: 'Laptop',
    estado: 'activo'
});

// Leer documento
const equipo = await fb.read('equipos', id);

// Leer todos con filtros
const equipos = await fb.readAll('equipos', {
    where: [['estado', '==', 'activo']],
    orderBy: ['nombre', 'asc'],
    limit: 10
});

// Actualizar
await fb.update('equipos', id, {
    estado: 'mantenimiento'
});

// Eliminar
await fb.delete('equipos', id);

// Buscar
const resultados = await fb.search('equipos', 'nombre', 'Laptop');

// Listener en tiempo real
const unsubscribe = fb.onCollectionChange('equipos', (equipos) => {
    console.log('Equipos actualizados:', equipos);
}, {
    where: [['estado', '==', 'activo']],
    orderBy: ['nombre', 'asc']
});

// Detener listener cuando sea necesario
unsubscribe();
*/