import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ComunidadService, Comunidad, Torre } from '../services/comunidad.service';

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

  comunidades: Comunidad[] = [];
  torres: Torre[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private comunidadService: ComunidadService
  ) {
    this.registrationForm = this.fb.group({
      rut: ['', Validators.required],
      primerNombre: ['', Validators.required],
      segundoNombre: [''],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: ['', Validators.required],
      usuario: ['', Validators.required],
      correo: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      comunidadId: ['', Validators.required],
      torreId: [''],
      numeroUnidad: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadComunidades();

    this.route.queryParams.subscribe(params => {
      const email = params['email'];
      const name = params['name'] || '';
      
      const nameParts = name.split(' ');
      this.registrationForm.patchValue({
        correo: email,
        primerNombre: nameParts[0] || '',
        segundoNombre: nameParts.length > 2 ? nameParts[1] : '',
        apellidoPaterno: nameParts.length > 1 ? (nameParts.length > 2 ? nameParts[2] : nameParts[1]) : ''
      });
    });
  }

  loadComunidades(): void {
    this.comunidadService.getComunidades().subscribe({
      next: (data) => this.comunidades = data,
      error: () => this.errorMessage = 'Error al cargar las comunidades.'
    });
  }

  onComunidadChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const comunidadId = Number(target.value);
    
    this.torres = [];
    this.registrationForm.get('torreId')?.reset('');

    if (comunidadId) {
      this.comunidadService.getTorresByComunidadId(comunidadId).subscribe({
        next: (data) => this.torres = data,
        error: () => this.errorMessage = 'Error al cargar las torres.'
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const fileType = file.type;
      
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
        const formValue = this.registrationForm.getRawValue();

        const requestPayload = {
            ...formValue,
            rolId: 2, // USER
            estadoId: 1, // ACTIVO
            proveedorAutenticacion: 'azure'
        };

        const formData = new FormData();
        formData.append('request', new Blob([JSON.stringify(requestPayload)], { type: 'application/json' }));

        if (this.selectedFile) {
            formData.append('file', this.selectedFile, this.selectedFile.name);
        }
        
        await firstValueFrom(this.http.post('http://localhost:8080/api/registro-nuevo', formData));
        
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