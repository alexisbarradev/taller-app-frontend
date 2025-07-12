import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private publicacionesApiUrl = environment.publicacionesApiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    console.log('[ApiService] getHeaders, token:', token);
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, { headers: this.getHeaders() });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, body, { headers: this.getHeaders() });
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, body, { headers: this.getHeaders() });
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`, { headers: this.getHeaders() });
  }

  // Métodos específicos para intercambios
  crearOfertaIntercambio(intercambioData: any): Observable<any> {
    return this.http.post<any>(`${this.publicacionesApiUrl}/intercambios/crear`, intercambioData, { headers: this.getHeaders() });
  }

  aceptarOferta(intercambioId: number): Observable<any> {
    return this.http.post<any>(`${this.publicacionesApiUrl}/intercambios/${intercambioId}/aceptar`, {}, { headers: this.getHeaders() });
  }

  rechazarOferta(intercambioId: number): Observable<any> {
    return this.http.post<any>(`${this.publicacionesApiUrl}/intercambios/${intercambioId}/rechazar`, {}, { headers: this.getHeaders() });
  }

  getOfertasRecibidas(userId: number): Observable<any> {
    return this.http.get<any>(`${this.publicacionesApiUrl}/intercambios/ofertas-recibidas/${userId}`, { headers: this.getHeaders() });
  }

  getOfertasEnviadas(userId: number): Observable<any> {
    return this.http.get<any>(`${this.publicacionesApiUrl}/intercambios/ofertas-enviadas/${userId}`, { headers: this.getHeaders() });
  }

  confirmarIntercambio(intercambioId: number, userId: number): Observable<any> {
    return this.http.post<any>(`${this.publicacionesApiUrl}/intercambios/${intercambioId}/confirmar?userId=${userId}`, {}, { headers: this.getHeaders() });
  }

  revertirIntercambio(intercambioId: number, userId: number): Observable<any> {
    return this.http.post<any>(`${this.publicacionesApiUrl}/intercambios/${intercambioId}/revertir?userId=${userId}`, {}, { headers: this.getHeaders() });
  }
}
