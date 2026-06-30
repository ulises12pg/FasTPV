# FasTPV
> **Precisión Temporal. Control Total.**

---

## 📋 Resumen Ejecutivo
**FasTPV** es una solución integral de software diseñada para la gestión, monitoreo y cobro automatizado de activos basados en tiempo. Desarrollado para eliminar las pérdidas operativas y el error humano, FasTPV transforma la administración de consolas, simuladores y estaciones de trabajo en un proceso centralizado, seguro y auditable. 

*No solo mide el tiempo; asegura la rentabilidad de cada minuto.*

---

## ✨ Características Principales (Enfoque de Valor)

*   **Gestión Centralizada de Activos:** Control total desde un único panel administrativo (Dashboard). Visualice en tiempo real qué estaciones están activas, en pausa o disponibles, optimizando el flujo de clientes y reduciendo tiempos muertos.
*   **Automatización de Acceso y Energía:** Integración directa con hardware para el bloqueo de pantalla o corte de energía automático al finalizar la sesión prepagada, garantizando que *"tiempo no pagado es tiempo no consumido"*.
*   **Esquemas Tarifarios Dinámicos:** Configuración flexible para tarifas por fracción, hora, promociones automáticas por volumen ("Happy Hour") y membresías, adaptándose a cualquier modelo de negocio.
*   **Auditoría y Seguridad Financiera:** Módulo de reportes detallados que cruza los tiempos de uso de los equipos con los ingresos en caja, eliminando fugas de dinero y "falsos tiempos muertos" por parte de los operadores.
*   **Gestión Fiscal Integrada (SAT):** Módulo especializado de facturación que permite calcular la factura global mensual para Público en General, así como retenciones de ISR (1.25%) para Personas Morales (RESICO), permitiendo exportar guías de declaración en PDF listas para el portal tributario.

---

## 🎯 Aplicaciones de Mercado
Ideal para entornos de alto tráfico que requieren facturación precisa por uso:
1.  **Centros de Entretenimiento Digital y E-Sports Arenas.**
2.  **Salones de Simulación (VR/Racing) de alta gama.**
3.  **Espacios de Coworking** con renta de hardware especializado.

---

# 📖 Manual de Usuario

### 🖥️ 1. Panel de Control (Dashboard)
El dashboard principal muestra la cuadrícula de tus dispositivos (consolas, PC, simuladores, etc.):
*   **Iniciar Tiempo Libre:** El dispositivo inicia un cronómetro acumulador y el cobro se realiza al finalizar la sesión basado en la tarifa configurada.
*   **Iniciar Tiempo Prepagado:** El usuario paga un monto fijo o tiempo determinado. La sesión se detiene automáticamente al cumplirse el plazo.
*   **Pausar/Reanudar:** Permite detener temporalmente el conteo de tiempo en caso de interrupciones del servicio.

### 💰 2. Control de Caja e Historial
*   **Cortes de Caja:** Registre el inicio y fin de turnos. El sistema calcula automáticamente el total esperado cruzando el tiempo consumido de cada equipo con los ingresos de productos y rentas.
*   **Historial de Ventas:** Acceda a la bitácora completa de tickets emitidos, reimprima comprobantes o consulte folios.

### 🏛️ 3. Guía de Facturación SAT
Ubicada en el menú de **Historial** (`Guía SAT`), esta sección te ayuda a mantener tus obligaciones fiscales al día:
1.  **Factura Global Mensual:**
    *   Filtra automáticamente los tickets no facturados del mes corriente.
    *   Muestra los datos requeridos por el portal del SAT para el receptor global (`RFC: XAXX010101000`, `PUBLICO EN GENERAL`, `Uso CFDI: S01`, `Régimen: 616`).
    *   Desglosa automáticamente el Subtotal (Base) e IVA Trasladado (16%).
2.  **Calculadora de Retenciones (Persona Moral):**
    *   Permite ingresar montos de servicios prestados a personas morales.
    *   Calcula automáticamente el IVA Trasladado y la retención del **1.25% de ISR** aplicable para RESICO.
