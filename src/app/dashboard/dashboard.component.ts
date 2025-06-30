import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  
  username: string = 'Invitado';
  userRole: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
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
  }

  private updateUserInfo(): void {
    if (this.authService.isLoggedIn()) {
      this.username = this.authService.getUsername();
      this.userRole = this.authService.getRole();
    } else {
      console.error('Dashboard: User not authenticated');
      this.authService.logout();
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
