export const generarFolio = (config, ventasExistentes) => {
    const { prefijo = 'UT', incluirFecha = true, tipoSecuencia = 'consecutivo', longitudSecuencia = 3 } = config.folioConfig || {};
    
    const now = new Date();
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const anio = String(now.getFullYear()).slice(-2);
    
    const parteFecha = incluirFecha ? `${dia}${mes}${anio}` : '';
    const base = `${prefijo}${prefijo && parteFecha ? '-' : ''}${parteFecha}`;
    
    let secuencia = '';

    if (tipoSecuencia === 'aleatorio') {
        // Generar número aleatorio de N dígitos
        const min = Math.pow(10, longitudSecuencia - 1);
        const max = Math.pow(10, longitudSecuencia) - 1;
        const num = Math.floor(min + Math.random() * (max - min + 1));
        secuencia = String(num);
    } else {
        // Consecutivo
        // Buscar ventas que empiecen con la misma base para encontrar el último consecutivo
        // Si tiene fecha, el consecutivo se reinicia diariamente (implícito al filtrar por base con fecha)
        // Si no tiene fecha, es global.
        const regex = new RegExp(`^${base}-(\\d{${longitudSecuencia}})$`);
        
        let maxSec = 0;
        ventasExistentes.forEach(v => {
            if (v.folio) {
                const match = v.folio.match(regex);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxSec) maxSec = num;
                }
            }
        });
        
        secuencia = String(maxSec + 1).padStart(longitudSecuencia, '0');
    }

    return `${base}-${secuencia}`;
};