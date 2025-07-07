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
      rolId: ['', Validators.required],
      estadoId: ['', Validators.required],
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
              rolId: user.rol?.id || '',
              estadoId: user.estado?.id || '',
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

      if (fileType.startsWith('image/') || fileType === 'application/pdf') {
        this.selectedFile = file;
        this.fileError = null;
      } else {
        this.selectedFile = null;
        this.fileError = 'Por favor, selecciona un archivo PDF o una imagen.';
      }
    }
  }

  async onSubmit() {
    console.log('🔍 Updating user with ID:', this.userId);

    const formValue = this.editForm.getRawValue(); // Incluye campos deshabilitados
    console.log('📧 Correo value on submit:', formValue.correo);

    if (this.editForm.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.fileError = null;

    try {
      const formData = new FormData();

      // Agregar todos los campos excepto rol, estado y correo
      Object.keys(formValue).forEach(key => {
        if (key !== 'rolId' && key !== 'estadoId' && key !== 'correo') {
          formData.append(key, formValue[key]);
        }
      });

      // Agregar correo solo una vez, usando el valor de this.currentUser.correo
      if (this.currentUser?.correo) {
        formData.append('correo', this.currentUser.correo);
      }

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

      if (this.selectedFile) {
        formData.append('file', this.selectedFile, this.selectedFile.name);
      }

      const token = this.authService.getToken();

      const response: any = await firstValueFrom(
        this.http.put(`${environment.apiUrl}/usuarios/${this.userId}`, formData, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
      );

      console.log('Update successful:', response);
      this.successMessage = 'Usuario actualizado correctamente';
      setTimeout(() => this.router.navigate(['/dashboard/usuarios']), 1200);

    } catch (error: any) {
      console.error('Update error:', error);
      if (error.status === 0) {
        this.errorMessage = 'Error de conexión: No se pudo conectar al servidor.';
      } else if (error.status === 400) {
        this.errorMessage = error.error?.mensaje || error.error || 'Error al actualizar usuario';
      } else if (error.status === 401) {
        this.errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
      } else {
        this.errorMessage = error.error?.mensaje || 'Error al actualizar usuario';
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  getRoleName(roleId: number): string {
    const role = this.roles.find(r => r.id === roleId);
    return role ? role.nombre : '';
  }

  getEstadoName(estadoId: number): string {
    const estado = this.estados.find(e => e.id === estadoId);
    return estado ? estado.estado : '';
  }
}
