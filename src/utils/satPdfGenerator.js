import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Genera un PDF estructurado de los datos de la Guía del SAT.
 * @param {string} tipoGuia - 'global' | 'moral'
 * @param {object} datos - Objeto con los datos calculados en pantalla
 * @param {object} config - Configuración del sistema (datos del negocio)
 */
export const exportarSatGuiaPDF = (tipoGuia, datos, config) => {
    try {
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
        const negocio = config?.negocio || { nombre: "FasTPV Generic", rfc: "XAXX010101000" };

        const purplePrimary = [109, 40, 217]; // #6d28d9 (Morado corporativo)
        const purpleSecondary = [124, 58, 237]; // #7c3aed
        const grayText = [100, 116, 139]; // Slate 500
        const grayLight = [248, 250, 252]; // Slate 50

        // --- ENCABEZADO BANNER ---
        doc.setFillColor(...purplePrimary);
        doc.rect(0, 0, 216, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text(negocio.nombre || "FasTPV", 15, 18);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`RFC: ${negocio.rfc || 'N/A'}`, 15, 25);
        if (negocio.regimen) {
            doc.text(`Régimen: ${negocio.regimen}`, 15, 30);
        }

        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("GUÍA FISCAL SAT", 201, 18, { align: 'right' });
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Fecha Emisión: ${new Date().toLocaleDateString()}`, 201, 25, { align: 'right' });
        
        const subTitleText = tipoGuia === 'global' ? "Factura Global Mensual (Público General)" : "Calculadora de Retenciones (Persona Moral)";
        doc.text(`Tipo Guía: ${subTitleText}`, 201, 30, { align: 'right' });

        let y = 50;

        // --- DATOS DEL EMISOR ---
        doc.setTextColor(...purplePrimary);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("1. DATOS DEL EMISOR (TUS DATOS)", 15, y);
        doc.setDrawColor(200);
        doc.setLineWidth(0.3);
        doc.line(15, y + 2, 201, y + 2);

        y += 8;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("RFC Emisor:", 15, y);
        doc.setFont("helvetica", "normal");
        doc.text(negocio.rfc || "N/A", 45, y);

        doc.setFont("helvetica", "bold");
        doc.text("Régimen Fiscal:", 100, y);
        doc.setFont("helvetica", "normal");
        doc.text(negocio.regimen || "No seleccionado", 130, y);

        y += 5;
        doc.setFont("helvetica", "bold");
        doc.text("Dirección:", 15, y);
        doc.setFont("helvetica", "normal");
        const dirText = `${negocio.direccion || ''} ${negocio.lugarExpedicion ? '- ' + negocio.lugarExpedicion : ''}`.trim() || 'No especificada';
        doc.text(dirText, 45, y);

        y += 12;

        if (tipoGuia === 'global') {
            // --- DATOS DEL RECEPTOR ---
            doc.setTextColor(...purplePrimary);
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text("2. DATOS DEL RECEPTOR (FACTURA GLOBAL)", 15, y);
            doc.line(15, y + 2, 201, y + 2);

            y += 8;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(9);
            
            doc.setFont("helvetica", "bold");
            doc.text("RFC Receptor:", 15, y);
            doc.setFont("helvetica", "normal");
            doc.text("XAXX010101000", 45, y);

            doc.setFont("helvetica", "bold");
            doc.text("Razón Social:", 100, y);
            doc.setFont("helvetica", "normal");
            doc.text("PUBLICO EN GENERAL", 130, y);

            y += 5;
            doc.setFont("helvetica", "bold");
            doc.text("Régimen Fiscal:", 15, y);
            doc.setFont("helvetica", "normal");
            doc.text("616 - Sin obligaciones fiscales", 45, y);

            doc.setFont("helvetica", "bold");
            doc.text("Uso CFDI:", 100, y);
            doc.setFont("helvetica", "normal");
            doc.text("S01 - Sin efectos fiscales", 130, y);

            y += 5;
            doc.setFont("helvetica", "bold");
            doc.text("Código Postal:", 15, y);
            doc.setFont("helvetica", "normal");
            doc.text("Mismo del Emisor (Tu sucursal)", 45, y);

            y += 12;

            // --- MONTOS A DECLARAR ---
            doc.setTextColor(...purplePrimary);
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text("3. IMPORTES Y MONTOS A REPORTAR (NODOS)", 15, y);
            doc.line(15, y + 2, 201, y + 2);

            const tableData = [
                ["Número de Tickets", `${datos.cantidadTickets}`, "Cantidad de tickets que no han sido facturados individualmente este mes."],
                ["Subtotal (Base)", `$ ${datos.subtotal.toFixed(2)}`, "Ingresar en la base gravable de la factura global del SAT."],
                ["IVA Trasladado (16%)", `$ ${datos.iva.toFixed(2)}`, "Impuesto trasladado correspondiente al 16% de IVA."],
                ["Total Factura", `$ ${datos.totalNeto.toFixed(2)}`, "Monto total a facturar (Suma de Subtotal + IVA)."]
            ];

            doc.autoTable({
                startY: y + 5,
                head: [['Campo / Concepto', 'Valor a Ingresar en SAT', 'Instrucción o Descripción']],
                body: tableData,
                theme: 'striped',
                styles: { fontSize: 9, cellPadding: 3.5, font: 'helvetica' },
                headStyles: { fillColor: purplePrimary, textColor: [255, 255, 255], fontStyle: 'bold' },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 50 },
                    1: { fontStyle: 'bold', halign: 'right', cellWidth: 45, textColor: purpleSecondary },
                    2: { cellWidth: 91 }
                }
            });

            y = doc.lastAutoTable.finalY + 12;

            // --- INSTRUCCIONES PORTAL SAT ---
            doc.setFillColor(...grayLight);
            doc.rect(15, y, 186, 25, 'F');
            doc.setDrawColor(220);
            doc.rect(15, y, 186, 25, 'S');

            doc.setTextColor(...purplePrimary);
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("INSTRUCCIONES IMPORTANTES DEL PORTAL SAT:", 18, y + 6);

            doc.setTextColor(50, 50, 50);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            const line1 = "- En el portal de facturación del SAT, selecciona la opción de Factura Global.";
            const line2 = "- Agrega un concepto por cada ticket (nodos individuales) con el número de folio correspondiente en la descripción,";
            const line3 = "  o bien, agrúpalos según la regla vigente de la Miscelánea Fiscal.";
            doc.text(line1, 18, y + 11);
            doc.text(line2, 18, y + 16);
            doc.text(line3, 18, y + 20);

        } else {
            // --- DETALLE RETENCIONES (PERSONA MORAL) ---
            doc.setTextColor(...purplePrimary);
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text("2. CÁLCULO DE RETENCIONES Y DESGLOSE", 15, y);
            doc.line(15, y + 2, 201, y + 2);

            const tableData = [
                ["Monto del Servicio", `$ ${parseFloat(datos.montoManual || 0).toFixed(2)}`, datos.incluyeIVA ? "Monto base proporcionado (IVA incluido)" : "Monto base proporcionado (Subtotal neto)"],
                ["Subtotal", `$ ${datos.subtotal.toFixed(2)}`, "Importe base antes de impuestos y retenciones."],
                ["IVA Trasladado (16%)", `$ ${datos.iva.toFixed(2)}`, "Impuesto al Valor Agregado del 16%."],
                ["Retención ISR (1.25%)", `-$ ${datos.retISR.toFixed(2)}`, "Retención del 1.25% de ISR aplicable por RESICO a Persona Moral."],
                ["Total Neto a Pagar", `$ ${datos.totalPagar.toFixed(2)}`, "Monto final que la Persona Moral debe transferir o pagar."]
            ];

            doc.autoTable({
                startY: y + 5,
                head: [['Concepto / Impuesto', 'Importe', 'Descripción / Detalle']],
                body: tableData,
                theme: 'striped',
                styles: { fontSize: 9, cellPadding: 3.5, font: 'helvetica' },
                headStyles: { fillColor: purplePrimary, textColor: [255, 255, 255], fontStyle: 'bold' },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 50 },
                    1: { fontStyle: 'bold', halign: 'right', cellWidth: 45, textColor: purpleSecondary },
                    2: { cellWidth: 91 }
                }
            });

            y = doc.lastAutoTable.finalY + 12;

            // --- INSTRUCCIONES PORTAL SAT ---
            doc.setFillColor(...grayLight);
            doc.rect(15, y, 186, 25, 'F');
            doc.setDrawColor(220);
            doc.rect(15, y, 186, 25, 'S');

            doc.setTextColor(...purplePrimary);
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("INSTRUCCIONES IMPORTANTES PARA RESICO Y RETENCIONES:", 18, y + 6);

            doc.setTextColor(50, 50, 50);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            const line1 = "- Al facturar a una Persona Moral siendo Persona Física en RESICO, debes configurar la retención de ISR.";
            const line2 = "- La retención de ISR es del 1.25% del subtotal (monto base antes de IVA).";
            const line3 = "- Asegúrate de registrar correctamente la retención en el portal del SAT para evitar discrepancias fiscales.";
            doc.text(line1, 18, y + 11);
            doc.text(line2, 18, y + 16);
            doc.text(line3, 18, y + 20);
        }

        // --- PIE DE PÁGINA ---
        doc.setTextColor(...grayText);
        doc.setFontSize(8);
        doc.setFont("helvetica", "oblique");
        doc.text("Este documento es una guía de control interno generada por FasTPV. No representa un CFDI oficial ni sustituye la declaración en el SAT.", 108, 270, { align: 'center' });
        doc.text("FasTPV Pro - Sistema de Punto de Venta Inteligente", 108, 274, { align: 'center' });

        // Guardar archivo
        const fileName = tipoGuia === 'global' ? 'Guia_Factura_Global_SAT.pdf' : 'Guia_Calculadora_Retenciones_SAT.pdf';
        doc.save(fileName);
        return true;
    } catch (e) {
        console.error("Error al exportar PDF del SAT:", e);
        throw e;
    }
};
