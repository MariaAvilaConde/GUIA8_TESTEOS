import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Incident, IncidentResolution, MaterialUsed, IncidentType } from '../models/complaints-incidents.models';
import { UserResponseDTO } from '../../../core/models/user.model';
import { ProductResponse } from '../../../core/models/inventory.model';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

@Injectable({
  providedIn: 'root'
})
export class IncidentReportService {

  constructor() { }

  generateIncidentReport(
    incident: Incident,
    resolution?: IncidentResolution,
    users?: UserResponseDTO[],
    products?: ProductResponse[]
  ): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPosition = 30;

    // Header with logo and title
    this.addHeader(doc, pageWidth, margin);
    yPosition = 60;

    // Incident Information Section
    yPosition = this.addIncidentInfoSection(doc, incident, users, yPosition, margin, pageWidth);

    // Status and Progress Section
    yPosition = this.addStatusSection(doc, incident, yPosition, margin, pageWidth);

    // Resolution Details Section (if resolved)
    if (resolution && incident.resolved) {
      yPosition = this.addResolutionSection(doc, resolution, users, products, yPosition, margin, pageWidth);
    }

    // Materials Used Section (if resolution exists)
    if (resolution && resolution.materialsUsed && resolution.materialsUsed.length > 0) {
      yPosition = this.addMaterialsSection(doc, resolution.materialsUsed, products, yPosition, margin, pageWidth);
    }

    // Footer
    this.addFooter(doc);

    // Download the PDF
    const fileName = `Reporte_Incidencia_${incident.incidentCode}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  generateMassiveIncidentsReport(incidents: Incident[], incidentTypes?: IncidentType[]): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPosition = 30;

    // Header
    this.addMassiveReportHeader(doc, pageWidth, margin, incidents.length);
    yPosition = 70;

    // Summary section
    yPosition = this.addSummarySection(doc, incidents, yPosition, margin, pageWidth);

    // Incidents table
    yPosition = this.addIncidentsTable(doc, incidents, incidentTypes, yPosition, margin, pageWidth);

    // Footer
    this.addFooter(doc);

    // Download the PDF
    const fileName = `Reporte_General_Incidencias_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  generateCustomIncidentsReport(incidents: Incident[], config: any): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPosition = 30;

    // Sort incidents based on config
    const sortedIncidents = this.sortIncidents(incidents, config.sortBy);

    // Header
    this.addCustomReportHeader(doc, pageWidth, margin, incidents.length, config);
    yPosition = 80;

    if (config.groupBy === 'none') {
      // Simple list without grouping
      yPosition = this.addIncidentsTable(doc, sortedIncidents, undefined, yPosition, margin, pageWidth);
    } else {
      // Grouped report
      yPosition = this.addGroupedIncidentsReport(doc, sortedIncidents, config.groupBy, yPosition, margin, pageWidth);
    }

    // Footer
    this.addFooter(doc);

