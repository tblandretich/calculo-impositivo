/**
 * App Capacitación - Cálculo Impositivo CA/RR
 * Lógica principal de la aplicación
 */

// Estado de la aplicación
const AppState = {
    currentStep: 1,
    totalSteps: 5,
    data: {
        empresa: null,
        tipoContribuyente: null,
        provincia: null,
        tieneCertificado: false,
        tiene1276: false,
        tieneConstancia: true,
        coeficienteCM05: null,
        esAgentePercepcion: false
    },
    reglas: null
};

// Elementos del DOM
const DOM = {
    stepper: null,
    steps: null,
    prevBtn: null,
    nextBtn: null,
    resultContainer: null
};

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    initDOM();
    await loadReglas();
    setupEventListeners();
    updateUI();
});

function initDOM() {
    DOM.stepper = document.getElementById('stepper');
    DOM.steps = document.querySelectorAll('.step-section');
    DOM.prevBtn = document.getElementById('prevBtn');
    DOM.nextBtn = document.getElementById('nextBtn');
    DOM.resultContainer = document.getElementById('resultContainer');
}

// Datos embebidos como fallback (para cuando se abre la app directamente sin servidor)
const REGLAS_FALLBACK = {
    "metadata": {
        "version": "1.0",
        "ultima_actualizacion": "2026-01-09",
        "autor": "Gabriela Bianchini"
    },
    "empresas": ["CA", "RR"],
    "provincias_con_padron": ["jujuy", "buenos_aires", "tucuman"],
    "reglas_convenio_multilateral": {
        "santa_fe": {
            "nombre": "Santa Fe",
            "requiere_coeficiente": true,
            "coeficiente_minimo": 0.10,
            "con_coeficiente": { "id": 54, "descripcion": "PERCEP IIBB SANTA FE C.M. 1.25%", "alicuota": 1.25 },
            "sin_coeficiente": { "mensaje": "No corresponde percepción (Coeficiente < 0.10)" },
            "con_1276": { "accion": "derivar", "mensaje": "Derivar a impuestos y contabilidad" }
        },
        "corrientes": {
            "nombre": "Corrientes",
            "requiere_coeficiente": true,
            "coeficiente_minimo": 0.10,
            "con_coeficiente": { "id": 1080, "descripcion": "PERCEP IIBB CORRIENTES CM", "alicuota": null },
            "sin_coeficiente": { "mensaje": "No corresponde percepción (Coeficiente < 0.10)" }
        },
        "chaco": { "nombre": "Chaco", "requiere_coeficiente": false, "resultado": { "id": 1076, "descripcion": "PERCEP IIBB CHACO CM", "alicuota": null } },
        "la_rioja": { "nombre": "La Rioja", "requiere_coeficiente": false, "resultado": { "id": 1078, "descripcion": "PERCEP IIBB LA RIOJA CM", "alicuota": null } },
        "misiones": { "nombre": "Misiones", "requiere_coeficiente": false, "resultado": { "id": 346, "descripcion": "PERCEP IIBB MISIONES 3.31%", "alicuota": 3.31 } },
        "salta": { "nombre": "Salta", "requiere_coeficiente": false, "resultado": { "id": 344, "descripcion": "PERCEP IIBB SALTA CM 1.8%", "alicuota": 1.8 } },
        "san_luis": {
            "nombre": "San Luis",
            "requiere_coeficiente": true,
            "coeficiente_minimo": 0.10,
            "con_coeficiente": { "id": 1100, "descripcion": "PERCEP IIBB SAN LUIS CM", "alicuota": null },
            "sin_coeficiente": { "mensaje": "No corresponde percepción (Coeficiente < 0.10)" }
        }
    },
    "reglas_local": {
        "corrientes": { "nombre": "Corrientes", "resultado": { "id": 1074, "descripcion": "PERCEP IIBB CORRIENTES C.L.", "alicuota": null } },
        "chaco": { "nombre": "Chaco", "resultado": { "id": 1075, "descripcion": "PERCEP IIBB CHACO C.L.", "alicuota": null } },
        "la_rioja": { "nombre": "La Rioja", "resultado": { "id": 1077, "descripcion": "PERCEP IIBB LA RIOJA C.L.", "alicuota": null } },
        "misiones": { "nombre": "Misiones", "resultado": { "id": 346, "descripcion": "PERCEP IIBB MISIONES 3.31%", "alicuota": 3.31 } },
        "salta": { "nombre": "Salta", "resultado": { "id": 343, "descripcion": "PERCEP IIBB SALTA C.L. 3.6%", "alicuota": 3.6 } },
        "san_luis": { "nombre": "San Luis", "resultado": { "id": 1099, "descripcion": "PERCEP IIBB SAN LUIS C.L.", "alicuota": null } },
        "santa_fe": {
            "nombre": "Santa Fe",
            "con_1276": { "accion": "derivar", "mensaje": "Derivar a impuestos y contabilidad" },
            "sin_1276": { "id": 51, "descripcion": "PERCEP IIBB SANTA FE C.L. 2.5%", "alicuota": 2.5 },
            "sin_constancia": { "id": 52, "descripcion": "PERCEP IIBB SANTA FE N.I. 3.6%", "alicuota": 3.6, "nota": "Revisar SIAT (API) - Consultar" }
        }
    },
    "mensajes": {
        "padron": "⚠️ AVISAR A FRAN: Corresponde revisión de padrón.",
        "exento": "Agregar conjunto EXENTO en esta provincia.",
        "derivar_impuestos": "Derivar a impuestos y contabilidad."
    }
};

