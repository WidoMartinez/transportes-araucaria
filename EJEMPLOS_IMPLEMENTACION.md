# 💻 Ejemplos de Implementación de Mejoras

Este documento contiene ejemplos prácticos de código para implementar las mejoras sugeridas en los formularios de reserva.

---

## 📱 1. Campo de Teléfono Mejorado

### Ejemplo Completo con Validación en Tiempo Real y Formato Automático

```javascript
import { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { CheckCircle, XCircle, Phone } from 'lucide-react';
import { validarTelefono, formatearTelefono } from '../utils/validations';

function CampoTelefonoMejorado({ value, onChange, required = true }) {
    const [error, setError] = useState('');
    const [status, setStatus] = useState('idle'); // idle, valid, invalid
    const [touched, setTouched] = useState(false);

    // Validación con debounce
    useEffect(() => {
        if (!touched || !value) {
            setStatus('idle');
            return;
        }

        const timer = setTimeout(() => {
            const { valido, mensaje } = validarTelefono(value);
            setStatus(valido ? 'valid' : 'invalid');
            setError(valido ? '' : mensaje);
        }, 500);

        return () => clearTimeout(timer);
    }, [value, touched]);

    const handleChange = (e) => {
        const formatted = formatearTelefono(e.target.value);
        onChange({
            target: {
                name: 'telefono',
                value: formatted
            }
        });
    };

    const handleBlur = () => {
        setTouched(true);
        if (value) {
            const { valido, mensaje } = validarTelefono(value);
            setStatus(valido ? 'valid' : 'invalid');
            setError(valido ? '' : mensaje);
        }
    };

    return (
        <div className="space-y-2">
            <Label htmlFor="telefono" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Teléfono Móvil
                {required && <span className="text-red-500">*</span>}
            </Label>
            
            <div className="relative">
                <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="+56 9 1234 5678"
                    autoComplete="tel"
                    required={required}
                    className={`pr-10 ${
                        status === 'valid' ? 'border-green-500 focus:ring-green-500' :
                        status === 'invalid' ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                    aria-label="Número de teléfono móvil"
                    aria-required={required}
                    aria-invalid={status === 'invalid'}
                    aria-describedby={error ? "telefono-error" : "telefono-hint"}
                />
                
                {/* Indicador visual */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {status === 'valid' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {status === 'invalid' && (
                        <XCircle className="h-5 w-5 text-red-500" />
                    )}
                </div>
            </div>

            {/* Mensajes de ayuda */}
            {!error && (
                <p id="telefono-hint" className="text-xs text-gray-500">
                    Formato: +56 9 1234 5678
                </p>
            )}
            
            {error && (
                <p
                    id="telefono-error"
                    role="alert"
                    className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2"
                >
                    {error}
                </p>
            )}
        </div>
    );
}

export default CampoTelefonoMejorado;
```

---

## 📧 2. Campo de Email Mejorado

```javascript
import { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { CheckCircle, XCircle, Mail } from 'lucide-react';
import { validarEmail } from '../utils/validations';

function CampoEmailMejorado({ value, onChange, required = true }) {
    const [error, setError] = useState('');
    const [status, setStatus] = useState('idle');
    const [touched, setTouched] = useState(false);

    useEffect(() => {
        if (!touched || !value) {
            setStatus('idle');
            return;
        }

        const timer = setTimeout(() => {
            const { valido, mensaje } = validarEmail(value);
            setStatus(valido ? 'valid' : 'invalid');
            setError(valido ? '' : mensaje);
        }, 500);

        return () => clearTimeout(timer);
    }, [value, touched]);

    const handleBlur = () => {
        setTouched(true);
        if (value) {
            const { valido, mensaje } = validarEmail(value);
            setStatus(valido ? 'valid' : 'invalid');
            setError(valido ? '' : mensaje);
        }
    };

    return (
        <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Correo Electrónico
                {required && <span className="text-red-500">*</span>}
            </Label>
            
            <div className="relative">
                <Input
                    id="email"
                    name="email"
                    type="email"
                    value={value}
                    onChange={onChange}
                    onBlur={handleBlur}
                    placeholder="tu@email.cl"
                    autoComplete="email"
                    required={required}
                    className={`pr-10 ${
                        status === 'valid' ? 'border-green-500 focus:ring-green-500' :
                        status === 'invalid' ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                    aria-label="Correo electrónico"
                    aria-required={required}
                    aria-invalid={status === 'invalid'}
                    aria-describedby={error ? "email-error" : "email-hint"}
                />
                
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {status === 'valid' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {status === 'invalid' && <XCircle className="h-5 w-5 text-red-500" />}
                </div>
            </div>

            {!error && (
                <p id="email-hint" className="text-xs text-gray-500">
                    Te enviaremos la confirmación a este correo
                </p>
            )}
            
            {error && (
                <p id="email-error" role="alert" className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                    {error}
                </p>
            )}
        </div>
    );
}

export default CampoEmailMejorado;
```

---

## 💾 3. Hook para Persistencia en localStorage

```javascript
import { useState, useEffect } from 'react';

/**
 * Hook personalizado para guardar y cargar datos del formulario en localStorage
 * @param {string} key - Clave para localStorage
 * @param {object} defaultValue - Valor por defecto
 * @returns {[object, function, function]} - [formData, setFormData, clearFormData]
 */
export function useFormPersistence(key, defaultValue) {
    const [formData, setFormData] = useState(() => {
        try {
            const saved = localStorage.getItem(key);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error cargando datos guardados:', error);
        }
        return defaultValue;
    });

    // Guardar automáticamente con debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                localStorage.setItem(key, JSON.stringify(formData));
            } catch (error) {
                console.error('Error guardando datos:', error);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [key, formData]);

    // Función para limpiar
    const clearFormData = () => {
        localStorage.removeItem(key);
        setFormData(defaultValue);
    };

    return [formData, setFormData, clearFormData];
}

// Uso en componente
function FormularioConPersistencia() {
    const [formData, setFormData, clearFormData] = useFormPersistence('reserva-form', {
        nombre: '',
        email: '',
        telefono: '',
        origen: 'Aeropuerto La Araucanía',
        destino: '',
        fecha: '',
        hora: '',
        pasajeros: 1
    });

    return (
        <div>
            {/* Formulario aquí */}
            
            {/* Botón para limpiar datos guardados */}
            <Button
                type="button"
                variant="ghost"
                onClick={clearFormData}
                className="text-sm text-gray-500"
            >
                Limpiar formulario guardado
            </Button>
        </div>
    );
}
```

---

## 📊 4. Indicador de Estado de Guardado

```javascript
import { useState, useEffect } from 'react';
import { CheckCircle, LoaderCircle, XCircle } from 'lucide-react';

function EstadoGuardado({ status, mensaje }) {
    const icons = {
        idle: null,
        saving: <LoaderCircle className="h-4 w-4 animate-spin" />,
        saved: <CheckCircle className="h-4 w-4" />,
        error: <XCircle className="h-4 w-4" />
    };

    const colors = {
        idle: '',
        saving: 'text-blue-600',
        saved: 'text-green-600',
        error: 'text-red-600'
    };

    if (status === 'idle') return null;

    return (
        <div className={`flex items-center gap-2 text-sm ${colors[status]} transition-all`}>
            {icons[status]}
            <span>{mensaje}</span>
        </div>
    );
}

// Uso con el hook de persistencia
function FormularioConEstado() {
    const [saveStatus, setSaveStatus] = useState('idle');
    const [formData, setFormData] = useFormPersistence('reserva-form', defaultData);

    useEffect(() => {
        setSaveStatus('saving');
        const timer = setTimeout(() => {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 1000);

        return () => clearTimeout(timer);
    }, [formData]);

    return (
        <div>
            {/* Header con estado */}
            <div className="flex items-center justify-between mb-4">
                <h3>Formulario de Reserva</h3>
                <EstadoGuardado
                    status={saveStatus}
                    mensaje={
                        saveStatus === 'saving' ? 'Guardando...' :
                        saveStatus === 'saved' ? 'Cambios guardados' :
                        saveStatus === 'error' ? 'Error al guardar' : ''
                    }
                />
            </div>
            
            {/* Formulario */}
        </div>
    );
}
```

---

## 🎨 5. Componente de Campo con Todos los Estados

```javascript
import { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./ui/tooltip";

/**
 * Componente de campo de formulario mejorado con:
 * - Validación en tiempo real
 * - Indicadores visuales
 * - Tooltips informativos
 * - Accesibilidad completa
 */
function CampoFormularioMejorado({
    id,
    name,
    label,
    value,
    onChange,
    type = 'text',
    placeholder = '',
    required = false,
    validator = null,
    formatter = null,
    tooltip = '',
    icon: Icon = null,
    autoComplete = '',
    maxLength = null,
    hint = ''
}) {
    const [error, setError] = useState('');
    const [status, setStatus] = useState('idle'); // idle, valid, invalid, warning
    const [touched, setTouched] = useState(false);

    // Validación con debounce
    useEffect(() => {
        if (!touched || !value) {
            setStatus('idle');
            return;
        }

        const timer = setTimeout(() => {
            if (validator) {
                const result = validator(value);
                setStatus(result.valido ? 'valid' : 'invalid');
                setError(result.valido ? '' : result.mensaje);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [value, touched, validator]);

    const handleChange = (e) => {
        let newValue = e.target.value;
        
        // Aplicar formato si existe
        if (formatter) {
            newValue = formatter(newValue);
        }

        onChange({
            target: {
                name,
                value: newValue
            }
        });
    };

    const handleBlur = () => {
        setTouched(true);
        if (value && validator) {
            const result = validator(value);
            setStatus(result.valido ? 'valid' : 'invalid');
            setError(result.valido ? '' : result.mensaje);
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'valid':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'invalid':
                return <XCircle className="h-5 w-5 text-red-500" />;
            case 'warning':
                return <AlertCircle className="h-5 w-5 text-yellow-500" />;
            default:
                return null;
        }
    };

    const getBorderClass = () => {
        switch (status) {
            case 'valid':
                return 'border-green-500 focus:ring-green-500';
            case 'invalid':
                return 'border-red-500 focus:ring-red-500';
            case 'warning':
                return 'border-yellow-500 focus:ring-yellow-500';
            default:
                return '';
        }
    };

    return (
        <div className="space-y-2">
            {/* Label con tooltip */}
            <div className="flex items-center gap-2">
                <Label htmlFor={id} className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4" />}
                    {label}
                    {required && <span className="text-red-500">*</span>}
                </Label>
                
                {tooltip && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger type="button" className="focus:outline-none">
                                <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">{tooltip}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
            
            {/* Input con indicador */}
            <div className="relative">
                <Input
                    id={id}
                    name={name}
                    type={type}
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    required={required}
                    maxLength={maxLength}
                    className={`pr-10 ${getBorderClass()}`}
                    aria-label={label}
                    aria-required={required}
                    aria-invalid={status === 'invalid'}
                    aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
                />
                
                {/* Indicador visual de estado */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {getStatusIcon()}
                </div>
            </div>

            {/* Mensajes de ayuda y error */}
            {!error && hint && (
                <p id={`${id}-hint`} className="text-xs text-gray-500">
                    {hint}
                </p>
            )}
            
            {error && (
                <p
                    id={`${id}-error`}
                    role="alert"
                    className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2 flex items-start gap-2"
                >
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </p>
            )}

            {/* Contador de caracteres si hay maxLength */}
            {maxLength && value && (
                <p className="text-xs text-gray-500 text-right">
                    {value.length}/{maxLength}
                </p>
            )}
        </div>
    );
}

export default CampoFormularioMejorado;
```

---

## 🎯 6. Ejemplo de Uso Completo

```javascript
import { useState } from 'react';
import CampoFormularioMejorado from './CampoFormularioMejorado';
import { validadores, formateadores } from '../utils/validations';
import { useFormPersistence } from '../hooks/useFormPersistence';
import { Phone, Mail, User, MapPin, Calendar } from 'lucide-react';

function FormularioReservaMejorado() {
    const [formData, setFormData, clearFormData] = useFormPersistence('reserva-express', {
        nombre: '',
        email: '',
        telefono: '',
        origen: 'Aeropuerto La Araucanía',
        destino: '',
        fecha: '',
        pasajeros: 1
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validar todos los campos
        const errores = [];
        
        const nombreValidation = validadores.nombre(formData.nombre);
        if (!nombreValidation.valido) errores.push(nombreValidation.mensaje);
        
        const emailValidation = validadores.email(formData.email);
        if (!emailValidation.valido) errores.push(emailValidation.mensaje);
        
        const telefonoValidation = validadores.telefono(formData.telefono);
        if (!telefonoValidation.valido) errores.push(telefonoValidation.mensaje);

        if (errores.length > 0) {
            alert('Por favor corrige los siguientes errores:\n' + errores.join('\n'));
            return;
        }

        // Enviar formulario
        console.log('Formulario válido:', formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Reserva Express</h2>

            <CampoFormularioMejorado
                id="nombre"
                name="nombre"
                label="Nombre Completo"
                value={formData.nombre}
                onChange={handleChange}
                type="text"
                placeholder="Ej: Juan Pérez González"
                required={true}
                validator={validadores.nombre}
                icon={User}
                autoComplete="name"
                hint="Ingresa tu nombre y apellido completos"
                tooltip="Necesitamos tu nombre completo para la reserva"
            />

            <CampoFormularioMejorado
                id="email"
                name="email"
                label="Correo Electrónico"
                value={formData.email}
                onChange={handleChange}
                type="email"
                placeholder="tu@email.cl"
                required={true}
                validator={validadores.email}
                icon={Mail}
                autoComplete="email"
                hint="Te enviaremos la confirmación a este correo"
                tooltip="Verifica que tu email esté correcto para recibir la confirmación"
            />

            <CampoFormularioMejorado
                id="telefono"
                name="telefono"
                label="Teléfono Móvil"
                value={formData.telefono}
                onChange={handleChange}
                type="tel"
                placeholder="+56 9 1234 5678"
                required={true}
                validator={validadores.telefono}
                formatter={formateadores.telefono}
                icon={Phone}
                autoComplete="tel"
                hint="Formato: +56 9 1234 5678"
                tooltip="Te contactaremos por WhatsApp a este número"
            />

            {/* Más campos... */}

            <div className="flex gap-4">
                <button
                    type="submit"
                    className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition"
                >
                    Continuar con la reserva
                </button>
                
                <button
                    type="button"
                    onClick={clearFormData}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                    Limpiar
                </button>
            </div>
        </form>
    );
}

export default FormularioReservaMejorado;
```

---

## 📚 Recursos Adicionales

### Librerías Recomendadas

1. **react-hook-form** - Gestión avanzada de formularios
   ```bash
   npm install react-hook-form
   ```

2. **yup** - Esquemas de validación
   ```bash
   npm install yup
   ```

3. **react-input-mask** - Máscaras de entrada
   ```bash
   npm install react-input-mask
   ```

4. **date-fns** - Manejo de fechas
   ```bash
   npm install date-fns
   ```

### Ejemplo con react-hook-form + yup

```javascript
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
    nombre: yup
        .string()
        .required('El nombre es requerido')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo letras y espacios')
        .test('dos-palabras', 'Ingresa nombre y apellido', (value) => {
            return value && value.trim().split(/\s+/).length >= 2;
        }),
    email: yup
        .string()
        .required('El email es requerido')
        .email('Email inválido'),
    telefono: yup
        .string()
        .required('El teléfono es requerido')
        .matches(/^(\+?56)?(\s?9)\s?(\d{4})\s?(\d{4})$/, 'Formato: +56 9 1234 5678')
});

function FormularioConValidacion() {
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    const onSubmit = (data) => {
        console.log('Datos válidos:', data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <input {...register('nombre')} />
            {errors.nombre && <p>{errors.nombre.message}</p>}
            
            <input {...register('email')} />
            {errors.email && <p>{errors.email.message}</p>}
            
            <input {...register('telefono')} />
            {errors.telefono && <p>{errors.telefono.message}</p>}
            
            <button type="submit">Enviar</button>
        </form>
    );
}
```

---

*Estos ejemplos están listos para implementar y se pueden adaptar según las necesidades específicas del proyecto.*
