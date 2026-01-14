# Calculadora de Percepciones IIBB - CA/RR

Aplicación web de capacitación para el cálculo de percepciones de Ingresos Brutos para las empresas CA y RR.

## 🚀 Uso

### Aplicación Principal
Abrir `index.html` en cualquier navegador moderno.

### Panel de Administración
Abrir `admin.html` para editar reglas impositivas sin tocar código.

## 📁 Estructura

```
├── index.html          # Aplicación principal (wizard 5 pasos)
├── admin.html          # Panel de administración
├── app.js              # Lógica de cálculo
├── styles.css          # Estilos visuales
└── data/
    └── reglas_impositivas.json  # Reglas editables
```

## 🎯 Funcionalidades

- Wizard intuitivo de 5 pasos
- Soporte para Convenio Multilateral y Contribuyente Local
- Cálculo automático de IDs y alícuotas
- Panel visual para editar reglas
- Funciona offline (sin servidor)

## 🛠️ Actualización de Reglas

1. Abrir `admin.html`
2. Editar los campos necesarios
3. Click en "Guardar Cambios"
4. Los cambios se aplican inmediatamente

## 📋 Provincias Soportadas

- Santa Fe (con casos especiales 1276)
- Corrientes
- Chaco
- La Rioja
- Misiones
- Salta
- San Luis

## 👤 Autor

Gabriela Bianchini - Sistema de Capacitación Impositiva
