import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, Usuario } from '../services/user.service';

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

  constructor(private userService: UserService) {}

  async ngOnInit() {
    try {
      this.users = await this.userService.listarUsuarios();
    } catch (err: any) {
      this.error = err.message || 'Error al cargar usuarios';
    } finally {
      this.loading = false;
    }
  }
} 