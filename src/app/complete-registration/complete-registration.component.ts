import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {
    this.registrationForm = this.fb.group({
      rut: ['', Validators.required],
      primerNombre: ['', Validators.required],
      segundoNombre: [''],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: ['', Validators.required],
      direccion: ['', Validators.required],
      usuario: ['', Validators.required],
      correo: [{ value: '', disabled: true }, [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const email = params['email'];
      const name = params['name'] || '';
      
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
    if (this.registrationForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = null;

      try {
        const formData = new FormData();
        const formValue = this.registrationForm.getRawValue();

        // Append all form fields to FormData
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
        
        // Use the correct endpoint that handles multipart/form-data
        await firstValueFrom(this.http.post('http://localhost:8080/api/registro-completo', formData));
        
        this.successMessage = "¡Registro completado! Serás redirigido al dashboard.";
        setTimeout(() => this.router.navigate(['/dashboard']), 2000);

      } catch (error: any) {
        this.errorMessage = error.error?.message || 'Hubo un error al completar el registro.';
      } finally {
        this.isSubmitting = false;
      }
    } else {
      this.registrationForm.markAllAsTouched();
    }
  }
} 