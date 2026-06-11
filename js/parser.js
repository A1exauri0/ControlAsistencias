/**
 * Analiza el contenido del archivo de marcas (TXT tabulado)
 * y devuelve una lista de objetos con el código del usuario y la fecha/hora.
 */
function analizarTXT(texto) {
    const lineas = texto
        .split(/\r?\n/)
        .filter(l => l.trim());

    const registros = [];

    for (let i = 1; i < lineas.length; i++) {
        const columnas = lineas[i]
            .split("\t")
            .map(c => c.trim());

        if (columnas.length < 7) continue;

        const usuario = columnas[3];
        const fechaHora = columnas[6];

        if (!usuario || !fechaHora) {
            continue;
        }

        registros.push({
            usuario,
            fechaHora
        });
    }

    return registros;
}
