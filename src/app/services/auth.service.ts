import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginRequest {
  usuario: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loginUrl = 'http://localhost:8080/login';

  constructor(private http: HttpClient) {}

  login(request: LoginRequest): Observable<string> {
    // ✅ dile que la respuesta es texto (plain text)
    return this.http.post(this.loginUrl, request, { responseType: 'text' });
  }
}
