import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  imports: [CommonModule, ReactiveFormsModule],
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  selectedFile: File | null = null;
  fileError: string | null = null;
  isUploading: boolean = false;

  constructor(private fb: FormBuilder, private router: Router, private http: HttpClient) {
    this.registerForm = this.fb.group({
      rut: ['', Validators.required],
      primerNombre: ['', Validators.required],
      segundoNombre: [''],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: ['', Validators.required],
      direccion: ['', Validators.required],
      usuario: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(18)]]
    });
  }

  hasError(controlName: string): boolean {
    const control = this.registerForm.get(controlName);
    return control ? control.invalid && control.touched : false;
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
      } else {
        this.selectedFile = null;
        this.fileError = 'Por favor, selecciona un archivo PDF o una imagen.';
      }
    }
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.valid) {
      this.isUploading = true;
      this.errorMessage = null;
      this.successMessage = null;

      try {
        let urlContrato = null;

        // If a file is selected, upload it first
        if (this.selectedFile) {
          const formData = new FormData();
          formData.append('file', this.selectedFile);

          try {
            const uploadResponse = await this.http.post<{ url: string }>('http://localhost:8080/api/upload', formData).toPromise();
            urlContrato = uploadResponse?.url;
          } catch (error) {
            this.errorMessage = 'Error al subir el archivo. Por favor, intenta nuevamente.';
            this.isUploading = false;
            return;
          }
        }

        // Prepare the user registration payload
        const formValue = this.registerForm.value;
        const payload = {
          rut: formValue.rut,
          primerNombre: formValue.primerNombre,
          segundoNombre: formValue.segundoNombre,
          apellidoPaterno: formValue.apellidoPaterno,
          apellidoMaterno: formValue.apellidoMaterno,
          direccion: formValue.direccion,
          usuario: formValue.usuario,
          correo: formValue.correo,
          password: formValue.password,
          rol: { id: 2 }, // USER
          estado: { id: 2 }, // INACTIVO
          urlContrato: urlContrato
        };

        // Register the user
        this.http.post('http://localhost:8080/api/registro', payload, { responseType: 'text' }).subscribe({
          next: (msg) => {
            this.successMessage = msg;
            this.errorMessage = null;
            this.registerForm.reset();
            this.selectedFile = null;
            this.isUploading = false;
          },
          error: (err) => {
            this.errorMessage = err.error || 'Error al registrar usuario.';
            this.successMessage = null;
            this.isUploading = false;
          }
        });
      } catch (error) {
        this.errorMessage = 'Error inesperado. Por favor, intenta nuevamente.';
        this.isUploading = false;
      }
    } else {
      this.registerForm.markAllAsTouched();
      this.errorMessage = 'Por favor, completa todos los campos correctamente.';
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
} 