import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-publicar-producto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './publicar-producto.component.html',
  styleUrls: ['./publicar-producto.component.css']
})
export class PublicarProductoComponent implements OnInit {
  title = 'Publicar Producto';
  username: string = 'Invitado';
  userRole: string = '';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    // You can add logic here if needed
  }

  logout(): void {
    // Placeholder for logout logic
    this.router.navigate(['/login']);
  }
} 