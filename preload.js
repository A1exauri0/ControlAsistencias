/**
 * SCRIPT PRELOADER DE ELECTRON
 * Expone de forma segura interfaces de Node al frontend de manera aislada.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Exponer la API segura al objeto global 'window.api'
contextBridge.exposeInMainWorld('api', {
    // Obtener catálogo e historial
    obtenerDatos: () => ipcRenderer.invoke('obtener-datos'),
    
    // CRUD Empleados
    guardarEmpleado: (empleado) => ipcRenderer.invoke('guardar-empleado', empleado),
    eliminarEmpleado: (id) => ipcRenderer.invoke('eliminar-empleado', id),
    
    // Fusión de marcas biométricas
    cargarArchivo: (nuevosRegistros) => ipcRenderer.invoke('cargar-archivo', nuevosRegistros)
});
