import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define interfaces for the data structures
export interface Comunidad {
  id: number;
  nombre: string;
  tipo: string;
  region: string;
  comuna: string;
  sector: string;
  direccion: string;
}

export interface Torre {
  id: number;
  nombre: string;
  comunidad: Comunidad;
}

@Injectable({
  providedIn: 'root'
})
export class ComunidadService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) { }

  getComunidades(): Observable<Comunidad[]> {
    return this.http.get<Comunidad[]>(`${this.apiUrl}/comunidades`);
  }

  getTorresByComunidadId(comunidadId: number): Observable<Torre[]> {
    return this.http.get<Torre[]>(`${this.apiUrl}/comunidades/${comunidadId}/torres`);
  }
} 