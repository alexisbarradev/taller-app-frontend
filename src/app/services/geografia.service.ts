import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Region {
  id: number;
  nombre: string;
}

export interface Provincia {
  id: number;
  nombre: string;
  regionId: number;
}

export interface Comuna {
  id: number;
  nombre: string;
  provinciaId: number;
}

export interface Comunidad {
  id: number;
  nombreComunidad: string;
  comunaId: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeografiaService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todas las regiones
  getRegiones(): Observable<Region[]> {
    return this.http.get<Region[]>(`${this.apiUrl}/geografia/regiones`);
  }

  // Obtener provincias por región
  getProvinciasPorRegion(regionId: number): Observable<Provincia[]> {
    return this.http.get<Provincia[]>(`${this.apiUrl}/geografia/provincias/${regionId}`);
  }

  // Obtener comunas por provincia
  getComunasPorProvincia(provinciaId: number): Observable<Comuna[]> {
    return this.http.get<Comuna[]>(`${this.apiUrl}/geografia/comunas/${provinciaId}`);
  }

  // Obtener comunidades por comuna
  getComunidadesPorComuna(comunaId: number): Observable<Comunidad[]> {
    return this.http.get<Comunidad[]>(`${this.apiUrl}/geografia/comunidades/${comunaId}`);
  }

  // Obtener todas las provincias
  getTodasProvincias(): Observable<Provincia[]> {
    return this.http.get<Provincia[]>(`${this.apiUrl}/geografia/provincias`);
  }

  // Obtener todas las comunas
  getTodasComunas(): Observable<Comuna[]> {
    return this.http.get<Comuna[]>(`${this.apiUrl}/geografia/comunas`);
  }

  // Obtener todas las comunidades
  getTodasComunidades(): Observable<Comunidad[]> {
    return this.http.get<Comunidad[]>(`${this.apiUrl}/geografia/comunidades`);
  }
} 