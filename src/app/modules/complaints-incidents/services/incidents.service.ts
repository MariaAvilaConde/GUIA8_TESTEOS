import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './base.service';
import { Incident } from '../models/complaints-incidents.models';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class IncidentsService extends BaseService<Incident> {
  private adminApiUrl: string;

  constructor(http: HttpClient) {
    super(http, 'incidents');
    // Use the new admin API endpoint
    this.adminApiUrl = 'https://lab.vallegrande.edu.pe/jass/ms-claim-incidents/api/admin/incidents';
  }

  getIncidentsByUser(userId: string): Observable<Incident[]> {
    return this.http.get<Incident[]>(`${this.apiUrl}/user/${userId}`);
  }

  getIncidentsByStatus(status: string): Observable<Incident[]> {
    return this.http.get<Incident[]>(`${this.apiUrl}/status/${status}`);
  }

  getIncidentsByType(typeId: string): Observable<Incident[]> {
    return this.http.get<Incident[]>(`${this.apiUrl}/type/${typeId}`);
  }

  updateStatus(id: string, status: string): Observable<Incident> {
    return this.http.patch<Incident>(`${this.apiUrl}/${id}/status`, { status });
  }

  assignIncident(id: string, userId: string): Observable<Incident> {
    return this.http.patch<Incident>(`${this.apiUrl}/${id}/assign`, { assigned_to_user_id: userId });
  }

  updateResolutionDate(id: string, resolutionDate: Date): Observable<Incident> {
    return this.http.patch<Incident>(`${this.apiUrl}/${id}/resolution-date`, { actual_resolution_date: resolutionDate });
  }

  override getAll(): Observable<Incident[]> {
    // Use the new admin API endpoint for getting all incidents
    return this.http.get<Incident[]>(this.adminApiUrl);
  }

  // Get enriched incidents data (if available)
  getAllEnriched(): Observable<Incident[]> {
    return this.http.get<Incident[]>(`${this.adminApiUrl}/enriched`);
  }
}
