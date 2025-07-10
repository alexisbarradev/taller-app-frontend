import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { RouterModule } from '@angular/router';
import { UserService } from '../services/user.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-all-products',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './all-products.component.html',
  styleUrls: ['./all-products.component.css']
})
export class AllProductsComponent implements OnInit {
  products: any[] = [];
  loading = false;
  error: string | null = null;
  editingProductId: number | null = null;
  editedProduct = { titulo: '', descripcion: '', precio: 0, estado: null };
  estados: any[] = [];

  constructor(private http: HttpClient, private userService: UserService) {}

  ngOnInit(): void {
    this.fetchAllProducts();
    this.fetchEstados();
  }

  fetchAllProducts(): void {
    this.loading = true;
    this.error = null;
    const token = localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;
    this.http.get<any[]>(`${environment.publicacionesApiUrl}/publicaciones`, { headers }).subscribe({
      next: data => {
        const rol = this.userService.getRol();
        console.log('Rol actual:', rol);
        if ((typeof rol === 'number' && rol === 1) || (typeof rol === 'object' && rol && (rol as any).id === 1)) {
          this.products = data;
        } else {
          this.products = data.filter(
            p => p.estado && typeof p.estado.nombre === 'string' && p.estado.nombre.trim().toLowerCase() === 'publicado'
          );
        }
        this.loading = false;
      },
      error: err => {
        this.error = 'Error al cargar el listado global de productos.';
        this.loading = false;
      }
    });
  }

  fetchEstados(): void {
    const token = localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;
    this.http.get<any[]>(`${environment.publicacionesApiUrl}/estados`, { headers }).subscribe({
      next: data => {
        this.estados = data;
      },
      error: err => {
        this.estados = [];
      }
    });
  }

  isAdmin(): boolean {
    const rol = this.userService.getRol();
    return ((typeof rol === 'number' && rol === 1) || (typeof rol === 'object' && rol && (rol as any).id === 1)) ? true : false;
  }

  borrarPublicacion(id: number) {
    if (!this.isAdmin()) return;
    if (confirm('¿Seguro que deseas borrar esta publicación?')) {
      const token = localStorage.getItem('token');
      const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;
      this.http.delete(`${environment.publicacionesApiUrl}/publicaciones/${id}`, { headers }).subscribe({
        next: () => {
          this.products = this.products.filter(p => p.id !== id);
          alert('Publicación eliminada correctamente');
        },
        error: () => alert('Error al eliminar la publicación')
      });
    }
  }

  editarPublicacion(product: any) {
    if (!this.isAdmin()) return;
    this.editingProductId = product.id;
    this.editedProduct = {
      titulo: product.titulo,
      descripcion: product.descripcion,
      precio: product.precio,
      estado: product.estado?.id || product.estado // asume que estado puede ser objeto o id
    };
  }

  cancelarEdicionPublicacion() {
    this.editingProductId = null;
    this.editedProduct = { titulo: '', descripcion: '', precio: 0, estado: null };
  }

  guardarEdicionPublicacion(product: any) {
    if (!this.isAdmin()) return;
    const token = localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;
    // Limpiar el objeto: solo los campos requeridos
    const datosActualizados = {
      id: product.id,
      titulo: this.editedProduct.titulo,
      descripcion: this.editedProduct.descripcion,
      precio: this.editedProduct.precio,
      estado: this.editedProduct.estado
    };
    console.log('Enviando al backend:', datosActualizados);
    this.http.put<any>(`${environment.publicacionesApiUrl}/publicaciones/${product.id}`, datosActualizados, { headers }).subscribe({
      next: (updated) => {
        const idx = this.products.findIndex(p => p.id === product.id);
        if (idx !== -1) this.products[idx] = updated;
        this.cancelarEdicionPublicacion();
        alert('Publicación editada correctamente');
      },
      error: (err) => {
        alert('Error al editar la publicación');
        console.error('Error PUT:', err);
      }
    });
  }
} 