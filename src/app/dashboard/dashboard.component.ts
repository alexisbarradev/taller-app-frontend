import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService, Usuario } from '../services/user.service';
import { CommonModule } from '@angular/common';
import { MsalService } from '@azure/msal-angular';
import { Subscription } from 'rxjs';
import { UsersListComponent } from '../users-list/users-list.component';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AllProductsComponent } from '../all-products/all-products.component';

// Helper fuera de la clase
function isRoleObject(role: any): role is { id: number } {
  return role && typeof role === 'object' && 'id' in role;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
 
  title = 'Dashboard';
  username: string = 'Invitado';
  userRole: number | null = null;
  userEmail: string = '';
  private subscriptions = new Subscription();
  private rolSub: Subscription | null = null;
  showUserModal = false;
  usuario: Usuario | null = null;
  cargandoRol = true;
  notificacionesIntercambio: number = 0;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private authService: AuthService,
    private userService: UserService,
    private msalService: MsalService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.userService.rolUsuario$.subscribe(role => {
        this.userRole = role;
        this.cdr.detectChanges();
        if (this.userRole !== null) {
          this.cargandoRol = false;
        }
        // Redirección automática para administradores a /dashboard/usuarios, salvo que ya estén ahí
        if (this.userRole !== null && this.isAdmin() && this.router.url !== '/dashboard/usuarios') {
          console.log('[Dashboard] Es admin, forzando redirección a /dashboard/usuarios');
          this.router.navigate(['/dashboard/usuarios']);
        } else if (this.userRole !== null && !this.isAdmin() && this.router.url === '/dashboard') {
          console.log('[Dashboard] No es admin, redirigiendo a /dashboard/todos-los-productos');
          this.router.navigate(['/dashboard/todos-los-productos']);
        }
        // Ya no llamar a this.fetchProducts();
      })
    );
    this.subscriptions.add(
      this.userService.userName$.subscribe(name => {
        this.username = name;
        this.cdr.detectChanges();
      })
    );
    this.subscriptions.add(
      this.userService.userEmail$.subscribe(email => {
        this.userEmail = email;
        this.cdr.detectChanges();
      })
    );
    this.rolSub = this.userService.rolUsuario$.subscribe(role => {
      this.userRole = role;
      this.cdr.detectChanges();
      // Redirección automática tras login
      if (this.router.url === '/dashboard') {
        if (this.isAdmin()) {
          this.router.navigate(['/dashboard/usuarios']);
        } else {
          this.router.navigate(['/dashboard/todos-los-productos']);
        }
      }
      // Ya no llamar a this.fetchProducts();
    });

    // Check for token in query parameters (for OAuth2 redirects)
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      
      if (token) {
        console.log('Dashboard: Token found in query params, storing it');
        this.authService.setToken(token);
        
        // Clear the token from URL for security
        this.router.navigate(['/dashboard'], { 
          queryParams: {}, 
          replaceUrl: true 
        });
      }
    });

    // Update user information
    this.updateUserInfo();
    // Ya no llamar a this.fetchProducts();
  }

  async cargarNotificacionesIntercambio() {
    try {
      console.log('Cargando notificaciones de intercambio...');
      // Obtener el ID del usuario actual
      let userId = null;
      if (this.usuario && this.usuario.id) {
        userId = this.usuario.id;
        console.log('Usuario ID desde this.usuario:', userId);
      } else {
        const userIdLS = localStorage.getItem('userId');
        if (userIdLS) userId = Number(userIdLS);
        console.log('Usuario ID desde localStorage:', userId);
      }
      if (!userId) {
        console.log('No se pudo obtener userId, saliendo...');
        return;
      }
      // Llamar al endpoint de ofertas recibidas
      const token = localStorage.getItem('token');
      const headers = token ? { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) } : {};
      console.log('Llamando a:', `${environment.publicacionesApiUrl}/intercambios/ofertas-recibidas/${userId}`);
      const resp: any[] = await this.http.get<any[]>(`${environment.publicacionesApiUrl}/intercambios/ofertas-recibidas/${userId}`, headers).toPromise() || [];
      console.log('Respuesta del servidor:', resp);
      // Contar solo las pendientes
      this.notificacionesIntercambio = resp.filter(o => o.estadoIntercambio === 'PENDIENTE').length;
      console.log('Notificaciones pendientes:', this.notificacionesIntercambio);
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Error al cargar notificaciones:', e);
      this.notificacionesIntercambio = 0;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.rolSub?.unsubscribe();
  }

  private async updateUserInfo(): Promise<void> {
    if (this.authService.isLoggedIn()) {
      const email = this.userService.getUserEmailFromMSAL();
      this.userService.setUserEmail(email);
      this.userEmail = email;

      let usuario: Usuario | null = null;
      let idUsuario: number | null = null;

      console.log('DASHBOARD: email usado para buscar usuario:', email);

      if (email) {
        try {
          usuario = await this.userService.getUsuarioPorCorreo(email);
          this.usuario = usuario;
          console.log('DASHBOARD: usuario obtenido por correo:', usuario);
          if (usuario && usuario.id) {
            idUsuario = usuario.id;
            localStorage.setItem('userId', idUsuario.toString());
          }
        } catch (error) {
          usuario = null;
          this.usuario = null;
          console.error('DASHBOARD: error al obtener usuario por correo:', error);
        }
      }

      // Si no se pudo obtener por correo, intenta por ID guardado
      const userIdLS = localStorage.getItem('userId');
      console.log('DASHBOARD: userId en localStorage:', userIdLS);
      if (!usuario && userIdLS) {
        const id = Number(userIdLS);
        try {
          usuario = await this.userService.getUsuarioPorId(id);
          console.log('DASHBOARD: usuario obtenido por ID:', usuario);
        } catch (error) {
          usuario = null;
          console.error('DASHBOARD: error al obtener usuario por ID:', error);
        }
      }

      let nombre = '';
      if (usuario) {
        if (usuario.primerNombre && usuario.apellidoPaterno) {
          nombre = `${usuario.primerNombre} ${usuario.apellidoPaterno}`;
        } else if (usuario.primerNombre) {
          nombre = usuario.primerNombre;
        } else if (usuario.apellidoPaterno) {
          nombre = usuario.apellidoPaterno;
        } else if (usuario.correo) {
          nombre = usuario.correo;
        } else {
          nombre = 'Invitado';
        }
      } else {
        nombre = email || 'Invitado';
      }
      this.username = nombre;
      this.userService.setUserName(nombre);
      console.log('DASHBOARD: nombre final asignado:', nombre);

      try {
        const backendRole = await this.userService.obtenerRolPorCorreo(email);
        console.log('DASHBOARD: backendRole =', backendRole, typeof backendRole);
      } catch (error) {
        this.userService.setRol(null);
      }
      
      // Cargar notificaciones después de tener el usuario
      await this.cargarNotificacionesIntercambio();
    } else {
      this.username = 'Invitado';
      this.userService.setUserName('Invitado');
      this.authService.logout();
    }
  }

  // Eliminar fetchProducts()

 

  logout(): void {
    this.authService.logout();
    this.userService.clearRol();
  
    // Forzar recarga para limpiar estado
    window.location.href = '/';
  }
  

  getRoleLabel(): string {
    let roleId = this.userRole;
    if (isRoleObject(this.userRole)) {
      roleId = this.userRole.id;
    }
    if (roleId === 1) return 'Administrador';
    if (roleId === 2) return 'Usuario';
    return 'Sin rol asignado';
  }

  isAdmin(): boolean {
    if (isRoleObject(this.userRole)) {
      return this.userRole.id === 1;
    }
    return this.userRole === 1;
  }

  hasActiveChildRoute(): boolean {
    // Solo muestra el contenido principal si la URL es exactamente /dashboard
    return this.router.url !== '/dashboard';
  }

  navigateToDashboard(): void {
    if (this.isAdmin()) {
      this.router.navigate(['/dashboard/usuarios']);
    } else {
      this.router.navigate(['/dashboard/todos-los-productos']);
    }
  }

  openUserModal() {
    this.showUserModal = true;
  }
  closeUserModal() {
    this.showUserModal = false;
  }
}
