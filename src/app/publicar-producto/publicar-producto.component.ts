import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
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

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
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

    // Obtener datos del usuario autenticado para idAutor
    const token = this.authService.getToken();
    if (token) {
      try {
        const user: any = this.authService.getUserInfo();
        this.publicacion.idAutor = user?.id || null;
      } catch (e) {
        this.publicacion.idAutor = null;
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onSubmit(estado: number): void {
    const token = this.authService.getToken();
    if (!token) {
      alert('Debes iniciar sesión');
      return;
    }

    // Armar el body como espera el backend
    const body = {
      titulo: this.publicacion.titulo,
      descripcion: this.publicacion.descripcion,
      precio: this.publicacion.precio,
      idAutor: this.publicacion.idAutor,
      estado: { id: estado }
      // foto: this.publicacion.foto // Pendiente: enviar foto
    };

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.post(`${environment.publicacionesApiUrl}/publicaciones`, body, { headers }).subscribe({
      next: resp => {
        if (estado === 1) {
          alert('¡Producto publicado!');
        } else {
          alert('¡Guardado como borrador!');
        }
        this.router.navigate(['/mis-productos']);
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