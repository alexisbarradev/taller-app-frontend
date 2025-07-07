import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, Usuario } from '../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css']
})
export class UsersListComponent implements OnInit {
  users: Usuario[] = [];
  error: string = '';
  loading: boolean = true;

  constructor(private userService: UserService, private router: Router) {}

  async ngOnInit() {
    try {
      this.users = await this.userService.listarUsuarios();
    } catch (err: any) {
      this.error = err.message || 'Error al cargar usuarios';
    } finally {
      this.loading = false;
    }
  }

  async eliminarUsuario(id: number) {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;
    try {
      await this.userService.eliminarUsuario(id);
      this.users = this.users.filter(u => u.id !== id);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar usuario');
    }
  }

  editarUsuario(id: number) {
    this.router.navigate(['/dashboard/edit-user', id]);
  }
} 