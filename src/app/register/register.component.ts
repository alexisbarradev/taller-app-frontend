import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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
        const formData = new FormData();
        
        // Append all form fields
        const formValue = this.registerForm.value;
        Object.keys(formValue).forEach(key => {
          formData.append(key, formValue[key]);
        });

        // Append role and state
        formData.append('rol', JSON.stringify({ id: 2 })); // USER
        formData.append('estado', JSON.stringify({ id: 2 })); // INACTIVO

        // Append file if selected
        if (this.selectedFile) {
          formData.append('file', this.selectedFile);
        }

        // Send everything in a single request
        const response = await firstValueFrom(
          this.http.post('http://localhost:8080/api/registro-completo', formData, { responseType: 'text' })
        );
        
        this.successMessage = response;
        this.errorMessage = null;
        this.registerForm.reset();
        this.selectedFile = null;
        
        // Redirect to login after successful registration
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      } catch (error: any) {
        console.error('Error during registration:', error);
        this.errorMessage = error.error || 'Error al registrar usuario. Por favor, intenta nuevamente.';
        this.successMessage = null;
      } finally {
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