    // Download the PDF
    const fileName = `Reporte_Personalizado_Incidencias_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  private addCustomReportHeader(doc: jsPDF, pageWidth: number, margin: number, totalIncidents: number, config: any): void {
    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(155, 89, 182);
    doc.text('REPORTE PERSONALIZADO DE INCIDENCIAS', pageWidth / 2, 25, { align: 'center' });

    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Sistema de Gestión de Agua Potable - JASS', pageWidth / 2, 35, { align: 'center' });

    // Configuration info
    doc.setFontSize(10);
    doc.setTextColor(52, 73, 94);
    doc.text(`Total de incidencias: ${totalIncidents}`, pageWidth / 2, 45, { align: 'center' });
    
    let configText = 'Filtros aplicados: ';
    if (config.dateFrom || config.dateTo) {
      configText += `Rango de fechas, `;
    }
    configText += `Severidades: ${config.severities.length}, Estados: ${config.statuses.length}`;
    
    doc.text(configText, pageWidth / 2, 55, { align: 'center' });
    doc.text(`Fecha de generación: ${new Date().toLocaleString('es-PE')}`, pageWidth / 2, 65, { align: 'center' });

    // Divider line
    doc.setDrawColor(155, 89, 182);
    doc.setLineWidth(1);
    doc.line(margin, 75, pageWidth - margin, 75);
  }

  private sortIncidents(incidents: Incident[], sortBy: string): Incident[] {
    const sorted = [...incidents];
    
    switch (sortBy) {
      case 'date':
        return sorted.sort((a, b) => b.incidentDate - a.incidentDate);
      case 'severity':
        const severityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        return sorted.sort((a, b) => (severityOrder[b.severity as keyof typeof severityOrder] || 0) - (severityOrder[a.severity as keyof typeof severityOrder] || 0));
      case 'status':
        const statusOrder = { 'REPORTED': 4, 'IN_PROGRESS': 3, 'RESOLVED': 2, 'CLOSED': 1 };
        return sorted.sort((a, b) => (statusOrder[b.status as keyof typeof statusOrder] || 0) - (statusOrder[a.status as keyof typeof statusOrder] || 0));
      case 'code':
        return sorted.sort((a, b) => (a.incidentCode || '').localeCompare(b.incidentCode || ''));
      default:
        return sorted;
    }
  }

  private addGroupedIncidentsReport(doc: jsPDF, incidents: Incident[], groupBy: string, yPosition: number, margin: number, pageWidth: number): number {
    const groups = this.groupIncidents(incidents, groupBy);
    
    Object.entries(groups).forEach(([groupKey, groupIncidents]) => {
      // Check if we need a new page
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 30;
      }

      // Group header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(155, 89, 182);
      doc.text(`${this.getGroupLabel(groupBy)}: ${this.formatGroupKey(groupKey, groupBy)} (${groupIncidents.length} incidencias)`, margin, yPosition);
      yPosition += 10;

      // Group table
      const groupData = groupIncidents.map(incident => [
        incident.incidentCode || '-',
        incident.title || '-',
        this.formatSeverity(incident.severity),
        this.formatStatus(incident.status),
        new Date(incident.incidentDate).toLocaleDateString('es-PE'),
        incident.affectedBoxesCount.toString()
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Código', 'Título', 'Severidad', 'Estado', 'Fecha', 'Cajas Afect.']],
        body: groupData,
        theme: 'striped',
        headStyles: { 
          fillColor: [155, 89, 182],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8
        },
        bodyStyles: {
          fontSize: 7
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 50 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 20, halign: 'center' }
        },
        margin: { left: margin, right: margin }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    });

    return yPosition;
  }

  private groupIncidents(incidents: Incident[], groupBy: string): { [key: string]: Incident[] } {
    const groups: { [key: string]: Incident[] } = {};
    
    incidents.forEach(incident => {
      let key: string;
      switch (groupBy) {
        case 'severity':
          key = incident.severity;
          break;
        case 'status':
          key = incident.status;
          break;
        case 'category':
          key = incident.incidentCategory;
          break;
        default:
          key = 'other';
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(incident);
    });
    
    return groups;
  }

  private getGroupLabel(groupBy: string): string {
    const labels: { [key: string]: string } = {
      'severity': 'Severidad',
      'status': 'Estado',
      'category': 'Categoría'
    };
    return labels[groupBy] || groupBy;
  }

  private formatGroupKey(key: string, groupBy: string): string {
    switch (groupBy) {
      case 'severity':
        return this.formatSeverity(key);
      case 'status':
        return this.formatStatus(key);
      case 'category':
        return this.formatCategory(key);
      default:
        return key;
    }
  }

  private addMassiveReportHeader(doc: jsPDF, pageWidth: number, margin: number, totalIncidents: number): void {
    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text('REPORTE GENERAL DE INCIDENCIAS', pageWidth / 2, 25, { align: 'center' });

    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Sistema de Gestión de Agua Potable - JASS', pageWidth / 2, 35, { align: 'center' });

    // Period info
    doc.setFontSize(10);
    doc.setTextColor(52, 73, 94);
    doc.text(`Total de incidencias: ${totalIncidents}`, pageWidth / 2, 45, { align: 'center' });
    doc.text(`Fecha de generación: ${new Date().toLocaleString('es-PE')}`, pageWidth / 2, 55, { align: 'center' });

    // Divider line
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(1);
    doc.line(margin, 65, pageWidth - margin, 65);
  }

  private addSummarySection(doc: jsPDF, incidents: Incident[], yPosition: number, margin: number, pageWidth: number): number {
    // Section title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 73, 94);
    doc.text('RESUMEN EJECUTIVO', margin, yPosition);
    yPosition += 10;

    // Calculate statistics
    const stats = this.calculateStatistics(incidents);

    const summaryData = [
      ['Total de Incidencias', stats.total.toString()],
      ['Incidencias Reportadas', stats.reported.toString()],
      ['Incidencias en Progreso', stats.inProgress.toString()],
      ['Incidencias Resueltas', stats.resolved.toString()],
      ['Incidencias Cerradas', stats.closed.toString()],
      ['Severidad Crítica', stats.critical.toString()],
      ['Severidad Alta', stats.high.toString()],
      ['Promedio Cajas Afectadas', stats.avgBoxesAffected.toFixed(1)]
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Indicador', 'Valor']],
      body: summaryData,
      theme: 'striped',
      headStyles: { 
        fillColor: [46, 204, 113],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 120, fontStyle: 'bold' },
        1: { cellWidth: 50, halign: 'center' }
      },
      margin: { left: margin, right: margin }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;
    return yPosition;
  }

  private addIncidentsTable(doc: jsPDF, incidents: Incident[], incidentTypes?: IncidentType[], yPosition: number = 0, margin: number = 20, pageWidth: number = 0): number {
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 30;
    }

    // Section title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 73, 94);
    doc.text('DETALLE DE INCIDENCIAS', margin, yPosition);
    yPosition += 10;

    const incidentsData = incidents.map(incident => [
      incident.incidentCode || '-',
      incident.title || '-',
      this.formatCategory(incident.incidentCategory),
      this.formatSeverity(incident.severity),
      this.formatStatus(incident.status),
      // new Date(incident.incidentDate).toLocaleDateString('es-PE'), // Fecha oculta temporalmente
      incident.affectedBoxesCount.toString(),
      incident.resolved ? 'Sí' : 'No'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Código', 'Título', 'Categoría', 'Severidad', 'Estado', 'Cajas Afect.', 'Resuelto']], // Fecha removida temporalmente
      body: incidentsData,
      theme: 'striped',
      headStyles: { 
        fillColor: [52, 152, 219],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      bodyStyles: {
        fontSize: 7
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 35 },
        2: { cellWidth: 20 },
        3: { cellWidth: 18 },
        4: { cellWidth: 20 },
        5: { cellWidth: 18 },
        6: { cellWidth: 15, halign: 'center' },
        7: { cellWidth: 15, halign: 'center' }
      },
      margin: { left: margin, right: margin },
      showHead: 'everyPage'
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
    return yPosition;
  }

  private calculateStatistics(incidents: Incident[]): any {
    const stats = {
      total: incidents.length,
      reported: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      critical: 0,
      high: 0,
      avgBoxesAffected: 0
    };

    let totalBoxes = 0;

    incidents.forEach(incident => {
      // Count by status
      switch (incident.status) {
        case 'REPORTED': stats.reported++; break;
        case 'IN_PROGRESS': stats.inProgress++; break;
        case 'RESOLVED': stats.resolved++; break;
        case 'CLOSED': stats.closed++; break;
      }

      // Count by severity
      switch (incident.severity) {
        case 'CRITICAL': stats.critical++; break;
        case 'HIGH': stats.high++; break;
      }

      totalBoxes += incident.affectedBoxesCount || 0;
    });

    stats.avgBoxesAffected = stats.total > 0 ? totalBoxes / stats.total : 0;
    return stats;
  }

  private addHeader(doc: jsPDF, pageWidth: number, margin: number): void {
    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185); // Professional blue
    doc.text('REPORTE DE INCIDENCIA', pageWidth / 2, 25, { align: 'center' });

    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Sistema de Gestión de Agua Potable - JASS', pageWidth / 2, 35, { align: 'center' });

    // Divider line
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(1);
    doc.line(margin, 45, pageWidth - margin, 45);
  }

  private addIncidentInfoSection(
    doc: jsPDF, 
    incident: Incident, 
    users?: UserResponseDTO[], 
    yPosition: number = 60, 
    margin: number = 20, 
    pageWidth: number = 0
  ): number {
    // Section title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 73, 94);
    doc.text('INFORMACIÓN GENERAL', margin, yPosition);
    yPosition += 10;

    // Create incident info table
    const incidentData = [
      ['Código de Incidencia', incident.incidentCode],
      ['Título', incident.title],
      ['Categoría', this.formatCategory(incident.incidentCategory)],
      ['Severidad', this.formatSeverity(incident.severity)],
      ['Estado', this.formatStatus(incident.status)],
      // ['Fecha de Incidencia', this.formatDate(incident.incidentDate)], // Oculta temporalmente
      ['Zona Afectada', incident.zoneId],
      ['Cajas Afectadas', incident.affectedBoxesCount.toString()],
      ['Reportado por', this.getUserName(incident.reportedByUserId, users)],
      ['Asignado a', incident.assignedToUserId ? this.getUserName(incident.assignedToUserId, users) : 'No asignado']
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Campo', 'Valor']],
      body: incidentData,
      theme: 'striped',
      headStyles: { 
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold' },
        1: { cellWidth: 110 }
      },
      margin: { left: margin, right: margin }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Description section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 73, 94);
    doc.text('DESCRIPCIÓN', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const splitDescription = doc.splitTextToSize(incident.description, pageWidth - 2 * margin);
    doc.text(splitDescription, margin, yPosition);
    yPosition += splitDescription.length * 5 + 10;

    return yPosition;
  }

  private addStatusSection(
    doc: jsPDF, 
    incident: Incident, 
    yPosition: number, 
    margin: number, 
    pageWidth: number
  ): number {
    // Section title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 73, 94);
    doc.text('ESTADO Y PROGRESO', margin, yPosition);
    yPosition += 10;

    const statusData = [
      ['Estado Actual', this.formatStatus(incident.status)],
      ['Resuelto', incident.resolved ? 'Sí' : 'No'],
      // ['Fecha de Creación', this.formatDate(incident.createdAt)], // Oculta temporalmente
      ['Estado del Registro', incident.recordStatus === 'ACTIVE' ? 'Activo' : 'Inactivo']
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Aspecto', 'Estado']],
      body: statusData,
      theme: 'striped',
      headStyles: { 
        fillColor: [46, 204, 113],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold' },
        1: { cellWidth: 110 }
      },
      margin: { left: margin, right: margin }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    if (incident.resolutionNotes) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(52, 73, 94);
      doc.text('NOTAS DE RESOLUCIÓN', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const splitNotes = doc.splitTextToSize(incident.resolutionNotes, pageWidth - 2 * margin);
      doc.text(splitNotes, margin, yPosition);
      yPosition += splitNotes.length * 5 + 10;
    }

    return yPosition;
  }

  private addResolutionSection(
    doc: jsPDF, 
    resolution: IncidentResolution, 
    users?: UserResponseDTO[], 
    products?: ProductResponse[], 
    yPosition: number = 0, 
    margin: number = 20, 
    pageWidth: number = 0
  ): number {
    // Check if we need a new page
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 30;
    }

    // Section title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 73, 94);
    doc.text('DETALLES DE RESOLUCIÓN', margin, yPosition);
    yPosition += 10;

    const resolutionData = [
      // ['Fecha de Resolución', this.formatDate(resolution.resolutionDate)], // Oculta temporalmente
      ['Tipo de Resolución', resolution.resolutionType],
      ['Resuelto por', this.getUserName(resolution.resolvedByUserId, users)],
      ['Horas de Trabajo', `${resolution.laborHours} horas`],
      ['Costo Total', `S/ ${resolution.totalCost.toFixed(2)}`],
      ['Control de Calidad', resolution.qualityCheck ? 'Aprobado' : 'Pendiente'],
      ['Seguimiento Requerido', resolution.followUpRequired ? 'Sí' : 'No']
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Aspecto', 'Detalle']],
      body: resolutionData,
      theme: 'striped',
      headStyles: { 
        fillColor: [231, 76, 60],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold' },
        1: { cellWidth: 110 }
      },
      margin: { left: margin, right: margin }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Actions taken section
    if (resolution.actionsTaken) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(52, 73, 94);
      doc.text('ACCIONES REALIZADAS', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const splitActions = doc.splitTextToSize(resolution.actionsTaken, pageWidth - 2 * margin);
      doc.text(splitActions, margin, yPosition);
      yPosition += splitActions.length * 5 + 10;
    }

    // Resolution notes section
    if (resolution.resolutionNotes) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(52, 73, 94);
      doc.text('NOTAS ADICIONALES', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const splitResolutionNotes = doc.splitTextToSize(resolution.resolutionNotes, pageWidth - 2 * margin);
      doc.text(splitResolutionNotes, margin, yPosition);
      yPosition += splitResolutionNotes.length * 5 + 10;
    }

    return yPosition;
  }

  private addMaterialsSection(
    doc: jsPDF, 
    materials: MaterialUsed[], 
    products?: ProductResponse[], 
    yPosition: number = 0, 
    margin: number = 20, 
    pageWidth: number = 0
  ): number {
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 30;
    }

    // Section title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 73, 94);
    doc.text('MATERIALES UTILIZADOS', margin, yPosition);
    yPosition += 10;

    const materialsData = materials.map(material => [
      this.getProductName(material.productId, products),
      material.quantity.toString(),
      material.unit
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Material', 'Cantidad', 'Unidad']],
      body: materialsData,
      theme: 'striped',
      headStyles: { 
        fillColor: [155, 89, 182],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 50, halign: 'center' }
      },
      margin: { left: margin, right: margin }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
    return yPosition;
  }

  private addFooter(doc: jsPDF): void {
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    
    // Footer line
    doc.setDrawColor(189, 195, 199);
    doc.setLineWidth(0.5);
    doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
    
    // Footer text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Generado por Sistema JASS', 20, pageHeight - 15);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-PE')}`, pageWidth - 20, pageHeight - 15, { align: 'right' });
    
    // Page number
    const pageNumber = (doc as any).internal.getCurrentPageInfo().pageNumber;
    doc.text(`Página ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  private formatCategory(category: string): string {
    const categories: { [key: string]: string } = {
      'GENERAL': 'General',
      'CALIDAD': 'Calidad del Agua',
      'DISTRIBUCION': 'Distribución'
    };
    return categories[category] || category;
  }

  private formatSeverity(severity: string): string {
    const severities: { [key: string]: string } = {
      'LOW': 'Baja',
      'MEDIUM': 'Media',
      'HIGH': 'Alta',
      'CRITICAL': 'Crítica'
    };
    return severities[severity] || severity;
  }

  private formatStatus(status: string): string {
    const statuses: { [key: string]: string } = {
      'REPORTED': 'Reportado',
      'IN_PROGRESS': 'En Progreso',
      'RESOLVED': 'Resuelto',
      'CLOSED': 'Cerrado'
    };
    return statuses[status] || status;
  }

  private getUserName(userId: string, users?: UserResponseDTO[]): string {
    if (!users) return userId;
    const user = users.find(u => u.id === userId);
    return user ? user.fullName : userId;
  }

  private getProductName(productId: string, products?: ProductResponse[]): string {
    if (!products) return `Producto ID: ${productId}`;
    const product = products.find(p => p.productId === productId);
    return product ? product.productName : `Producto ID: ${productId}`;
  }

  private formatDate(timestamp?: number | string | null): string {
    // Método temporalmente simplificado - las fechas están ocultas en los reportes
    if (!timestamp || timestamp === 0 || timestamp === '0' || timestamp === null || timestamp === undefined) {
      return 'No disponible';
    }
    
    // Convertir a número si es string
    let numTimestamp: number;
    if (typeof timestamp === 'string') {
      numTimestamp = parseInt(timestamp, 10);
    } else {
      numTimestamp = timestamp;
    }
    
    if (isNaN(numTimestamp) || numTimestamp <= 0) {
      return 'Fecha inválida';
    }
    
    // Si el timestamp es muy pequeño, probablemente esté en segundos, no en milisegundos
    let timestampMs: number;
    if (numTimestamp < 1000000000000) {
      timestampMs = numTimestamp * 1000;
    } else {
      timestampMs = numTimestamp;
    }
    
    try {
      const date = new Date(timestampMs);
      
      // Verificar si la fecha es válida y está en un rango razonable
      if (isNaN(date.getTime()) || date.getFullYear() < 1970 || date.getFullYear() > 2100) {
        return 'Fecha inválida';
      }
      
      return date.toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Error en fecha';
    }
  }
}
