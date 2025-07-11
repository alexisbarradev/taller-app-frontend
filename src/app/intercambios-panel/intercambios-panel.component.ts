import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, Usuario } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-intercambios-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './intercambios-panel.component.html',
  styleUrls: ['./intercambios-panel.component.css']
})
export class IntercambiosPanelComponent implements OnInit {
  currentUserId: number | null = null;
  ofertasRecibidas: any[] = [];
  ofertasEnviadas: any[] = [];
  loading = true;
  error: string | null = null;
  activeTab: 'recibidas' | 'enviadas' = 'recibidas';
  userNames: { [id: number]: string } = {};
  loadingNames: Set<number> = new Set();

  constructor(
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  async ngOnInit() {
    await this.setCurrentUserId();
    if (this.currentUserId) {
      this.loadOfertas();
    } else {
      this.error = 'No se pudo obtener el usuario actual';
      this.loading = false;
    }
  }

  async setCurrentUserId() {
    const user = this.authService.getUserInfo();
    const email = user?.email || (Array.isArray(user?.emails) && user.emails[0]) || undefined;
    if (email) {
      try {
        const id = await this.userService.getUsuarioIdPorCorreo(email);
        this.currentUserId = id;
      } catch (err) {
        this.currentUserId = null;
      }
    } else {
      this.currentUserId = null;
    }
  }

  loadOfertas() {
    this.loading = true;
    this.error = null;

    console.log('Cargando ofertas para userId:', this.currentUserId);

    // Cargar ofertas recibidas
    this.apiService.getOfertasRecibidas(this.currentUserId!).subscribe({
      next: (ofertas) => {
        this.ofertasRecibidas = ofertas;
        this.loading = false;
        console.log('Ofertas recibidas:', ofertas);
      },
      error: (err) => {
        this.error = 'Error al cargar las ofertas recibidas';
        this.loading = false;
        console.error('Error al cargar ofertas recibidas:', err);
      }
    });

    // Cargar ofertas enviadas
    this.apiService.getOfertasEnviadas(this.currentUserId!).subscribe({
      next: (ofertas) => {
        this.ofertasEnviadas = ofertas;
        console.log('Ofertas enviadas:', ofertas);
      },
      error: (err) => {
        console.error('Error al cargar ofertas enviadas:', err);
      }
    });
  }

  aceptarOferta(intercambioId: number) {
    if (confirm('¿Estás seguro de que quieres aceptar esta oferta de intercambio?')) {
      this.apiService.aceptarOferta(intercambioId).subscribe({
        next: (response) => {
          alert('Oferta aceptada correctamente. El intercambio está en proceso.');
          this.loadOfertas(); // Recargar las ofertas
        },
        error: (err) => {
          alert(err.error || 'Error al aceptar la oferta');
        }
      });
    }
  }

  rechazarOferta(intercambioId: number) {
    if (confirm('¿Estás seguro de que quieres rechazar esta oferta de intercambio?')) {
      this.apiService.rechazarOferta(intercambioId).subscribe({
        next: (response) => {
          alert('Oferta rechazada correctamente.');
          this.loadOfertas(); // Recargar las ofertas
        },
        error: (err) => {
          alert(err.error || 'Error al rechazar la oferta');
        }
      });
    }
  }

  confirmarIntercambio(intercambioId: number) {
    if (!this.currentUserId) return;
    if (confirm('¿Confirmas que recibiste el producto y el intercambio fue exitoso?')) {
      this.apiService.confirmarIntercambio(intercambioId, this.currentUserId).subscribe({
        next: () => {
          alert('¡Intercambio confirmado!');
          this.loadOfertas();
        },
        error: (err) => {
          alert(err.error || 'Error al confirmar el intercambio');
        }
      });
    }
  }

  revertirIntercambio(intercambioId: number) {
    if (!this.currentUserId) return;
    if (confirm('¿Seguro que quieres revertir el intercambio y devolver el producto a publicado?')) {
      this.apiService.revertirIntercambio(intercambioId, this.currentUserId).subscribe({
        next: () => {
          alert('Intercambio revertido. El producto vuelve a estar publicado.');
          this.loadOfertas();
        },
        error: (err) => {
          alert(err.error || 'Error al revertir el intercambio');
        }
      });
    }
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'estado-pendiente';
      case 'ACEPTADO':
        return 'estado-aceptado';
      case 'RECHAZADO':
        return 'estado-rechazado';
      case 'CANCELADO':
        return 'estado-cancelado';
      default:
        return 'estado-default';
    }
  }

  getEstadoText(estado: string): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'Pendiente';
      case 'ACEPTADO':
        return 'Aceptado';
      case 'RECHAZADO':
        return 'Rechazado';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return estado;
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  verProducto(productoId: number) {
    this.router.navigate(['/producto', productoId]);
  }

  cambiarTab(tab: 'recibidas' | 'enviadas') {
    this.activeTab = tab;
  }

  getUserNameById(userId: number): string {
    if (this.userNames[userId]) {
      return this.userNames[userId];
    }
    if (!this.loadingNames.has(userId)) {
      this.loadingNames.add(userId);
      this.userService.getUsuarioPorId(userId).then(usuario => {
        if (usuario && usuario.primerNombre && usuario.apellidoPaterno) {
          this.userNames[userId] = `${usuario.primerNombre} ${usuario.apellidoPaterno}`;
        } else if (usuario && usuario.primerNombre) {
          this.userNames[userId] = usuario.primerNombre;
        } else {
          this.userNames[userId] = 'Usuario ' + userId;
        }
        this.loadingNames.delete(userId);
      });
    }
    return '';
  }
} 