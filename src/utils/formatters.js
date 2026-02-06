// src/utils/formatters.js
export const numeroALetras = (amount) => {
    const Unidades = num => ["", "UN ", "DOS ", "TRES ", "CUATRO ", "CINCO ", "SEIS ", "SIETE ", "OCHO ", "NUEVE "][num];
    const Decenas = num => {
        const dec = Math.floor(num / 10);
        const uni = num - (dec * 10);
        switch (dec) {
            case 1: return uni < 6 ? ["DIEZ ", "ONCE ", "DOCE ", "TRECE ", "CATORCE ", "QUINCE "][uni] : "DIECI" + Unidades(uni);
            case 2: return uni === 0 ? "VEINTE " : "VEINTI" + Unidades(uni);
            case 3: return Unidades(uni) ? "TREINTA Y " + Unidades(uni) : "TREINTA ";
            case 4: return Unidades(uni) ? "CUARENTA Y " + Unidades(uni) : "CUARENTA ";
            case 5: return Unidades(uni) ? "CINCUENTA Y " + Unidades(uni) : "CINCUENTA ";
            case 6: return Unidades(uni) ? "SESENTA Y " + Unidades(uni) : "SESENTA ";
            case 7: return Unidades(uni) ? "SETENTA Y " + Unidades(uni) : "SETENTA ";
            case 8: return Unidades(uni) ? "OCHENTA Y " + Unidades(uni) : "OCHENTA ";
            case 9: return Unidades(uni) ? "NOVENTA Y " + Unidades(uni) : "NOVENTA ";
            case 0: return Unidades(uni);
        }
    };
    const Centenas = num => {
        const cen = Math.floor(num / 100);
        const resto = num - (cen * 100);
        if (cen === 1) return resto > 0 ? "CIENTO " + Decenas(resto) : "CIEN ";
        return ["", "CIENTO ", "DOSCIENTOS ", "TRESCIENTOS ", "CUATROCIENTOS ", "QUINIENTOS ", "SEISCIENTOS ", "SETECIENTOS ", "OCHOCIENTOS ", "NOVECIENTOS "][cen] + Decenas(resto);
    };

    const pesos = Math.floor(amount);
    const centavos = Math.round((amount - pesos) * 100);
    let letras = "";

    if (pesos === 0) letras = "CERO ";
    else if (pesos < 100) letras = Decenas(pesos);
    else if (pesos < 1000) letras = Centenas(pesos);
    else if (pesos < 2000) letras = "MIL " + Centenas(pesos % 1000);
    else if (pesos < 1000000) letras = Centenas(Math.floor(pesos / 1000)) + " MIL " + Centenas(pesos % 1000);

    return `${letras.trim()} PESOS ${centavos.toString().padStart(2, '0')}/100 M.N.`;
};