async function loadReglas() {
    // 1. Primero verificar si hay reglas guardadas en localStorage (desde admin panel)
    const savedReglas = localStorage.getItem('reglas_impositivas');
    if (savedReglas) {
        AppState.reglas = JSON.parse(savedReglas);
        console.log('Reglas cargadas desde localStorage (admin):', AppState.reglas);
        updateVersionInfo();
        return;
    }

    // 2. Intentar cargar desde JSON externo
    try {
        const response = await fetch('data/reglas_impositivas.json');
        if (!response.ok) throw new Error('Error cargando reglas');
        AppState.reglas = await response.json();
        console.log('Reglas cargadas desde JSON:', AppState.reglas);
    } catch (error) {
        // 3. Usar datos embebidos como último recurso
        console.warn('No se pudo cargar JSON externo, usando datos embebidos:', error.message);
        AppState.reglas = REGLAS_FALLBACK;
        console.log('Reglas cargadas (fallback):', AppState.reglas);
    }
    updateVersionInfo();
}

function updateVersionInfo() {
    const versionEl = document.getElementById('versionInfo');
    if (versionEl && AppState.reglas?.metadata) {
        versionEl.textContent = `Versión ${AppState.reglas.metadata.version} - Última actualización: ${AppState.reglas.metadata.ultima_actualizacion}`;
    }
}

function setupEventListeners() {
    // Navegación
    DOM.prevBtn?.addEventListener('click', prevStep);
    DOM.nextBtn?.addEventListener('click', nextStep);

    // Empresa
    document.querySelectorAll('input[name="empresa"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            AppState.data.empresa = e.target.value;
            updateUI();
        });
    });

    // Tipo de contribuyente
    document.querySelectorAll('input[name="tipoContribuyente"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            AppState.data.tipoContribuyente = e.target.value;
            updateUI();
        });
    });

    // Provincia
    document.getElementById('provincia')?.addEventListener('change', (e) => {
        AppState.data.provincia = e.target.value;
        updateUI();
    });

    // Certificado de exclusión
    document.getElementById('certificadoExclusion')?.addEventListener('change', (e) => {
        AppState.data.tieneCertificado = e.target.checked;
    });

    // Tiene 1276 (Santa Fe)
    document.getElementById('tiene1276')?.addEventListener('change', (e) => {
        AppState.data.tiene1276 = e.target.checked;
        updateUI();
    });

    // Tiene constancia inscripción (Santa Fe Local)
    document.getElementById('tieneConstancia')?.addEventListener('change', (e) => {
        AppState.data.tieneConstancia = e.target.checked;
        updateUI();
    });

    // Es Agente de Percepción (Santa Fe)
    document.getElementById('esAgentePercepcion')?.addEventListener('change', (e) => {
        AppState.data.esAgentePercepcion = e.target.checked;
    });

    // Coeficiente CM05
    document.getElementById('coeficienteCM05')?.addEventListener('input', (e) => {
        AppState.data.coeficienteCM05 = parseFloat(e.target.value) || 0;
    });

    // Reset
    document.getElementById('resetBtn')?.addEventListener('click', resetApp);
    document.getElementById('newQueryBtn')?.addEventListener('click', resetApp);
}

