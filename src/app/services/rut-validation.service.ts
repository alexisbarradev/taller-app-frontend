import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface RutValidationResponse {
  isValid: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RutValidationService {

  constructor() {}

  /**
   * Valida un RUT usando la lógica de Azure Function integrada
   * @param rut - El RUT a validar (formato: 12345678-9 o 12.345.678-9)
   * @returns Observable con el resultado de la validación
   */
  validateRutWithAzure(rut: string): Observable<RutValidationResponse> {
    if (!rut || rut.trim() === '') {
      return of({ isValid: false, message: 'El RUT es requerido' });
    }

    // Usar la lógica de validación integrada (basada en el código de Azure Function)
    const validationResult = this.validateRutWithAzureLogic(rut);
    return of(validationResult);
  }

  /**
   * Lógica de validación de RUT basada en el código de Azure Function
   * @param rut - El RUT a validar
   * @returns Resultado de la validación
   */
  private validateRutWithAzureLogic(rut: string): RutValidationResponse {
    try {
      // Validar que el RUT tenga el formato correcto con guión
      if (!rut.includes('-')) {
        return { isValid: false, message: 'El RUT debe incluir el dígito verificador separado por guión (ej: 12345678-9)' };
      }

      // Separar cuerpo y dígito verificador
      const parts = rut.split('-');
      if (parts.length !== 2) {
        return { isValid: false, message: 'Formato de RUT inválido. Debe tener un solo guión (ej: 12345678-9)' };
      }

      const cuerpo = parts[0].replace(/\./g, ''); // Eliminar puntos del cuerpo
      const dv = parts[1].toUpperCase(); // Dígito verificador

      // Validar que el cuerpo solo contenga números
      if (!/^[0-9]+$/.test(cuerpo)) {
        return { isValid: false, message: 'El cuerpo del RUT debe contener solo números' };
      }

      // Validar que el dígito verificador sea un número o K
      if (!/^[0-9K]$/.test(dv)) {
        return { isValid: false, message: 'El dígito verificador debe ser un número o K' };
      }

      // El cuerpo debe tener al menos 7 dígitos (RUTs válidos en Chile)
      if (cuerpo.length < 7) {
        return { isValid: false, message: 'El RUT debe tener al menos 7 dígitos en el cuerpo' };
      }

      // Calcular dígito verificador
      let suma = 0;
      let multiplo = 2;
      
      for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo.charAt(i), 10) * multiplo;
        multiplo = multiplo < 7 ? multiplo + 1 : 2;
      }
      
      const dvEsperado = 11 - (suma % 11);
      let dvCalc = '';
      
      if (dvEsperado === 11) {
        dvCalc = '0';
      } else if (dvEsperado === 10) {
        dvCalc = 'K';
      } else {
        dvCalc = dvEsperado.toString();
      }

      // Comparar dígito verificador
      if (dv === dvCalc) {
        return { isValid: true, message: 'RUT válido' };
      } else {
        return { 
          isValid: false, 
          message: `Dígito verificador incorrecto. Esperado: ${dvCalc}, Ingresado: ${dv}` 
        };
      }
      
    } catch (error) {
      console.error('Error en validación de RUT:', error);
      return { isValid: false, message: 'Error interno en la validación del RUT' };
    }
  }

  /**
   * Validación local de RUT como fallback
   * @param rut - El RUT a validar
   * @returns true si el RUT es válido
   */
  private validateRutLocally(rut: string): boolean {
    // Validar que el RUT tenga el formato correcto con guión
    if (!rut.includes('-')) return false;

    // Separar cuerpo y dígito verificador
    const parts = rut.split('-');
    if (parts.length !== 2) return false;

    const cuerpo = parts[0].replace(/\./g, ''); // Eliminar puntos del cuerpo
    const dv = parts[1].toUpperCase(); // Dígito verificador

    // Validar que el cuerpo solo contenga números
    if (!/^[0-9]+$/.test(cuerpo)) return false;

    // Validar que el dígito verificador sea un número o K
    if (!/^[0-9K]$/.test(dv)) return false;

    // El cuerpo debe tener al menos 7 dígitos (RUTs válidos en Chile)
    if (cuerpo.length < 7) return false;

    let suma = 0;
    let multiplo = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo.charAt(i), 10) * multiplo;
      multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }
    const dvEsperado = 11 - (suma % 11);
    let dvCalc = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();

    return dv === dvCalc;
  }

  /**
   * Configurar la URL de la Azure Function (para futuras implementaciones)
   * @param url - La URL completa de la Azure Function
   */
  setAzureFunctionUrl(url: string): void {
    console.log('URL de Azure Function configurada:', url);
    // Por ahora, la validación se hace localmente
  }

  /**
   * Obtener la URL actual de la Azure Function
   * @returns La URL configurada
   */
  getAzureFunctionUrl(): string {
    return 'Validación local integrada';
  }
} 