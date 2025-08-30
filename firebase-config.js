// Firebase Configuration for WINZAP
// Configuración de Firebase para base de datos en la nube

// Configuración Firebase - Proyecto winzap-platform
const firebaseConfig = {
    apiKey: "AIzaSyDMkxufy28KpSWQqMxVqaT73BRUQDBzCXw",
    authDomain: "winzap-platform.firebaseapp.com",
    projectId: "winzap-platform",
    storageBucket: "winzap-platform.firebasestorage.app",
    messagingSenderId: "1062749277641",
    appId: "1:1062749277641:web:b98161c61d754614c7ec18",
    measurementId: "G-9JXH5L6DTM"
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
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js');
            const { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js');
            const { getStorage, ref: storageRef, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js');

            // Inicializar Firebase
            const app = initializeApp(firebaseConfig);
            this.db = getFirestore(app);
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

    // Guardar metadatos del archivo en Firestore
    async saveFileMetadata(fileData) {
        if (!this.initialized) return null;
        
        try {
            const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js');
            
            const filesCollection = collection(this.db, 'files');
            const docRef = await addDoc(filesCollection, fileData);
            
            return docRef.id;
        } catch (error) {
            console.error('Error guardando metadatos:', error);
            return null;
        }
    }

    // Obtener todos los archivos
    async getFiles(callback) {
        if (!this.initialized) return;
        
        try {
            const { collection, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js');
            
            const filesCollection = collection(this.db, 'files');
            onSnapshot(filesCollection, (snapshot) => {
                const files = [];
                snapshot.forEach((doc) => {
                    files.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
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
            const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js');
            
            const fileRef = doc(this.db, 'files', fileId);
            await deleteDoc(fileRef);
            
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
            const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js');
            
            const statsRef = doc(this.db, 'stats', 'global');
            await setDoc(statsRef, stats);
        } catch (error) {
            console.error('Error actualizando estadísticas:', error);
        }
    }

    // Obtener estadísticas
    async getStats(callback) {
        if (!this.initialized) return;
        
        try {
            const { doc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js');
            
            const statsRef = doc(this.db, 'stats', 'global');
            onSnapshot(statsRef, (snapshot) => {
                const stats = snapshot.exists() ? snapshot.data() : {
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
