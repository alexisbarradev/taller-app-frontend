import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RouterModule } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-publicar-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './publicar-producto.component.html',
  styleUrls: ['./publicar-producto.component.css']
})
export class PublicarProductoComponent implements OnInit, OnDestroy {
  title = 'Publicar Producto';
  username: string = 'Invitado';
  userRole: string = '';
  isAdmin: boolean = false;
  private subscriptions = new Subscription();

  // Modelo para el formulario
  publicacion = {
    titulo: '',
    descripcion: '',
    precio: null as number | null,
    idAutor: null as number | null, // Se obtiene del usuario autenticado
    // foto: null as File | null // Pendiente: campo para la foto
  };

  estados: any[] = []; // Lista de estados para el select
  foto: File | null = null;
  fotoPreview: string | ArrayBuffer | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    const token = this.authService.getToken();
    console.log('[PublicarProducto] Token en ngOnInit:', token);
    // Obtener estados desde el backend de publicaciones
    this.http.get<any[]>(`${environment.publicacionesApiUrl}/estados`)
      .subscribe(data => this.estados = data);

    // Suscribirse al nombre de usuario del UserService
    this.subscriptions.add(
      this.userService.userName$.subscribe(name => {
        this.username = name;
        // Si el nombre es 'Invitado' o 'unknown', forzar actualización
        if (!name || name === 'Invitado' || name === 'unknown') {
          const msalName = this.userService.getUserNameFromMSAL();
          this.userService.setUserName(msalName);
          this.username = msalName;
        }
      })
    );

    // Extraer el email del usuario autenticado desde el token (revisar emails[0] y email)
    const user = this.authService.getUserInfo();
    console.log('[PublicarProducto] userInfo extraído:', user);
    const email = user?.email || (Array.isArray(user?.emails) && user.emails[0]) || undefined;
    console.log('[PublicarProducto] Email extraído:', email);
    if (email) {
      this.userService.getUsuarioIdPorCorreo(email).then(id => {
        console.log('[PublicarProducto] id obtenido para publicación:', id);
        this.publicacion.idAutor = id;
      }).catch(err => {
        console.error('[PublicarProducto] Error al obtener id por correo:', err);
      });

      // Obtener información completa del usuario para verificar el rol
      this.userService.getUsuarioPorCorreo(email).then(usuario => {
        if (usuario && usuario.rol) {
          this.userRole = usuario.rol.nombre;
          this.isAdmin = this.userRole.toLowerCase() === 'administrador';
          console.log('[PublicarProducto] Rol detectado:', this.userRole, 'isAdmin:', this.isAdmin);
        }
      }).catch(err => {
        console.error('[PublicarProducto] Error al obtener información del usuario:', err);
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.foto = input.files[0];
      const reader = new FileReader();
      reader.onload = e => {
        this.fotoPreview = reader.result;
      };
      reader.readAsDataURL(this.foto);
    } else {
      this.foto = null;
      this.fotoPreview = null;
    }
  }

  onSubmit(estado: number): void {
    console.log('[PublicarProducto] idAutor antes de enviar:', this.publicacion.idAutor);
    const token = this.authService.getToken();
    if (!token) {
      alert('Debes iniciar sesión');
      return;
    }

    const formData = new FormData();
    formData.append('titulo', this.publicacion.titulo);
    formData.append('descripcion', this.publicacion.descripcion);
    formData.append('precio', this.publicacion.precio?.toString() || '');
    formData.append('idAutor', this.publicacion.idAutor?.toString() || '');
    formData.append('estadoId', estado.toString());
    if (this.foto) {
      formData.append('file', this.foto);
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // 'Content-Type' no se debe establecer manualmente para FormData
    });

    this.http.post(`${environment.publicacionesApiUrl}/publicaciones`, formData, { headers }).subscribe({
      next: resp => {
        if (estado === 1) {
          alert('¡Producto publicado!');
        } else {
          alert('¡Guardado como borrador!');
        }
        this.router.navigate(['../mis-productos'], { relativeTo: this.route });
      },
      error: err => {
        alert('Error al publicar: ' + (err.error?.message || err.statusText));
      }
    });
  }

  // Pendiente: método para manejar la foto
  // onFileSelected(event: Event): void {
  //   const input = event.target as HTMLInputElement;
  //   if (input.files && input.files.length > 0) {
  //     this.publicacion.foto = input.files[0];
  //   }
  // }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
} 