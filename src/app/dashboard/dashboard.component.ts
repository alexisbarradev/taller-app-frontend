import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { CommonModule } from '@angular/common';
import { MsalService } from '@azure/msal-angular';
import { Subscription } from 'rxjs';
import { UsersListComponent } from '../users-list/users-list.component';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, UsersListComponent, RouterOutlet],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
 
  title = 'Dashboard';
  username: string = 'Invitado';
  userRole: number | null = null;
  userEmail: string = '';
  private subscriptions = new Subscription();
  products: any[] = [];
  loadingProducts = false;
  errorProducts: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
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
    this.fetchProducts();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private async updateUserInfo(): Promise<void> {
    if (this.authService.isLoggedIn()) {
      // Set user name and email in UserService
      const name = this.userService.getUserNameFromMSAL();
      const email = this.userService.getUserEmailFromMSAL();
      this.userService.setUserName(name);
      this.userService.setUserEmail(email);
      this.username = name;
      
      console.log('👤 Usuario:', name);
      console.log('📧 Email:', email);

      if (email) {
        try {
          const backendRole = await this.userService.obtenerRolPorCorreo(email);
          // setRol is already called inside obtenerRolPorCorreo
          console.log('DASHBOARD: backendRole =', backendRole, typeof backendRole);
        } catch (error) {
          console.error('❌ Error al obtener rol:', error);
          this.userService.setRol(null);
        }
      }
    } else {
      console.error('Dashboard: User not authenticated');
      this.authService.logout();
    }
  }

  fetchProducts(): void {
    this.loadingProducts = true;
    this.errorProducts = null;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.get<any[]>(`${environment.publicacionesApiUrl}/publicaciones`, { headers }).subscribe({
      next: data => {
        this.products = data;
        console.log('[Dashboard] Publicaciones recibidas:', this.products);
        this.loadingProducts = false;
      },
      error: err => {
        this.errorProducts = 'Error al cargar publicaciones.';
        this.loadingProducts = false;
      }
    });
  }

 

  logout(): void {
    this.authService.logout();
    this.userService.clearRol();
  
    // Forzar recarga para limpiar estado
    window.location.href = '/';
  }
  

  getRoleLabel(): string {
    const role = Number(this.userRole);
    if (role === 1) return 'Administrador';
    if (role === 2) return 'Usuario';
    return 'Sin rol asignado';
  }

  isAdmin(): boolean {
    return this.userRole === 1;
  }

  hasActiveChildRoute(): boolean {
    // Solo muestra el contenido principal si la URL es exactamente /dashboard
    return this.router.url !== '/dashboard';
  }
}
