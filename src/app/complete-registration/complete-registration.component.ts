import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { GeografiaService, Region, Provincia, Comuna } from '../services/geografia.service';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { RutValidationService } from '../services/rut-validation.service';
import { RutAsyncValidator } from '../validators/rut-async.validator';

// Validador local de RUT como fallback
export function rutValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  return validarRut(value) ? null : { rutInvalido: { message: 'RUT inválido' } };
}

// Función de validación local de RUT chileno
function validarRut(rut: string): boolean {
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

@Component({
  selector: 'app-complete-registration',
  standalone: true,
  templateUrl: './complete-registration.component.html',
  styleUrls: ['./complete-registration.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class CompleteRegistrationComponent implements OnInit {
  registrationForm: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isSubmitting: boolean = false;
  selectedFile: File | null = null;
  fileError: string | null = null;

  // Datos geográficos
  regiones: Region[] = [];
  provincias: Provincia[] = [];
  comunas: Comuna[] = [];
  isLoadingGeografia: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private geografiaService: GeografiaService,
    private rutValidationService: RutValidationService
  ) {
    this.registrationForm = this.fb.group({
      rut: ['', [Validators.required, rutValidator], [RutAsyncValidator.validateRutImmediate(this.rutValidationService)]],
      primerNombre: ['', Validators.required],
      segundoNombre: [''],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: ['', Validators.required],
      direccion: ['', Validators.required],
      usuario: ['', Validators.required],
      numeroContacto: ['', [Validators.required, Validators.pattern('^[2-9][0-9]{8}$')]],
      correo: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      idRegion: ['', Validators.required],
      idProvincia: ['', Validators.required],
      idComuna: ['', Validators.required],
      idComunidad: [3] // Valor fijo para la comunidad "Provisoria"
    });
  }

  ngOnInit(): void {
    this.cargarRegiones();
    this.setupGeografiaListeners();
    this.configurarValidacionRut();
    
    this.route.queryParams.subscribe(params => {
      const email = params['email'];
      const name = params['name'] || '';
      const token = params['token'];
      
      console.log('Complete Registration: Received params:', { email, name, hasToken: !!token });
      
      // Store token if provided (for OAuth2 flow)
      if (token) {
        console.log('Complete Registration: Token found in query params, storing it');
        this.authService.setToken(token);
      }
      
      this.registrationForm.patchValue({
        correo: email,
        primerNombre: name.split(' ')[0] || '',
        apellidoPaterno: name.split(' ').slice(1).join(' ') || ''
      });

      // Split full name into parts
      const nameParts = name.split(' ');
      this.registrationForm.patchValue({
        correo: email,
        primerNombre: nameParts[0] || '',
        segundoNombre: nameParts.length > 2 ? nameParts[1] : '',
        apellidoPaterno: nameParts.length > 1 ? (nameParts.length > 2 ? nameParts[2] : nameParts[1]) : ''
        // Note: apellidoMaterno will need to be entered manually
      });
    });
  }

  /**
   * Configurar la validación de RUT
   */
  private configurarValidacionRut(): void {
    console.log('Validación de RUT configurada con lógica integrada');
    // La validación se hace localmente con la lógica de Azure Function integrada
  }

  /**
   * Cambiar a validación en tiempo real (con debounce)
   * Útil para validación mientras el usuario escribe
   */
  public cambiarAValidacionTiempoReal(): void {
    const rutControl = this.registrationForm.get('rut');
    if (rutControl) {
      // Remover validador asíncrono actual
      rutControl.clearAsyncValidators();
      // Agregar validador con debounce
      rutControl.setAsyncValidators(RutAsyncValidator.validateRutWithAzure(this.rutValidationService));
      rutControl.updateValueAndValidity();
      console.log('Cambiado a validación en tiempo real');
    }
  }

  /**
   * Cambiar a validación inmediata (al enviar formulario)
   * Útil para reducir llamadas a la Azure Function
   */
  public cambiarAValidacionInmediata(): void {
    const rutControl = this.registrationForm.get('rut');
    if (rutControl) {
      // Remover validador asíncrono actual
      rutControl.clearAsyncValidators();
      // Agregar validador inmediato
      rutControl.setAsyncValidators(RutAsyncValidator.validateRutImmediate(this.rutValidationService));
      rutControl.updateValueAndValidity();
      console.log('Cambiado a validación inmediata');
    }
  }

  // Cargar regiones al inicializar
  async cargarRegiones(): Promise<void> {
    try {
      this.isLoadingGeografia = true;
      this.regiones = await firstValueFrom(this.geografiaService.getRegiones());
      console.log('Regiones cargadas:', this.regiones);
    } catch (error) {
      console.error('Error cargando regiones:', error);
      this.errorMessage = 'Error al cargar las regiones. Por favor, recarga la página.';
    } finally {
      this.isLoadingGeografia = false;
    }
  }

  // Configurar listeners para cambios en los campos geográficos
  setupGeografiaListeners(): void {
    // Cuando cambia la región, cargar provincias
    this.registrationForm.get('idRegion')?.valueChanges.subscribe(regionId => {
      if (regionId) {
        this.cargarProvincias(regionId);
        // Limpiar campos dependientes
        this.registrationForm.patchValue({
          idProvincia: '',
          idComuna: ''
        });
        this.provincias = [];
        this.comunas = [];
      }
    });

    // Cuando cambia la provincia, cargar comunas
    this.registrationForm.get('idProvincia')?.valueChanges.subscribe(provinciaId => {
      if (provinciaId) {
        this.cargarComunas(provinciaId);
        // Limpiar campo dependiente
        this.registrationForm.patchValue({
          idComuna: ''
        });
        this.comunas = [];
      }
    });
  }

  // Cargar provincias por región
  async cargarProvincias(regionId: number): Promise<void> {
    try {
      this.isLoadingGeografia = true;
      this.provincias = await firstValueFrom(this.geografiaService.getProvinciasPorRegion(regionId));
      console.log('Provincias cargadas para región', regionId, ':', this.provincias);
    } catch (error) {
      console.error('Error cargando provincias:', error);
      this.errorMessage = 'Error al cargar las provincias.';
    } finally {
      this.isLoadingGeografia = false;
    }
  }

  // Cargar comunas por provincia
  async cargarComunas(provinciaId: number): Promise<void> {
    try {
      this.isLoadingGeografia = true;
      this.comunas = await firstValueFrom(this.geografiaService.getComunasPorProvincia(provinciaId));
      console.log('Comunas cargadas para provincia', provinciaId, ':', this.comunas);
    } catch (error) {
      console.error('Error cargando comunas:', error);
      this.errorMessage = 'Error al cargar las comunas.';
    } finally {
      this.isLoadingGeografia = false;
    }
  }

  // Method to reset form state
  resetFormState(): void {
    this.isSubmitting = false;
    this.errorMessage = null;
    this.successMessage = null;
    this.selectedFile = null;
    this.fileError = null;
    this.registrationForm.enable();
    this.registrationForm.get('correo')?.disable(); // Keep email disabled
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const fileType = file.type;
      
      // Validate file type
      if (fileType.startsWith('image/') || fileType === 'application/pdf') {
        this.selectedFile = file;
        this.fileError = null;
        
        // Debug: Log file information
        console.log('Selected file:', {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        });
      } else {
        this.selectedFile = null;
        this.fileError = 'Por favor, selecciona un archivo PDF o una imagen.';
      }
    }
  }

  // Debug method to test request format
  testRequestFormat(): void {
    const formData = new FormData();
    formData.append('testField', 'testValue');
    
    if (this.selectedFile) {
      formData.append('file', this.selectedFile, this.selectedFile.name);
    }
    
    console.log('=== REQUEST DEBUG INFO ===');
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }
    
    // Test request without actually sending
    const testRequest = this.http.post(`${environment.apiUrl}/registro-completo`, formData);
    console.log('Request object:', testRequest);
    
    // Check if Content-Type is being set automatically
    console.log('=== CHECK BROWSER NETWORK TAB ===');
    console.log('1. Open DevTools (F12)');
    console.log('2. Go to Network tab');
    console.log('3. Submit the form');
    console.log('4. Look for the request to /api/registro-completo');
    console.log('5. Check that Content-Type is: multipart/form-data; boundary=...');
    console.log('6. The boundary should be automatically generated by the browser');
  }

  async onSubmit(): Promise<void> {
    if (!this.selectedFile) {
      this.fileError = 'Debes subir una prueba de dirección (PDF o imagen) para completar el registro.';
      this.registrationForm.markAllAsTouched();
      return;
    }
    if (this.registrationForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.errorMessage = null;
  
      try {
        const formData = new FormData();
        const formValue = this.registrationForm.getRawValue();
  
        // Append all form fields to FormData
        // Nota: idComunidad se envía automáticamente con valor 3 (comunidad "Provisoria")
        Object.keys(formValue).forEach(key => {
          formData.append(key, formValue[key]);
        });
  
        // Append role, state, and provider
        formData.append('rol', JSON.stringify({ id: 2 })); // USER
        formData.append('estado', JSON.stringify({ id: 1 })); // ACTIVO
        formData.append('proveedorAutenticacion', 'azure');
  
        // Append file if selected
        if (this.selectedFile) {
          formData.append('file', this.selectedFile, this.selectedFile.name);
        }
  
        // 🔐 Obtener el token JWT
        const token = this.authService.getToken();
  
        // 🛰️ Enviar la solicitud con el token en el header
        const response: any = await firstValueFrom(
          this.http.post(`${environment.apiUrl}/registro-completo`, formData, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          })
        );
  
        console.log('Registration successful:', response);
  
        if (response && response.token) {
          this.authService.setToken(response.token);
          console.log('JWT token stored successfully');
          this.successMessage = "¡Registro completado! Serás redirigido al dashboard.";
          this.registrationForm.disable();
          setTimeout(() => this.router.navigate(['/dashboard']), 2000);
        } else {
          console.error('No token received in response:', response);
          this.errorMessage = "Error: No se recibió el token de autenticación. Por favor, contacta al administrador.";
          this.isSubmitting = false;
        }
  
      } catch (error: any) {
        console.error('Registration error:', error);
        if (error.status === 0) {
          this.errorMessage = 'Error de conexión: No se pudo conectar al servidor.';
        } else if (error.status === 400) {
          const errorMessage = error.error || 'Error desconocido';
          if (errorMessage.includes('RUT ya existe')) {
            this.errorMessage = 'El RUT ingresado ya está registrado en el sistema.';
          } else if (errorMessage.includes('correo electrónico ya está registrado')) {
            this.errorMessage = 'El correo electrónico ya está registrado.';
          } else if (errorMessage.includes('nombre de usuario ya está en uso')) {
            this.errorMessage = 'El nombre de usuario ya está en uso. Por favor, elige otro.';
          } else {
            this.errorMessage = errorMessage;
          }
        } else if (error.status === 413) {
          this.errorMessage = 'El archivo es demasiado grande.';
        } else if (error.status === 415) {
          this.errorMessage = 'Tipo de archivo no soportado.';
        } else if (error.status >= 500) {
          this.errorMessage = 'Error del servidor. Inténtalo de nuevo más tarde.';
        } else {
          this.errorMessage = error.error?.message || 'Hubo un error al completar el registro.';
        }
      } finally {
        this.isSubmitting = false;
      }
    } else if (this.isSubmitting) {
      console.log('Form submission already in progress, ignoring duplicate request');
    } else {
      this.registrationForm.markAllAsTouched();
    }
  }
  
} 