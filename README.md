# Control de Asistencia - Sistema Portable

Este es un sistema local, dinámico y portable para procesar marcas de asistencia obtenidas de terminales biométricas (archivos en formato `.txt`). 

El proyecto está diseñado para funcionar en entornos locales como **Laragon** o cualquier servidor web compatible con PHP 8.1+. Utiliza archivos JSON como base de datos local para máxima portabilidad, permitiendo copiar y mover el proyecto completo sin configuraciones de bases de datos tradicionales.

## Características Principales

1. **Catálogo de Empleados Dinámico**: Añade, edita y elimina empleados directamente desde la interfaz web.
2. **Historial de Marcas Acumulativo**: Carga archivos `AGL_001.TXT` periódicamente. El sistema fusiona las nuevas marcas con el historial existente de forma automática, evitando duplicados.
3. **Detección de Personal no Registrado**: Si el archivo TXT contiene marcas de un empleado que no está en el catálogo, se resalta en la tabla y se proporciona un botón de registro rápido pre-llenado con su ID/siglas.
4. **Cálculo Inteligente de Turnos**: 
   - Procesa la asistencia calculando la entrada y la salida de acuerdo al turno (Matutino, Vespertino, Nocturno).
   - Ajusta automáticamente las marcas del turno nocturno para registrar correctamente la asistencia en el día laboral correspondiente.
5. **Exportación a Excel**: Descarga reportes completos con filtros aplicados directamente en formato `.xlsx`.
6. **Interfaz Premium**: Diseño visual de alta fidelidad, soporte nativo de Modo Oscuro, transiciones suaves y visualización de estadísticas en tiempo real en un Dashboard responsivo.

## Estructura de Archivos del Proyecto

- `index.php`: Interfaz web principal (Dashboard, Reportes, Empleados).
- `api.php`: Backend de servicios REST (operaciones CRUD en JSON e importación de TXT).
- `css/styles.css`: Estilos personalizados, paleta de colores moderna y soporte de tema oscuro.
- `js/`:
  - `app.js`: Controlador de la aplicación, manejo de pestañas, modales y lógica del frontend.
  - `asistencia.js`: Lógica y algoritmos de procesamiento de asistencia (entradas/salidas, turno nocturno).
  - `parser.js`: Utilidad para la lectura y división de columnas del archivo TXT.
- `data/`:
  - `employees.json`: Catálogo de empleados en formato JSON.
  - `punches.json`: Historial de marcas guardadas en formato JSON.

## Instalación y Uso Local (Laragon)

1. Coloca esta carpeta en tu directorio raíz de Laragon (generalmente `C:\laragon\www\ControlAsistencias`).
2. Inicia los servicios de Laragon.
3. Abre tu navegador e ingresa a `http://localhost/ControlAsistencias/` o a la URL virtual autogenerada por Laragon (ej: `http://controlasistencias.test`).
4. Sube tu archivo `.txt` de asistencia desde la pestaña **Subir Asistencias**.
5. ¡Listo! Visualiza el Dashboard, edita empleados o exporta los reportes a Excel.

---
*Desarrollado con enfoque en simplicidad, rendimiento y diseño moderno.*