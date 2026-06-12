/**
 * PROCESO PRINCIPAL DE ELECTRON
 * Controla la ventana de la aplicación y gestiona la lectura/escritura 
 * directa de la base de datos JSON en el sistema de archivos local.
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Determinar la ruta de base de datos (portable al lado del ejecutable o proyecto)
const estaEmpaquetado = app.isPackaged;
const directorioBase = estaEmpaquetado ? path.dirname(app.getPath('exe')) : __dirname;
const directorioDatos = path.join(directorioBase, 'data');
const archivoEmpleados = path.join(directorioDatos, 'empleados.json');
const archivoMarcas = path.join(directorioDatos, 'marcas.json');

// Asegurar que la estructura de carpetas y archivos JSON exista e inicializar base de datos
function inicializarBaseDatos() {
    if (!fs.existsSync(directorioDatos)) {
        fs.mkdirSync(directorioDatos, { recursive: true });
    }

    // Comprobar si necesitamos inicializar o sobrescribir catálogo de empleados vacío
    let copiarEmpleados = false;
    if (!fs.existsSync(archivoEmpleados)) {
        copiarEmpleados = true;
    } else {
        try {
            const contenido = fs.readFileSync(archivoEmpleados, 'utf8').trim();
            if (contenido === '' || contenido === '{}' || contenido === '[]') {
                copiarEmpleados = true;
            }
        } catch (err) {
            copiarEmpleados = true;
        }
    }

    if (copiarEmpleados) {
        const rutaDefecto = path.join(__dirname, 'data', 'empleados.json');
        if (fs.existsSync(rutaDefecto)) {
            try {
                fs.copyFileSync(rutaDefecto, archivoEmpleados);
                console.log("Catálogo de empleados inicializado con éxito.");
            } catch (err) {
                console.error("Error al copiar empleados por defecto:", err);
                fs.writeFileSync(archivoEmpleados, JSON.stringify({}, null, 4), 'utf8');
            }
        } else {
            fs.writeFileSync(archivoEmpleados, JSON.stringify({}, null, 4), 'utf8');
        }
    }

    // Inicializar marcas si no existen
    if (!fs.existsSync(archivoMarcas)) {
        const rutaDefecto = path.join(__dirname, 'data', 'marcas.json');
        if (fs.existsSync(rutaDefecto)) {
            try {
                fs.copyFileSync(rutaDefecto, archivoMarcas);
            } catch (err) {
                console.error("Error al copiar marcas por defecto:", err);
                fs.writeFileSync(archivoMarcas, JSON.stringify([], null, 4), 'utf8');
            }
        } else {
            fs.writeFileSync(archivoMarcas, JSON.stringify([], null, 4), 'utf8');
        }
    }
}

// Inicializar base de datos
inicializarBaseDatos();

// ==========================================================================
// REGISTRO DE MANEJADORES IPC (APIS NATIVAS)
// ==========================================================================

// 1. Obtener todos los datos (empleados y marcas)
ipcMain.handle('obtener-datos', async () => {
    try {
        const empleadosBruto = fs.readFileSync(archivoEmpleados, 'utf8');
        const marcasBruto = fs.readFileSync(archivoMarcas, 'utf8');
        
        return {
            success: true,
            empleados: JSON.parse(empleadosBruto || '{}'),
            marcas: JSON.parse(marcasBruto || '[]')
        };
    } catch (error) {
        console.error('Error al leer base de datos:', error);
        return { success: false, error: error.message };
    }
});

// 2. Guardar o actualizar un empleado
ipcMain.handle('guardar-empleado', async (event, empleado) => {
    try {
        const empleados = JSON.parse(fs.readFileSync(archivoEmpleados, 'utf8') || '{}');
        const id = empleado.id.trim();
        
        empleados[id] = {
            nombre: empleado.nombre.toUpperCase().trim(),
            puesto: (empleado.puesto || 'CAPTURISTA').toUpperCase().trim(),
            turno: empleado.turno.toUpperCase().trim(),
            lugar: (empleado.lugar || 'VERSALLES').toUpperCase().trim()
        };
        
        fs.writeFileSync(archivoEmpleados, JSON.stringify(empleados, null, 4), 'utf8');
        return { success: true, empleados };
    } catch (error) {
        console.error('Error al guardar empleado:', error);
        return { success: false, error: error.message };
    }
});

// 3. Eliminar un empleado
ipcMain.handle('eliminar-empleado', async (event, id) => {
    try {
        const empleados = JSON.parse(fs.readFileSync(archivoEmpleados, 'utf8') || '{}');
        const idDestino = id.trim();
        
        if (empleados[idDestino]) {
            delete empleados[idDestino];
            fs.writeFileSync(archivoEmpleados, JSON.stringify(empleados, null, 4), 'utf8');
            return { success: true, empleados };
        } else {
            const llaveEncontrada = Object.keys(empleados).find(k => k.trim().toUpperCase() === idDestino.toUpperCase());
            if (llaveEncontrada) {
                delete empleados[llaveEncontrada];
                fs.writeFileSync(archivoEmpleados, JSON.stringify(empleados, null, 4), 'utf8');
                return { success: true, empleados };
            }
            return { success: false, error: 'Empleado no encontrado' };
        }
    } catch (error) {
        console.error('Error al eliminar empleado:', error);
        return { success: false, error: error.message };
    }
});

// 4. Subir y fusionar nuevas marcas de asistencia (Cargar Archivo)
ipcMain.handle('cargar-archivo', async (event, nuevasMarcas) => {
    try {
        if (!Array.isArray(nuevasMarcas)) {
            return { success: false, error: 'Las marcas deben ser un arreglo de objetos' };
        }

        const marcas = JSON.parse(fs.readFileSync(archivoMarcas, 'utf8') || '[]');
        
        // Crear mapa para búsquedas rápidas de duplicados (usuario|fechaHora)
        const registroBusqueda = {};
        marcas.forEach(m => {
            registroBusqueda[`${m.usuario.trim()}|${m.fechaHora.trim()}`] = true;
        });

        let cantidadAgregados = 0;
        nuevasMarcas.forEach(m => {
            if (!m.usuario || !m.fechaHora) return;
            
            const claveUsuario = m.usuario.trim();
            const claveFechaHora = m.fechaHora.trim();
            const llaveUnica = `${claveUsuario}|${claveFechaHora}`;

            if (!registroBusqueda[llaveUnica]) {
                marcas.push({
                    usuario: claveUsuario,
                    fechaHora: claveFechaHora
                });
                registroBusqueda[llaveUnica] = true;
                cantidadAgregados++;
            }
        });

        // Ordenar cronológicamente
        marcas.sort((a, b) => a.fechaHora.localeCompare(b.fechaHora));

        fs.writeFileSync(archivoMarcas, JSON.stringify(marcas, null, 4), 'utf8');
        
        return {
            success: true,
            added: cantidadAgregados,
            total: marcas.length,
            marcas
        };
    } catch (error) {
        console.error('Error al fusionar marcas:', error);
        return { success: false, error: error.message };
    }
});

// ==========================================================================
// CICLO DE VIDA DE LA APLICACIÓN
// ==========================================================================

function crearVentana() {
    const ventana = new BrowserWindow({
        width: 1280,
        height: 850,
        minWidth: 1024,
        minHeight: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        autoHideMenuBar: true,
        title: "Control de Asistencia - Escritorio",
        icon: path.join(__dirname, 'assets/icon.ico')
    });

    ventana.maximize();
    ventana.loadFile('index.html');
}

app.whenReady().then(() => {
    crearVentana();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            crearVentana();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