function prevStep() {
    if (AppState.currentStep > 1) {
        AppState.currentStep--;
        updateUI();
    }
}

function nextStep() {
    if (validateCurrentStep()) {
        if (AppState.currentStep < AppState.totalSteps) {
            AppState.currentStep++;
            updateUI();
        }

        // Si llegamos al último paso, calcular resultado
        if (AppState.currentStep === AppState.totalSteps) {
            calculateResult();
        }
    }
}

function validateCurrentStep() {
    switch (AppState.currentStep) {
        case 1:
            if (!AppState.data.empresa) {
                showToast('Por favor, seleccione la empresa');
                return false;
            }
            break;
        case 2:
            if (!AppState.data.tipoContribuyente) {
                showToast('Por favor, seleccione el tipo de contribuyente');
                return false;
            }
            break;
        case 3:
            if (!AppState.data.provincia) {
                showToast('Por favor, seleccione una provincia');
                return false;
            }
            break;
    }
    return true;
}

function updateUI() {
    // Actualizar stepper
    updateStepper();

    // Mostrar step actual
    DOM.steps.forEach((step, index) => {
        step.classList.toggle('active', index + 1 === AppState.currentStep);
    });

    // Actualizar botones
    updateButtons();

    // Actualizar opciones dinámicas
    updateDynamicOptions();
}

function updateStepper() {
    const circles = document.querySelectorAll('.stepper__step');
    circles.forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');

        if (stepNum < AppState.currentStep) {
            step.classList.add('completed');
        } else if (stepNum === AppState.currentStep) {
            step.classList.add('active');
        }
    });
}

function updateButtons() {
    if (DOM.prevBtn) {
        DOM.prevBtn.style.visibility = AppState.currentStep > 1 ? 'visible' : 'hidden';
    }

    if (DOM.nextBtn) {
        if (AppState.currentStep === AppState.totalSteps) {
            DOM.nextBtn.classList.add('hidden');
        } else if (AppState.currentStep === AppState.totalSteps - 1) {
            DOM.nextBtn.innerHTML = '🔍 Calcular Resultado';
            DOM.nextBtn.classList.remove('hidden');
        } else {
            DOM.nextBtn.innerHTML = 'Siguiente →';
            DOM.nextBtn.classList.remove('hidden');
        }
    }
}

function updateDynamicOptions() {
    // Mostrar/ocultar campo coeficiente según provincia y tipo
    const coeficienteGroup = document.getElementById('coeficienteGroup');
    const grupo1276 = document.getElementById('grupo1276');
    const grupoConstancia = document.getElementById('grupoConstancia');

    if (coeficienteGroup) {
        const requiereCoef = requiresCoeficiente();
        coeficienteGroup.classList.toggle('hidden', !requiereCoef);
    }

    // Mostrar campo 1276 solo para Santa Fe
    if (grupo1276) {
        const esSantaFe = AppState.data.provincia === 'santa_fe';
        grupo1276.classList.toggle('hidden', !esSantaFe);
    }

    // Mostrar campo constancia solo para Santa Fe Local sin 1276
    if (grupoConstancia) {
        const esSantaFeLocalSin1276 = AppState.data.provincia === 'santa_fe' &&
            AppState.data.tipoContribuyente === 'local' &&
            !AppState.data.tiene1276;
        grupoConstancia.classList.toggle('hidden', !esSantaFeLocalSin1276);
    }

    // Mostrar campo Agente de Percepción solo para Santa Fe
    const grupoAgentePercepcion = document.getElementById('grupoAgentePercepcion');
    if (grupoAgentePercepcion) {
        const esSantaFe = AppState.data.provincia === 'santa_fe';
        grupoAgentePercepcion.classList.toggle('hidden', !esSantaFe);
        // Si cambia de provincia, resetear el checkbox
        if (!esSantaFe) {
            AppState.data.esAgentePercepcion = false;
            const checkbox = document.getElementById('esAgentePercepcion');
            if (checkbox) checkbox.checked = false;
        }
    }
}

