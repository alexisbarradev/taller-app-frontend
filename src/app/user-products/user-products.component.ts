import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { environment } from '../../environments/environment';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-products',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-products.component.html',
  styleUrls: ['./user-products.component.css']
})
export class UserProductsComponent implements OnInit {
  products: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private userService: UserService
  ) {}

  async ngOnInit() {
    this.loading = true;
    this.error = null;
    this.products = [];
    try {
      const token = this.authService.getToken();
      console.log('[UserProducts] Token en ngOnInit:', token);
      const user = this.authService.getUserInfo();
      console.log('[UserProducts] userInfo extraído:', user);
      const email = user?.email || (Array.isArray(user?.emails) && user.emails[0]) || undefined;
      console.log('[UserProducts] Email extraído:', email);
      if (!email) throw new Error('User email not found.');
      const id = await this.userService.getUsuarioIdPorCorreo(email);
      console.log('[UserProducts] id obtenido para consulta:', id);
      if (!id) throw new Error('User id not found.');
      if (!token) throw new Error('No token available.');
      const response = await fetch(`${environment.publicacionesApiUrl}/publicaciones/autor/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        if (response.status === 401) throw new Error('No autorizado. Debe iniciar sesión.');
        throw new Error('Error al obtener los productos.');
      }
      this.products = await response.json();
    } catch (err: any) {
      console.error('[UserProducts] Error en ngOnInit:', err);
      this.error = err.message || 'Error cargando productos.';
    } finally {
      this.loading = false;
    }
  }
} 