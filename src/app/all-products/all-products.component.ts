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
        console.log('Estructura de productos recibidos:', data);
        // Deja todos los productos sin filtrar para inspección visual
        this.products = data;
        this.loading = false;
      },
      error: err => {
        this.error = 'Error al cargar el listado global de productos.';
        this.loading = false;
      }
    });
  }
} 