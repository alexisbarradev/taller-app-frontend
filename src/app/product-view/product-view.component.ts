import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, Usuario } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-product-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-view.component.html',
  styleUrls: ['./product-view.component.css']
})
export class ProductViewComponent implements OnInit {
  product: any = null;
  comments: any[] = [];
  loading = true;
  loadingComments = false;
  error: string | null = null;
  commentError: string | null = null;
  autorNombre: string | null = null;
  mapaUsuarios: { [id: number]: string } = {};
  currentUserId: number | null = null;
  
  // Nuevo comentario
  newComment = {
    texto: '',
    valoracion: 5
  };
  submittingComment = false;
  editingCommentId: number | null = null;
  editedComment = { texto: '', valoracion: 5 };

  // Variables para intercambio
  showIntercambioModal = false;
  userProducts: any[] = [];
  selectedProductId: number | null = null;
  loadingUserProducts = false;
  intercambioError: string | null = null;
  submittingIntercambio = false;

  // Estado UX para cambio de estado
  cambiandoEstado = false;
  estadoError: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID de producto no especificado.';
      this.loading = false;
      return;
    }
    await this.setCurrentUserId();
    this.loadProduct(id);
    this.loadComments(id);
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

  loadProduct(id: string): void {
    const token = localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;
    
    this.http.get<any>(`${environment.publicacionesApiUrl}/publicaciones/${id}`, { headers }).subscribe({
      next: data => {
        this.product = data;
        this.loading = false;
        this.loadAutorNombre();
      },
      error: err => {
        this.error = 'Error al cargar el producto.';
        this.loading = false;
      }
    });
  }

  loadAutorNombre(): void {
    if (!this.product || !this.product.idAutor) {
      this.autorNombre = null;
      return;
    }
    this.userService.getUsuarioPorId(this.product.idAutor).then((usuario: Usuario | null) => {
      if (usuario) {
        this.autorNombre = `${usuario.primerNombre} ${usuario.apellidoPaterno}`;
      } else {
        this.autorNombre = `Usuario ${this.product.idAutor}`;
      }
    }).catch(() => {
      this.autorNombre = `Usuario ${this.product.idAutor}`;
    });
  }

  loadComments(publicationId: string): void {
    this.loadingComments = true;
    const token = localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;
    
    this.http.get<any[]>(`${environment.publicacionesApiUrl}/comentarios/publicacion/${publicationId}`, { headers }).subscribe({
      next: data => {
        this.comments = data;
        this.loadingComments = false;
        this.loadAutoresComentarios();
      },
      error: err => {
        this.commentError = 'Error al cargar los comentarios.';
        this.loadingComments = false;
      }
    });
  }

  loadAutoresComentarios(): void {
    const ids = Array.from(new Set(this.comments.map(c => c.idAutor)));
    ids.forEach(id => {
      if (!this.mapaUsuarios[id]) {
        this.userService.getUsuarioPorId(id).then((usuario: Usuario | null) => {
          if (usuario) {
            this.mapaUsuarios[id] = `${usuario.primerNombre} ${usuario.apellidoPaterno}`;
          } else {
            this.mapaUsuarios[id] = `Usuario ${id}`;
          }
        }).catch(() => {
          this.mapaUsuarios[id] = `Usuario ${id}`;
        });
      }
    });
  }

  submitComment(): void {
    if (!this.newComment.texto.trim()) {
      this.commentError = 'El comentario no puede estar vacío.';
      return;
    }
    if (!this.currentUserId) {
      this.commentError = 'No se pudo obtener el usuario actual. Intenta recargar la página.';
      return;
    }
    this.submittingComment = true;
    this.commentError = null;
    
    const commentData = {
      texto: this.newComment.texto,
      valoracion: this.newComment.valoracion,
      idPublicacion: this.product.id,
      idAutor: this.currentUserId
    };

    const token = localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;
    
    this.http.post<any>(`${environment.publicacionesApiUrl}/comentarios`, commentData, { headers }).subscribe({
      next: data => {
        this.comments.push(data);
        this.loadAutoresComentarios();
        this.newComment = { texto: '', valoracion: 5 };
        this.submittingComment = false;
      },
      error: err => {
        this.commentError = 'Error al crear el comentario.';
        this.submittingComment = false;
      }
    });
  }

  getNombreAutorComentario(idAutor: number): string {
    return this.mapaUsuarios[idAutor] || `Usuario ${idAutor}`;
  }

  getStars(valoracion: number): string[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= valoracion ? '★' : '☆');
    }
    return stars;
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

  goBackToUserProducts() {
    this.router.navigate(['/dashboard/mis-productos']);
  }

  isAdmin(): boolean {
    const rol = this.userService.getRol();
    return ((typeof rol === 'number' && rol === 1) || (typeof rol === 'object' && rol && (rol as any).id === 1)) ? true : false;
  }

  borrarComentario(id: number) {
    if (!this.isAdmin()) return;
    if (confirm('¿Seguro que deseas borrar este comentario?')) {
      const token = localStorage.getItem('token');
      const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;
      this.http.delete(`${environment.publicacionesApiUrl}/comentarios/${id}`, { headers }).subscribe({
        next: () => {
          this.comments = this.comments.filter(c => c.id !== id);
          alert('Comentario eliminado correctamente');
        },
        error: () => alert('Error al eliminar el comentario')
      });
    }
  }

  editarComentario(comment: any) {
    if (!this.isAdmin()) return;
    this.editingCommentId = comment.id;
    this.editedComment = { texto: comment.texto, valoracion: comment.valoracion };
  }

  cancelarEdicionComentario() {
    this.editingCommentId = null;
    this.editedComment = { texto: '', valoracion: 5 };
  }

  guardarEdicionComentario(comment: any) {
    if (!this.isAdmin()) return;
    const token = localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;
    const datosActualizados = {
      ...comment,
      texto: this.editedComment.texto,
      valoracion: this.editedComment.valoracion
    };
    this.http.put<any>(`${environment.publicacionesApiUrl}/comentarios/${comment.id}`, datosActualizados, { headers }).subscribe({
      next: (updated) => {
        // Actualizar el comentario en la lista
        const idx = this.comments.findIndex(c => c.id === comment.id);
        if (idx !== -1) this.comments[idx] = updated;
        this.cancelarEdicionComentario();
        alert('Comentario editado correctamente');
      },
      error: () => alert('Error al editar el comentario')
    });
  }

  // Métodos para intercambio
  isProductOwner(): boolean {
    return this.currentUserId === this.product?.idAutor;
  }

  canShowIntercambioButton(): boolean {
    return this.currentUserId && this.product && !this.isProductOwner() && 
           this.product.estado?.nombre === 'Publicado' || this.product.estado === 'Publicado';
  }

  openIntercambioModal(): void {
    if (!this.currentUserId) {
      alert('Debes iniciar sesión para realizar intercambios');
      return;
    }
    this.showIntercambioModal = true;
    this.loadUserProducts();
  }

  closeIntercambioModal(): void {
    this.showIntercambioModal = false;
    this.selectedProductId = null;
    this.intercambioError = null;
  }

  loadUserProducts(): void {
    this.loadingUserProducts = true;
    this.intercambioError = null;
    
    const token = localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;
    
    this.http.get<any[]>(`${environment.publicacionesApiUrl}/publicaciones/usuario/${this.currentUserId}`, { headers }).subscribe({
      next: (products) => {
        // Filtrar solo productos publicados
        this.userProducts = products.filter(p => 
          p.estado?.nombre === 'Publicado' || p.estado === 'Publicado'
        );
        this.loadingUserProducts = false;
      },
      error: (err) => {
        this.intercambioError = 'Error al cargar tus productos';
        this.loadingUserProducts = false;
      }
    });
  }

  submitIntercambio(): void {
    if (!this.selectedProductId) {
      this.intercambioError = 'Debes seleccionar un producto para intercambiar';
      return;
    }

    this.submittingIntercambio = true;
    this.intercambioError = null;

    const intercambioData = {
      idProductoSolicitado: this.product.id,
      idProductoOfrecido: this.selectedProductId,
      idUsuarioSolicitante: this.currentUserId,
      idUsuarioPropietario: this.product.idAutor
    };

    this.apiService.crearOfertaIntercambio(intercambioData).subscribe({
      next: (response) => {
        alert('Oferta de intercambio enviada correctamente');
        this.closeIntercambioModal();
        this.submittingIntercambio = false;
      },
      error: (err) => {
        this.intercambioError = err.error || 'Error al enviar la oferta de intercambio';
        this.submittingIntercambio = false;
      }
    });
  }

  puedeEditarEstado(): boolean {
    // Solo el dueño puede cambiar el estado y solo si NO está aprobado
    return this.currentUserId === this.product?.idAutor && this.product?.estado?.nombre !== 'Aprobado' && this.product?.estado !== 'Aprobado';
  }

  esPublicado(): boolean {
    return this.product?.estado?.nombre === 'Publicado' || this.product?.estado === 'Publicado';
  }

  cambiarEstadoPublicacion(nuevoEstado: 'Publicado' | 'Borrador') {
    if (!this.puedeEditarEstado() || this.cambiandoEstado) return;
    this.cambiandoEstado = true;
    this.estadoError = null;
    const estadoId = nuevoEstado === 'Publicado' ? 1 : 2;
    const datosActualizados = {
      ...this.product,
      estado: { id: estadoId } // Enviar como objeto, no como número
    };
    const token = localStorage.getItem('token');
    const headers = token ? { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) } : {};
    this.http.put<any>(`${environment.publicacionesApiUrl}/publicaciones/${this.product.id}`, datosActualizados, headers).subscribe({
      next: (updated) => {
        this.product.estado = updated.estado;
        this.cambiandoEstado = false;
      },
      error: (err) => {
        this.estadoError = 'Error al cambiar el estado';
        this.cambiandoEstado = false;
      }
    });
  }

  onToggleEstado(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.cambiarEstadoPublicacion(checked ? 'Publicado' : 'Borrador');
  }
} 