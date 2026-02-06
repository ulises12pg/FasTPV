export const SISTEMA = "FasTPV v1.0";
export const COLOR_CORP = "bg-slate-900 text-white shadow-lg border-b border-slate-800 transition-colors duration-300";
export const RATIO_PUNTOS = 10;

export const USUARIOS_DEFAULT = [
    { id: 1, nombre: 'Administrador', pin: '1234', rol: 'admin' },
    { id: 2, nombre: 'Empleado Turno 1', pin: '0000', rol: 'empleado' }
];

export const CLIENTES_INICIALES = [{ id: 1, nombre: 'Público General', puntos: 0, cupones: [] }];

export const EQUIPOS_INICIALES = [
    { id: 1, tipo: 'PC', nombre: 'Estación 01', estado: 'libre', precioHora: 15.00 },
    { id: 2, tipo: 'PC', nombre: 'Estación 02', estado: 'libre', precioHora: 15.00 },
    { id: 3, tipo: 'PC', nombre: 'Estación 03', estado: 'libre', precioHora: 15.00 },
    { id: 4, tipo: 'PC', nombre: 'Estación 04', estado: 'libre', precioHora: 15.00 },
    { id: 5, tipo: 'CONSOLA', nombre: 'Xbox Series S', estado: 'libre', precioHora: 20.00 },
    { id: 6, tipo: 'CONSOLA', nombre: 'PlayStation 5', estado: 'libre', precioHora: 20.00 },
];

export const PRODUCTOS_BASE_DEFAULT = [
    { id: 1, nombre: 'Coca Cola 600ml', precio: 18.00, icon: '🥤', stock: 24, categoria: 'Bebidas', codigo: '7501055300075' },
    { id: 2, nombre: 'Papas Sabritas', precio: 16.00, icon: '🍟', stock: 15, categoria: 'Snacks', codigo: '7501011123456' },
];

export const CONFIG_INICIAL = {
    tarifaMinima: 5.00,
    formatoTicket: '58mm', // '58mm' o 'LETTER'
    negocio: {
        nombre: "FasTPV Generic",
        rfc: "XAXX010101000",
        regimen: "Régimen General de Ley",
        direccion: "Calle Conocida S/N, Centro",
        lugarExpedicion: "México"
    },
    ticketConfig: {
        headers: { cant: 'Cant', desc: 'Desc', pu: 'P.U.', importe: 'Importe' },
        separador: '-',
        mensajeFinal: '¡Gracias por su preferencia!'
    },
    folioConfig: {
        prefijo: 'UT',
        incluirFecha: true, // DDMMYY
        tipoSecuencia: 'consecutivo', // 'consecutivo' o 'aleatorio'
        longitudSecuencia: 3 // Ej: 001
    },
    precios: {
        impresion: {
            bn: { B: 2.00, M: 5.00, G: 8.00 },
            color: { B: 3.00, M: 7.00, G: 12.00 }
        },
        extras: {
            oficio: 1.00, // Se suma
            tabloide: 2.00 // Se multiplica
        },
        otros: {
            escaneo: { carta: 4.00, oficio: 5.00 },
            envio: 5.00,
            wifi: 10.00,
            asesoria: 15.00
        }
    }
};