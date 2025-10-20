import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IncidentResolution } from '../models/complaints-incidents.models';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IncidentResolutionsService {
  private apiUrl: string = `${environment.complaintsIncidentsApiUrl}/incident-resolutions`;
  private headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  constructor(private http: HttpClient) {}

  getAll(): Observable<IncidentResolution[]> {
    console.log('IncidentResolutionsService.getAll - URL:', this.apiUrl);
    return this.http.get<IncidentResolution[]>(this.apiUrl);
  }

  getById(id: string): Observable<IncidentResolution> {
    console.log('IncidentResolutionsService.getById - URL:', `${this.apiUrl}/${id}`);
    return this.http.get<IncidentResolution>(`${this.apiUrl}/${id}`);
  }

  create(resolution: IncidentResolution): Observable<IncidentResolution> {
    console.log('IncidentResolutionsService.create - URL:', this.apiUrl);
    console.log('IncidentResolutionsService.create - Headers:', this.headers);
    console.log('IncidentResolutionsService.create - Data:', resolution);
    return this.http.post<IncidentResolution>(this.apiUrl, resolution, { headers: this.headers });
  }

  update(id: string, resolution: IncidentResolution): Observable<IncidentResolution> {
    console.log('IncidentResolutionsService.update - URL:', `${this.apiUrl}/${id}`);
    console.log('IncidentResolutionsService.update - Headers:', this.headers);
    console.log('IncidentResolutionsService.update - Data:', resolution);
    return this.http.put<IncidentResolution>(`${this.apiUrl}/${id}`, resolution, { headers: this.headers });
  }

  delete(id: string): Observable<void> {
    console.log('IncidentResolutionsService.delete - URL:', `${this.apiUrl}/${id}`);
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getResolutionsByIncident(incidentId: string): Observable<IncidentResolution[]> {
    console.log('IncidentResolutionsService.getResolutionsByIncident - URL:', `${this.apiUrl}/incident/${incidentId}`);
    return this.http.get<IncidentResolution[]>(`${this.apiUrl}/incident/${incidentId}`);
  }
}