function requiresCoeficiente() {
    if (AppState.data.tipoContribuyente !== 'convenio') return false;

    const provincia = AppState.data.provincia;
    const reglasCM = AppState.reglas?.reglas_convenio_multilateral;

    if (!reglasCM || !provincia) return false;

    return reglasCM[provincia]?.requiere_coeficiente === true;
}

function calculateResult() {
    const { empresa, tipoContribuyente, provincia, tieneCertificado, tiene1276, tieneConstancia, coeficienteCM05, esAgentePercepcion } = AppState.data;
    const reglas = AppState.reglas;

    let resultado = {
        tipo: 'success',
        icono: '✅',
        titulo: '',
        id: null,
        descripcion: '',
        accion: null
    };

    // Si tiene certificado de exclusión -> EXENTO
    if (tieneCertificado) {
        resultado.titulo = 'CONJUNTO EXENTO';
        resultado.descripcion = reglas.mensajes.exento;
        resultado.tipo = 'success';
        resultado.icono = '🛡️';
        renderResult(resultado);
        return;
    }

    // Si es Agente de Percepción en Santa Fe -> EXENTO (ambos tributan en misma provincia)
    if (provincia === 'santa_fe' && esAgentePercepcion) {
        resultado.titulo = 'CONJUNTO EXENTO';
        resultado.descripcion = 'El cliente es Agente de Percepción en Santa Fe. No corresponde percibirle ya que ambos tributan en la misma provincia.';
        resultado.tipo = 'success';
        resultado.icono = '🛡️';
        resultado.accion = 'Agregar a conjunto EXENTO en esta provincia';
        renderResult(resultado);
        return;
    }

    // Provincias con padrón -> Avisar a Fran
    if (reglas.provincias_con_padron.includes(provincia)) {
        resultado.tipo = 'warning';
        resultado.icono = '⚠️';
        resultado.titulo = 'REVISIÓN DE PADRÓN';
        resultado.descripcion = reglas.mensajes.padron;
        resultado.accion = 'Contactar a Fran antes de continuar';
        renderResult(resultado);
        return;
    }

    // Lógica según tipo de contribuyente
    if (tipoContribuyente === 'convenio') {
        const reglasProv = reglas.reglas_convenio_multilateral[provincia];

        if (!reglasProv) {
            resultado.tipo = 'info';
            resultado.icono = 'ℹ️';
            resultado.titulo = 'PROVINCIA NO CONFIGURADA';
            resultado.descripcion = 'Consulte el manual para esta provincia específica.';
            renderResult(resultado);
            return;
        }

        // Santa Fe con 1276
        if (provincia === 'santa_fe' && tiene1276) {
            resultado.tipo = 'warning';
            resultado.icono = '📋';
            resultado.titulo = 'DERIVAR A IMPUESTOS';
            resultado.descripcion = reglasProv.con_1276.mensaje;
            resultado.accion = 'Derivar el caso a Impuestos y Contabilidad';
            renderResult(resultado);
            return;
        }

        // Provincias que requieren coeficiente
        if (reglasProv.requiere_coeficiente) {
            const coefMin = reglasProv.coeficiente_minimo;

            if (coeficienteCM05 >= coefMin) {
                resultado.titulo = 'AGREGAR CONJUNTO';
                resultado.id = `ID ${reglasProv.con_coeficiente.id}`;
                resultado.descripcion = reglasProv.con_coeficiente.descripcion;
                if (reglasProv.con_coeficiente.alicuota) {
                    resultado.descripcion += ` (${reglasProv.con_coeficiente.alicuota}%)`;
                }
            } else {
                resultado.tipo = 'info';
                resultado.icono = '🚫';
                resultado.titulo = 'NO CORRESPONDE PERCEPCIÓN';
                resultado.descripcion = reglasProv.sin_coeficiente.mensaje;
            }
        } else {
            // Provincias sin requisito de coeficiente
            resultado.titulo = 'AGREGAR CONJUNTO';
            resultado.id = `ID ${reglasProv.resultado.id}`;
            resultado.descripcion = reglasProv.resultado.descripcion;
            if (reglasProv.resultado.alicuota) {
                resultado.descripcion += ` (${reglasProv.resultado.alicuota}%)`;
            }
        }
    } else {
        // LOCAL
        const reglasProv = reglas.reglas_local[provincia];

        if (!reglasProv) {
            resultado.tipo = 'info';
            resultado.icono = 'ℹ️';
            resultado.titulo = 'PROVINCIA NO CONFIGURADA';
            resultado.descripcion = 'Consulte el manual para esta provincia específica.';
            renderResult(resultado);
            return;
        }

        // Santa Fe Local
        if (provincia === 'santa_fe') {
            if (tiene1276) {
                resultado.tipo = 'warning';
                resultado.icono = '📋';
                resultado.titulo = 'DERIVAR A IMPUESTOS';
                resultado.descripcion = reglasProv.con_1276.mensaje;
                resultado.accion = 'Derivar el caso a Impuestos y Contabilidad';
            } else if (!tieneConstancia) {
                resultado.tipo = 'warning';
                resultado.icono = '⚠️';
                resultado.titulo = 'AGREGAR CONJUNTO (Revisar SIAT)';
                resultado.id = `ID ${reglasProv.sin_constancia.id}`;
                resultado.descripcion = reglasProv.sin_constancia.descripcion;
                resultado.accion = reglasProv.sin_constancia.nota;
            } else {
                resultado.titulo = 'AGREGAR CONJUNTO';
                resultado.id = `ID ${reglasProv.sin_1276.id}`;
                resultado.descripcion = reglasProv.sin_1276.descripcion;
            }
        } else {
            resultado.titulo = 'AGREGAR CONJUNTO';
            resultado.id = `ID ${reglasProv.resultado.id}`;
            resultado.descripcion = reglasProv.resultado.descripcion;
            if (reglasProv.resultado.alicuota) {
                resultado.descripcion += ` (${reglasProv.resultado.alicuota}%)`;
            }
        }
    }

    renderResult(resultado);
}

