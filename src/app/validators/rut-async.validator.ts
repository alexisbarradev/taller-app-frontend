import { Injectable } from '@angular/core';
import { AsyncValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { RutValidationService } from '../services/rut-validation.service';

@Injectable({
  providedIn: 'root'
})
export class RutAsyncValidator {
  constructor(private rutValidationService: RutValidationService) {}

  /**
   * Validador asíncrono que usa la lógica de Azure Function integrada
   * @returns AsyncValidatorFn que retorna un Observable con el resultado de la validación
   */
  static validateRutWithAzure(rutValidationService: RutValidationService): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const rut = control.value;
      
      // Si no hay valor, no validar
      if (!rut || rut.trim() === '') {
        return of(null);
      }

      // Validación básica antes de procesar
      if (!rut.includes('-')) {
        return of({ rutInvalido: { message: 'El RUT debe incluir el dígito verificador separado por guión (ej: 12345678-9)' } });
      }

      // Llamar a la validación con debounce para evitar muchas llamadas
      return control.valueChanges.pipe(
        debounceTime(500), // Esperar 500ms después de que el usuario deje de escribir
        distinctUntilChanged(), // Solo validar si el valor cambió
        switchMap(value => {
          if (!value || value.trim() === '') {
            return of(null);
          }
          
          return rutValidationService.validateRutWithAzure(value).pipe(
            map(response => {
              if (response.isValid) {
                return null; // RUT válido
              } else {
                return { 
                  rutInvalido: { 
                    message: response.message || 'RUT inválido' 
                  } 
                };
              }
            })
          );
        })
      );
    };
  }

  /**
   * Validador asíncrono simple (sin debounce) para validación inmediata
   * @returns AsyncValidatorFn para validación al enviar formulario
   */
  static validateRutImmediate(rutValidationService: RutValidationService): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const rut = control.value;
      
      if (!rut || rut.trim() === '') {
        return of(null);
      }

      return rutValidationService.validateRutWithAzure(rut).pipe(
        map(response => {
          if (response.isValid) {
            return null;
          } else {
            return { 
              rutInvalido: { 
                message: response.message || 'RUT inválido' 
              } 
            };
          }
        })
      );
    };
  }
} 