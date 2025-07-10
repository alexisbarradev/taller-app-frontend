import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { RouterModule } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-all-products',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './all-products.component.html',
  styleUrls: ['./all-products.component.css']
})
export class AllProductsComponent implements OnInit {
  products: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(private http: HttpClient, private userService: UserService) {}

  ngOnInit(): void {
    this.fetchAllProducts();
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
} 