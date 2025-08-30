// Firebase Configuration for WINZAP
// Configuración de Firebase para base de datos en la nube

// Configuración Firebase (necesitas crear proyecto en Firebase Console)
const firebaseConfig = {
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "winzap-platform.firebaseapp.com",
    databaseURL: "https://winzap-platform-default-rtdb.firebaseio.com",
    projectId: "winzap-platform",
    storageBucket: "winzap-platform.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

class FirebaseManager {
    constructor() {
        this.db = null;
        this.storage = null;
        this.initialized = false;
    }

    async init() {
        try {
            // Importar Firebase modules
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js');
            const { getDatabase, ref, push, set, onValue, remove } = await import('https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js');
            const { getStorage, ref: storageRef, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js');

            // Inicializar Firebase
            const app = initializeApp(firebaseConfig);
            this.db = getDatabase(app);
            this.storage = getStorage(app);
            this.initialized = true;

            console.log('✅ Firebase inicializado correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error inicializando Firebase:', error);
            return false;
        }
    }

    // Subir archivo a Firebase Storage
    async uploadFile(file, fileName) {
        if (!this.initialized) return null;
        
        try {
            const { ref: storageRef, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js');
            
            const fileRef = storageRef(this.storage, `files/${fileName}`);
            const snapshot = await uploadBytes(fileRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            return downloadURL;
        } catch (error) {
            console.error('Error subiendo archivo:', error);
            return null;
        }
    }

    // Subir imagen a Firebase Storage
    async uploadImage(imageFile, imageName) {
        if (!this.initialized) return null;
        
        try {
            const { ref: storageRef, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js');
            
            const imageRef = storageRef(this.storage, `images/${imageName}`);
            const snapshot = await uploadBytes(imageRef, imageFile);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            return downloadURL;
        } catch (error) {
            console.error('Error subiendo imagen:', error);
            return null;
        }
    }

    // Guardar metadatos del archivo en Realtime Database
    async saveFileMetadata(fileData) {
        if (!this.initialized) return null;
        
        try {
            const { ref, push } = await import('https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js');
            
            const filesRef = ref(this.db, 'files');
            const newFileRef = await push(filesRef, fileData);
            
            return newFileRef.key;
        } catch (error) {
            console.error('Error guardando metadatos:', error);
            return null;
        }
    }

    // Obtener todos los archivos
    async getFiles(callback) {
        if (!this.initialized) return;
        
        try {
            const { ref, onValue } = await import('https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js');
            
            const filesRef = ref(this.db, 'files');
            onValue(filesRef, (snapshot) => {
                const data = snapshot.val();
                const files = data ? Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                })) : [];
                callback(files);
            });
        } catch (error) {
            console.error('Error obteniendo archivos:', error);
            callback([]);
        }
    }

    // Eliminar archivo
    async deleteFile(fileId) {
        if (!this.initialized) return false;
        
        try {
            const { ref, remove } = await import('https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js');
            
            const fileRef = ref(this.db, `files/${fileId}`);
            await remove(fileRef);
            
            return true;
        } catch (error) {
            console.error('Error eliminando archivo:', error);
            return false;
        }
    }

    // Actualizar estadísticas
    async updateStats(stats) {
        if (!this.initialized) return;
        
        try {
            const { ref, set } = await import('https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js');
            
            const statsRef = ref(this.db, 'stats');
            await set(statsRef, stats);
        } catch (error) {
            console.error('Error actualizando estadísticas:', error);
        }
    }

    // Obtener estadísticas
    async getStats(callback) {
        if (!this.initialized) return;
        
        try {
            const { ref, onValue } = await import('https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js');
            
            const statsRef = ref(this.db, 'stats');
            onValue(statsRef, (snapshot) => {
                const stats = snapshot.val() || {
                    totalFiles: 0,
                    totalDownloads: 0,
                    visitorsToday: 0
                };
                callback(stats);
            });
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            callback({
                totalFiles: 0,
                totalDownloads: 0,
                visitorsToday: 0
            });
        }
    }
}

// Exportar para uso global
window.FirebaseManager = FirebaseManager;
