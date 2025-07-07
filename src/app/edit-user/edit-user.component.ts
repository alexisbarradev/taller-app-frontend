import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { UserService, Usuario, RolUsuario, EstadoUsuario } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.css']
})
export class EditUserComponent implements OnInit {
  editForm!: FormGroup;
  userId!: number;
  loading = true;
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;
  selectedFile: File | null = null;
  fileError: string | null = null;
  currentUser: Usuario | null = null;

  // Available roles and states
  roles: RolUsuario[] = [
    { id: 1, nombre: 'Administrador' },
    { id: 2, nombre: 'Usuario' }
  ];

  estados: EstadoUsuario[] = [
    { id: 1, estado: 'Activo' },
    { id: 2, estado: 'Inactivo' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private userService: UserService,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.editForm = this.fb.group({
      rut: ['', Validators.required],
      primerNombre: ['', Validators.required],
      segundoNombre: [''],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: ['', Validators.required],
      direccion: ['', Validators.required],
      usuario: ['', Validators.required],
      correo: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      rolId: ['', Validators.required], // Store only the ID
      estadoId: ['', Validators.required], // Store only the ID
      urlContrato: ['']
    });

    this.route.paramMap.subscribe(async params => {
      const id = params.get('id');
      if (id) {
        this.userId = +id;
        try {
          const user = await this.userService.getUsuarioPorId(this.userId);
          if (user) {
            this.currentUser = user;
            this.editForm.patchValue({
              rut: user.rut,
              primerNombre: user.primerNombre,
              segundoNombre: user.segundoNombre,
              apellidoPaterno: user.apellidoPaterno,
              apellidoMaterno: user.apellidoMaterno,
              direccion: user.direccion,
              usuario: user.usuario,
              correo: user.correo,
              rolId: user.rol?.id || '', // Store only the ID
              estadoId: user.estado?.id || '', // Store only the ID
              urlContrato: user.urlContrato || ''
            });
          }
        } catch (err: any) {
          this.errorMessage = err.message || 'Error al cargar usuario';
        } finally {
          this.loading = false;
        }
      }
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

  async onSubmit() {
    if (this.editForm.invalid || this.isSubmitting) return;
    
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.fileError = null;

    try {
      const formData = new FormData();
      const formValue = this.editForm.getRawValue();

      // Append all form fields to FormData (except rolId, estadoId, and correo)
      Object.keys(formValue).forEach(key => {
        if (key !== 'correo' && key !== 'rolId' && key !== 'estadoId') {
          formData.append(key, formValue[key]);
        }
      });

      // Append JSON strings for rol and estado with only the id field
      const rolId = formValue.rolId;
      const estadoId = formValue.estadoId;
      
      if (rolId) {
        formData.append('rol', JSON.stringify({ id: rolId }));
      } else {
        throw new Error('Rol no válido');
      }
      
      if (estadoId) {
        formData.append('estado', JSON.stringify({ id: estadoId }));
      } else {
        throw new Error('Estado no válido');
      }
      
      formData.append('proveedorAutenticacion', 'azure');

      // Append file if selected
      if (this.selectedFile) {
        formData.append('file', this.selectedFile, this.selectedFile.name);
      }

      // Get JWT token
      const token = this.authService.getToken();

      // Send PUT request with multipart/form-data
      const response: any = await firstValueFrom(
        this.http.put(`${environment.apiUrl}/usuarios/${this.userId}`, formData, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
      );

      console.log('Update successful:', response);
      this.successMessage = 'Usuario actualizado correctamente';
      setTimeout(() => this.router.navigate(['/usuarios']), 1200);

    } catch (error: any) {
      console.error('Update error:', error);
      if (error.status === 0) {
        this.errorMessage = 'Error de conexión: No se pudo conectar al servidor.';
      } else if (error.status === 400) {
        const errorMessage = error.error?.mensaje || error.error || 'Error al actualizar usuario';
        this.errorMessage = errorMessage;
      } else if (error.status === 401) {
        this.errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
      } else {
        this.errorMessage = error.error?.mensaje || 'Error al actualizar usuario';
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  // Helper method to get role name for display
  getRoleName(roleId: number): string {
    const role = this.roles.find(r => r.id === roleId);
    return role ? role.nombre : '';
  }

  // Helper method to get state name for display
  getEstadoName(estadoId: number): string {
    const estado = this.estados.find(e => e.id === estadoId);
    return estado ? estado.estado : '';
  }
} 