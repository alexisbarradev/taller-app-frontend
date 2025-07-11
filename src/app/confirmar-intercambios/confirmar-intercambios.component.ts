import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-confirmar-intercambios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmar-intercambios.component.html',
  styleUrls: ['./confirmar-intercambios.component.css']
})
export class ConfirmarIntercambiosComponent implements OnInit {
  intercambios: any[] = [];
  loading = true;
  error: string | null = null;
  currentUserId: number | null = null;
  userNames: { [id: number]: string } = {};
  loadingNames: Set<number> = new Set();

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    console.log('[ConfirmarIntercambios] ngOnInit');
    const userIdStr = localStorage.getItem('userId');
    this.currentUserId = userIdStr ? Number(userIdStr) : null;
    console.log('[ConfirmarIntercambios] currentUserId:', this.currentUserId);
    if (this.currentUserId) {
      this.loadIntercambios();
    } else {
      this.error = 'No se pudo obtener el usuario actual';
      this.loading = false;
    }
  }

  loadIntercambios() {
    this.loading = true;
    this.error = null;
    console.log('[ConfirmarIntercambios] loadIntercambios, currentUserId:', this.currentUserId);
    Promise.all([
      this.apiService.getOfertasRecibidas(this.currentUserId!).toPromise(),
      this.apiService.getOfertasEnviadas(this.currentUserId!).toPromise()
    ]).then(([recibidas, enviadas]) => {
      console.log('[ConfirmarIntercambios] Ofertas recibidas:', recibidas);
      console.log('[ConfirmarIntercambios] Ofertas enviadas:', enviadas);
      this.intercambios = [...recibidas, ...enviadas].filter(
        (o: any) => o.estadoIntercambio === 'ACEPTADO' || o.estadoIntercambio === 'PROCESO'
      );
      this.loading = false;
      console.log('[ConfirmarIntercambios] Intercambios a mostrar:', this.intercambios);
    }).catch((err) => {
      this.error = 'Error al cargar los intercambios';
      this.loading = false;
      console.error('[ConfirmarIntercambios] Error al cargar intercambios:', err);
    });
  }

  confirmarIntercambio(intercambioId: number) {
    if (!this.currentUserId) return;
    if (confirm('¿Confirmas que recibiste el producto y el intercambio fue exitoso?')) {
      this.apiService.confirmarIntercambio(intercambioId, this.currentUserId).subscribe({
        next: () => {
          alert('¡Intercambio confirmado!');
          this.loadIntercambios();
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
          this.loadIntercambios();
        },
        error: (err) => {
          alert(err.error || 'Error al revertir el intercambio');
        }
      });
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

  // Agregado para debug: mostrar los endpoints usados para confirmar/revertir
  getConfirmarEndpoint(intercambioId: number): string {
    return `/api/intercambios/${intercambioId}/confirmar?userId=${this.currentUserId}`;
  }

  getRevertirEndpoint(intercambioId: number): string {
    return `/api/intercambios/${intercambioId}/revertir?userId=${this.currentUserId}`;
  }

  esMiConfirmacionPendiente(oferta: any): boolean {
    if (this.currentUserId === oferta.idUsuarioPropietario) {
      return oferta.confirmacionPropietario === 'PENDIENTE';
    } else if (this.currentUserId === oferta.idUsuarioSolicitante) {
      return oferta.confirmacionSolicitante === 'PENDIENTE';
    }
    return false;
  }

  esConfirmacionPendienteDelOtro(oferta: any): boolean {
    if (this.currentUserId === oferta.idUsuarioPropietario) {
      return oferta.confirmacionSolicitante === 'PENDIENTE';
    } else if (this.currentUserId === oferta.idUsuarioSolicitante) {
      return oferta.confirmacionPropietario === 'PENDIENTE';
    }
    return false;
  }
} 