function renderResult(resultado) {
    const tipoClasses = {
        success: 'result-box--success',
        warning: 'result-box--warning',
        danger: 'result-box--danger',
        info: 'result-box--info'
    };

    let html = `
        <div class="result-box ${tipoClasses[resultado.tipo]}">
            <div class="result-box__icon">${resultado.icono}</div>
            <div class="result-box__title">${resultado.titulo}</div>
            ${resultado.id ? `<div class="result-box__id">${resultado.id}</div>` : ''}
            <div class="result-box__description">${resultado.descripcion}</div>
            ${resultado.accion ? `<div class="result-box__action">👉 ${resultado.accion}</div>` : ''}
        </div>
        <div class="btn-group" style="justify-content: center; margin-top: 2rem;">
            <button id="newQueryBtn" class="btn btn--primary btn--lg">
                🔄 Nueva Consulta
            </button>
        </div>
    `;

    DOM.resultContainer.innerHTML = html;

    // Re-attach event listener
    document.getElementById('newQueryBtn')?.addEventListener('click', resetApp);
}

function resetApp() {
    AppState.currentStep = 1;
    AppState.data = {
        empresa: null,
        tipoContribuyente: null,
        provincia: null,
        tieneCertificado: false,
        tiene1276: false,
        tieneConstancia: true,
        coeficienteCM05: null,
        esAgentePercepcion: false
    };

    // Limpiar selecciones
    document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
    document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
    document.querySelectorAll('select').forEach(s => s.selectedIndex = 0);
    document.querySelectorAll('input[type="number"]').forEach(i => i.value = '');

    // Limpiar resultado
    if (DOM.resultContainer) {
        DOM.resultContainer.innerHTML = '';
    }

    updateUI();
}

function showToast(message) {
    // Simple alert por ahora, se puede mejorar con una librería de toasts
    alert(message);
}

function showError(message) {
    const container = document.querySelector('.card__body');
    if (container) {
        container.innerHTML = `
            <div class="result-box result-box--danger">
                <div class="result-box__icon">❌</div>
                <div class="result-box__title">Error</div>
                <div class="result-box__description">${message}</div>
            </div>
        `;
    }
}