3.  **Exportación a PDF:**
    *   Presiona el botón **Exportar PDF** en el encabezado para descargar una hoja de guía fiscal en PDF con los importes, datos del emisor, receptor y la guía de llenado paso a paso para el portal del SAT.

---

# 🛠️ Manual Técnico

FasTPV está desarrollado como una aplicación de escritorio híbrida que combina la potencia del ecosistema Web moderno con el acceso a bajo nivel de sistemas operativos a través de Electron.

### 🏗️ Arquitectura de Software
El proyecto sigue una arquitectura SPA (Single Page Application) modular montada sobre React y empaquetada con Vite/Electron.

```
FasTPV/
├── electron/                 # Código principal de Electron (Proceso Main)
│   └── main.cjs              # Configuración y ciclo de vida de la ventana nativa
├── src/                      # Código fuente del Frontend (React)
│   ├── components/           # Componentes modulares de React
│   │   ├── layout/           # Componentes de estructura (Navbar, Sidebar)
│   │   └── modals/           # Ventanas modulares (SAT, Inventario, Caja, etc.)
│   ├── context/              # Contexto global y lógica de estado del sistema
│   │   └── SystemContext.jsx # Proveedor de estado global (ventas, equipos, config)
│   ├── utils/                # Utilidades de lógica y cálculos
│   │   ├── satPdfGenerator.js# Generador de reportes PDF para la guía fiscal SAT
│   │   └── ticketGenerator.js# Generador de comprobantes físicos y tickets
│   ├── App.jsx               # Nodo raíz del frontend
│   └── main.jsx              # Inicializador de la aplicación
├── package.json              # Dependencias y scripts de construcción
├── tailwind.config.js        # Estilos y tokens de diseño visual
└── vite.config.js            # Configuración de compilación y base-paths
```

### 🧬 Stack Tecnológico
*   **Frontend:** React 18, TailwindCSS (estilos adaptables y modo oscuro), Lucide React (iconografía).
*   **Runtime de Escritorio:** Electron (puente a APIs del OS).
*   **Compilador:** Vite.
*   **Generación de Documentos:** `jsPDF` y `jspdf-autotable` para reportes pixel-perfect del lado del cliente.
*   **Persistencia:** `localStorage` local con copias de seguridad automáticas en formato JSON.

### 📝 Módulo de PDF (SAT)
El archivo `src/utils/satPdfGenerator.js` exporta la función principal `exportarSatGuiaPDF(tipoGuia, datos, config)` que:
1.  Instancia un lienzo tamaño Carta en orientación vertical (`portrait`).
2.  Define una paleta de colores corporativa `#6d28d9` (púrpura) para contrastes de encabezado.
3.  Utiliza la extensión `jspdf-autotable` para renderizar tablas estilizadas con los importes exactos listos para capturar en el SAT.

---

## 🚀 Instalación y Desarrollo

### Requisitos Previos
*   [Node.js](https://nodejs.org/) (Versión 16 o superior recomendada).
*   [Git](https://git-scm.com/).

### Instrucciones de Instalación
1.  Clonar el repositorio:
    ```bash
    git clone https://github.com/ulises12pg/FasTPV.git
    cd FasTPV
    ```
2.  Instalar las dependencias de Node:
    ```bash
    npm install
    ```

### Scripts de Ejecución
*   **Modo Web (Desarrollo):** Inicia un servidor de desarrollo local para pruebas rápidas en navegador:
    ```bash
    npm run dev
    ```
*   **Modo Escritorio (Desarrollo):** Lanza la aplicación dentro del entorno de ventanas de Electron:
    ```bash
    npm run electron:dev
    ```
*   **Compilación de Producción:** Compila los assets optimizados del frontend:
    ```bash
    npm run build
    ```
*   **Empaquetado ejecutable (Windows):** Crea un instalador `.exe` autónomo para distribución:
    ```bash
    npm run electron:pack
    ```
