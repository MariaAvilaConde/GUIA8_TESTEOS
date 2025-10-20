import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QualityTest, testing_points, dayliRecors } from '../models/water-quality.model';
import { organization, zones } from '../models/organization.model';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() { }

  /**
   * Genera un PDF individual de un análisis de calidad
   */
  generateAnalysisPdf(analysis: QualityTest, testingPoints: testing_points[], organizationName: string): void {
    const doc = new jsPDF();
    
    // Configuración de página
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 12;
    const contentWidth = pageWidth - 2 * margin;
    
    // Header compacto y profesional
    this.drawCompactHeader(doc, pageWidth, 'REPORTE DE ANÁLISIS DE CALIDAD', 'individual');
    
    let currentY = 45;
    
    // Información del análisis en formato tabla
    const testingPoint = testingPoints.find(p => p.id === analysis.testingPointId);
    const overallStatus = this.getOverallStatus(analysis);
    
    currentY = this.drawInfoTable(doc, margin, currentY, contentWidth, {
      'Código de Análisis': analysis.testCode,
      'Fecha de Análisis': this.formatDate(analysis.testDate),
      'Tipo de Prueba': this.getTestTypeLabel(analysis.testType),
      'Estado General': overallStatus,
      'Punto de Prueba': testingPoint ? testingPoint.pointName : analysis.testingPointId,
      'Temperatura del Agua': `${analysis.waterTemperature}°C`,
      'Organización': organizationName,
      'Condiciones Climáticas': analysis.weatherConditions
    });
    
    currentY += 8;
    
    // Tabla de resultados optimizada
    if (analysis.results && analysis.results.length > 0) {
      currentY = this.drawResultsTable(doc, margin, currentY, contentWidth, analysis.results);
      currentY += 8;
    }
    
    // Observaciones en formato tabla si existen
    if (analysis.generalObservations) {
      currentY = this.drawObservationsTable(doc, margin, currentY, contentWidth, analysis.generalObservations);
    }
    
    // Pie de página compacto
    this.drawCompactFooter(doc, pageWidth, pageHeight, margin);
    
    // Descargar el PDF
    const fileName = `Analisis_${analysis.testCode}_${this.formatDateForFile(analysis.testDate)}.pdf`;
    doc.save(fileName);
  }

  /**
   * Genera un PDF con todos los análisis filtrados
   */
  generateAllAnalysesPdf(analyses: QualityTest[], testingPoints: testing_points[], organizationName: string): void {
    const doc = new jsPDF();
    
    // Configuración de página
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 12;
    const contentWidth = pageWidth - 2 * margin;
    
    // Header compacto
    this.drawCompactHeader(doc, pageWidth, 'REPORTE GENERAL DE ANÁLISIS DE CALIDAD', 'general');
    
    let currentY = 45;
    
    // Información del reporte en tabla
    currentY = this.drawInfoTable(doc, margin, currentY, contentWidth, {
      'Organización': organizationName,
      'Total de Análisis': analyses.length.toString(),
      'Fecha de Generación': this.formatDate(new Date().toISOString()),
      'Período Analizado': this.getAnalysisPeriod(analyses)
    });
    
    currentY += 8;
    
    // Resumen estadístico en tabla
    const acceptableCount = analyses.filter(a => this.getOverallStatus(a) === 'Aceptable').length;
    const warningCount = analyses.filter(a => this.getOverallStatus(a) === 'Advertencia').length;
    const criticalCount = analyses.filter(a => this.getOverallStatus(a) === 'Crítico').length;
    
    currentY = this.drawSummaryTable(doc, margin, currentY, contentWidth, {
      'Análisis Aceptables': acceptableCount,
      'Análisis con Advertencia': warningCount,
      'Análisis Críticos': criticalCount,
      'Porcentaje de Conformidad': `${Math.round((acceptableCount / analyses.length) * 100)}%`
    });
    
    currentY += 8;
    
    // Lista completa de análisis
    currentY = this.drawAnalysesTable(doc, margin, currentY, contentWidth, analyses, testingPoints);
    
    // Pie de página
    this.drawCompactFooter(doc, pageWidth, pageHeight, margin);
    
    // Descargar el PDF
    const fileName = `Reporte_General_${this.formatDateForFile(new Date().toISOString())}.pdf`;
    doc.save(fileName);
  }

  /**
   * Genera un PDF de control de cloro
   */
  generateChlorineControlPdf(chlorineRecords: dayliRecors[], organizations: organization[], organizationName: string): void {
    const doc = new jsPDF();
    
    // Configuración de página
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 12;
    const contentWidth = pageWidth - 2 * margin;
    
    // Header compacto y profesional
    this.drawCompactHeader(doc, pageWidth, 'REPORTE DE CONTROL DE CLORO', 'chlorine');
    
    let currentY = 45;
    
    // Información del reporte en tabla
    currentY = this.drawInfoTable(doc, margin, currentY, contentWidth, {
      'Organización': organizationName,
      'Total de Registros': chlorineRecords.length.toString(),
      'Fecha de Generación': this.formatDate(new Date().toISOString()),
      'Período Analizado': this.getChlorinePeriod(chlorineRecords)
    });
    
    currentY += 8;
    
    // Resumen estadístico en tabla
    const acceptableCount = chlorineRecords.filter(record => record.acceptable).length;
    const notAcceptableCount = chlorineRecords.filter(record => !record.acceptable).length;
    const actionRequiredCount = chlorineRecords.filter(record => record.actionRequired).length;
    
    currentY = this.drawSummaryTable(doc, margin, currentY, contentWidth, {
      'Registros Aceptables': acceptableCount,
      'Registros No Aceptables': notAcceptableCount,
      'Acciones Requeridas': actionRequiredCount,
      'Porcentaje de Conformidad': `${Math.round((acceptableCount / chlorineRecords.length) * 100)}%`
    });
    
    currentY += 8;
    
    // Lista completa de registros
    currentY = this.drawChlorineTable(doc, margin, currentY, contentWidth, chlorineRecords, organizations);
    
    // Pie de página compacto
    this.drawCompactFooter(doc, pageWidth, pageHeight, margin);
    
    // Descargar el PDF
    const fileName = `Reporte_Control_Cloro_${this.formatDateForFile(new Date().toISOString())}.pdf`;
    doc.save(fileName);
  }

  /**
   * Genera un PDF de puntos de prueba
   */
  generateTestingPointsPdf(testingPoints: testing_points[], zones: zones[], organizationName: string): void {
    const doc = new jsPDF();
    
    // Configuración de página
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 12;
    const contentWidth = pageWidth - 2 * margin;
    
    // Header compacto y profesional
    this.drawCompactHeader(doc, pageWidth, 'LISTA DE PUNTOS DE PRUEBA', 'testing-points');
    
    let currentY = 45;
    
    // Información del reporte en tabla
    currentY = this.drawInfoTable(doc, margin, currentY, contentWidth, {
      'Organización': organizationName,
      'Total de Puntos de Prueba': testingPoints.length.toString(),
      'Fecha de Generación': this.formatDate(new Date().toISOString())
    });
    
    currentY += 8;
    
    // Lista completa de puntos de prueba
    currentY = this.drawTestingPointsTable(doc, margin, currentY, contentWidth, testingPoints, zones);
    
    // Pie de página compacto
    this.drawCompactFooter(doc, pageWidth, pageHeight, margin);
    
    // Descargar el PDF
    const fileName = `Lista_Puntos_Prueba_${this.formatDateForFile(new Date().toISOString())}.pdf`;
    doc.save(fileName);
  }

  /**
   * Genera un PDF de organizaciones
   */
  generateOrganizationsPdf(organizations: organization[]): void {
    const doc = new jsPDF();
    
    // Configuración de página
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 12;
    const contentWidth = pageWidth - 2 * margin;
    
    // Header compacto y profesional
    this.drawCompactHeader(doc, pageWidth, 'LISTA DE ORGANIZACIONES', 'organizations');
    
    let currentY = 45;
    
    // Información del reporte en tabla
    currentY = this.drawInfoTable(doc, margin, currentY, contentWidth, {
      'Total de Organizaciones': organizations.length.toString(),
      'Fecha de Generación': this.formatDate(new Date().toISOString())
    });
    
    currentY += 8;
    
    // Lista completa de organizaciones
    currentY = this.drawOrganizationsTable(doc, margin, currentY, contentWidth, organizations);
    
    // Pie de página compacto
    this.drawCompactFooter(doc, pageWidth, pageHeight, margin);
    
    // Descargar el PDF
    const fileName = `Lista_Organizaciones_${this.formatDateForFile(new Date().toISOString())}.pdf`;
    doc.save(fileName);
  }

  /**
   * Dibuja un header compacto y profesional
   */
  private drawCompactHeader(doc: jsPDF, pageWidth: number, title: string, type: 'individual' | 'general' | 'chlorine' | 'testing-points' | 'organizations'): void {
    // Fondo del header - ambos tipos usan azul
    const headerColor = [30, 64, 175]; // Azul para ambos tipos
    doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
    doc.rect(0, 0, pageWidth, 32, 'F');
    
    // Logo y título
    doc.setFillColor(255, 255, 255);
    doc.circle(20, 16, 8, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
    doc.text('JASS', 20, 18, { align: 'center' });
    
    // Título principal
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(title, pageWidth / 2, 18, { align: 'center' });
    
    // Subtítulo
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión de Calidad de Agua', pageWidth / 2, 26, { align: 'center' });
    
    // Badge tipo de reporte
    const badgeText = type === 'individual' ? 'INDIVIDUAL' : type === 'general' ? 'CONSOLIDADO' : type === 'chlorine' ? 'CLORO' : type === 'testing-points' ? 'PUNTOS DE PRUEBA' : 'ORGANIZACIONES';
    doc.setFillColor(251, 191, 36);
    doc.rect(pageWidth - 45, 6, 40, 10, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(badgeText, pageWidth - 25, 12, { align: 'center' });
    
    // Línea inferior
    doc.setFillColor(251, 191, 36);
    doc.rect(0, 32, pageWidth, 2, 'F');
    
    // Resetear color
    doc.setTextColor(0, 0, 0);
  }

  /**
   * Dibuja información en formato tabla organizada
   */
  private drawInfoTable(doc: jsPDF, margin: number, startY: number, width: number, data: { [key: string]: string }): number {
    const keys = Object.keys(data);
    const tableData: string[][] = [];
    
    // Organizar datos en pares para tabla de 2 columnas
    for (let i = 0; i < keys.length; i += 2) {
      const leftKey = keys[i];
      const rightKey = keys[i + 1];
      
      tableData.push([
        leftKey || '',
        data[leftKey] || '',
        rightKey || '',
        data[rightKey] || ''
      ]);
    }
    
    autoTable(doc, {
      body: tableData,
      startY: startY,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [203, 213, 225],
        lineWidth: 0.3
      },
      columnStyles: {
        0: { 
          fontStyle: 'bold', 
          textColor: [30, 64, 175],
          cellWidth: width * 0.25,
          fillColor: [248, 250, 252]
        },
        1: { 
          textColor: [30, 41, 59],
          cellWidth: width * 0.25
        },
        2: { 
          fontStyle: 'bold', 
          textColor: [30, 64, 175],
          cellWidth: width * 0.25,
          fillColor: [248, 250, 252]
        },
        3: { 
          textColor: [30, 41, 59],
          cellWidth: width * 0.25
        }
      },
      theme: 'grid'
    });
    
    return (doc as any).lastAutoTable.finalY;
  }

  /**
   * Dibuja tabla de resultados optimizada
   */
  private drawResultsTable(doc: jsPDF, margin: number, startY: number, width: number, results: any[]): number {
    // Título de sección
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('RESULTADOS DEL ANÁLISIS', margin, startY);
    
    const tableData = results.map(result => [
      result.parameterCode,
      result.measuredValue.toString(),
      result.unit,
      this.getStatusText(result.status),
      result.observations || 'Sin observaciones'
    ]);
    
    autoTable(doc, {
      head: [['PARÁMETRO', 'VALOR', 'UNIDAD', 'ESTADO', 'OBSERVACIONES']],
      body: tableData,
      startY: startY + 5,
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        lineColor: [203, 213, 225],
        lineWidth: 0.3
      },
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { 
          cellWidth: 35, 
          fontStyle: 'bold', 
          textColor: [30, 41, 59] 
        },
        1: { 
          cellWidth: 20, 
          halign: 'center', 
          fontStyle: 'bold',
          textColor: [59, 130, 246] 
        },
        2: { 
          cellWidth: 20, 
          halign: 'center',
          fontSize: 7,
          textColor: [100, 116, 139] 
        },
        3: { 
          cellWidth: 25, 
          halign: 'center', 
          fontStyle: 'bold' 
        },
        4: { 
          cellWidth: 'auto',
          fontSize: 7,
          textColor: [71, 85, 105] 
        }
      },
      didParseCell: function(data: any) {
        if (data.column.index === 3) {
          const status = data.cell.text.join('');
          const colors = {
            'Crítico': { bg: [239, 68, 68], text: [255, 255, 255] },
            'Advertencia': { bg: [245, 158, 11], text: [255, 255, 255] },
            'Aceptable': { bg: [34, 197, 94], text: [255, 255, 255] }
          };
          
          const statusColors = colors[status as keyof typeof colors];
          if (statusColors) {
            data.cell.styles.fillColor = statusColors.bg;
            data.cell.styles.textColor = statusColors.text;
          }
        }
      }
    });
    
    return (doc as any).lastAutoTable.finalY;
  }

  /**
   * Dibuja observaciones en formato tabla
   */
  private drawObservationsTable(doc: jsPDF, margin: number, startY: number, width: number, observations: string): number {
    // Título de sección
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('OBSERVACIONES GENERALES', margin, startY);
    
    autoTable(doc, {
      body: [['Observaciones', observations]],
      startY: startY + 5,
      styles: {
        fontSize: 8,
        cellPadding: 4,
        lineColor: [203, 213, 225],
        lineWidth: 0.3
      },
      columnStyles: {
        0: { 
          fontStyle: 'bold', 
          textColor: [146, 64, 14],
          cellWidth: 40,
          fillColor: [254, 249, 195]
        },
        1: { 
          textColor: [92, 54, 0],
          cellWidth: 'auto'
        }
      },
      theme: 'grid'
    });
    
    return (doc as any).lastAutoTable.finalY;
  }

  /**
   * Dibuja resumen estadístico en formato tabla
   */
  private drawSummaryTable(doc: jsPDF, margin: number, startY: number, width: number, data: { [key: string]: number | string }): number {
    // Título de sección
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('RESUMEN ESTADÍSTICO', margin, startY);
    
    const keys = Object.keys(data);
    const tableData: string[][] = [];
    
    // Organizar en pares
    for (let i = 0; i < keys.length; i += 2) {
      const leftKey = keys[i];
      const rightKey = keys[i + 1];
      
      tableData.push([
        leftKey || '',
        data[leftKey]?.toString() || '',
        rightKey || '',
        data[rightKey]?.toString() || ''
      ]);
    }
    
    autoTable(doc, {
      body: tableData,
      startY: startY + 5,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [203, 213, 225],
        lineWidth: 0.3
      },
      columnStyles: {
        0: { 
          fontStyle: 'bold', 
          textColor: [99, 102, 241],
          cellWidth: width * 0.3,
          fillColor: [241, 245, 249]
        },
        1: { 
          textColor: [30, 41, 59],
          fontStyle: 'bold',
          halign: 'center',
          cellWidth: width * 0.2
        },
        2: { 
          fontStyle: 'bold', 
          textColor: [99, 102, 241],
          cellWidth: width * 0.3,
          fillColor: [241, 245, 249]
        },
        3: { 
          textColor: [30, 41, 59],
          fontStyle: 'bold',
          halign: 'center',
          cellWidth: width * 0.2
        }
      },
      theme: 'grid'
    });
    
    return (doc as any).lastAutoTable.finalY;
  }

  /**
   * Dibuja tabla de análisis completa y organizada
   */
  private drawAnalysesTable(doc: jsPDF, margin: number, startY: number, width: number, analyses: QualityTest[], testingPoints: testing_points[]): number {
    // Título de sección
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('LISTA COMPLETA DE ANÁLISIS', margin, startY);
    
    const tableData = analyses.map((analysis, index) => {
      const testingPoint = testingPoints.find(p => p.id === analysis.testingPointId);
      return [
        (index + 1).toString(),
        analysis.testCode,
        this.formatDateShort(analysis.testDate),
        this.getTestTypeLabel(analysis.testType),
        testingPoint ? testingPoint.pointName : analysis.testingPointId,
        this.getOverallStatus(analysis)
      ];
    });
    
    autoTable(doc, {
      head: [['#', 'CÓDIGO', 'FECHA', 'TIPO', 'PUNTO DE PRUEBA', 'ESTADO']],
      body: tableData,
      startY: startY + 5,
      styles: {
        fontSize: 7,
        cellPadding: 2,
        lineColor: [203, 213, 225],
        lineWidth: 0.3
      },
      headStyles: {
        fillColor: [168, 85, 247],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { 
          cellWidth: 10, 
          halign: 'center',
          textColor: [100, 116, 139] 
        },
        1: { 
          cellWidth: 28, 
          fontStyle: 'bold',
          textColor: [30, 41, 59] 
        },
        2: { 
          cellWidth: 25, 
          halign: 'center',
          fontSize: 7,
          textColor: [100, 116, 139] 
        },
        3: { 
          cellWidth: 20, 
          halign: 'center',
          fontSize: 7,
          textColor: [100, 116, 139] 
        },
        4: { 
          cellWidth: 'auto',
          fontSize: 7,
          textColor: [71, 85, 105] 
        },
        5: { 
          cellWidth: 22, 
          halign: 'center',
          fontStyle: 'bold',
          fontSize: 7
        }
      },
      didParseCell: function(data: any) {
        if (data.column.index === 5) {
          const status = data.cell.text.join('');
          const colors = {
            'Crítico': { bg: [239, 68, 68], text: [255, 255, 255] },
            'Advertencia': { bg: [245, 158, 11], text: [255, 255, 255] },
            'Aceptable': { bg: [34, 197, 94], text: [255, 255, 255] }
          };
          
          const statusColors = colors[status as keyof typeof colors];
          if (statusColors) {
            data.cell.styles.fillColor = statusColors.bg;
            data.cell.styles.textColor = statusColors.text;
          }
        }
      }
    });
    
    return (doc as any).lastAutoTable.finalY;
  }

  /**
   * Dibuja un pie de página compacto
   */
  private drawCompactFooter(doc: jsPDF, pageWidth: number, pageHeight: number, margin: number): void {
    const pageCount = doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      const footerY = pageHeight - 20;
      
      // Línea superior
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY, pageWidth - margin, footerY);
      
      // Información del pie de página
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      
      // Página actual
      doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, footerY + 8, { align: 'center' });
      
      // Fecha de generación
      doc.text(`Generado: ${this.formatDateShort(new Date().toISOString())}`, margin, footerY + 8);
      
      // Sistema
      doc.text('Sistema JASS v2.0', pageWidth - margin, footerY + 8, { align: 'right' });
      
      // Contacto
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text('Para consultas: calidad@jass.gob.pe', pageWidth / 2, footerY + 15, { align: 'center' });
    }
  }

  // Métodos auxiliares optimizados

  private getOverallStatus(analysis: QualityTest): string {
    if (!analysis.results || analysis.results.length === 0) {
      return 'Pendiente';
    }

    const hasCritical = analysis.results.some(result => result.status === 'CRITICAL');
    const hasWarning = analysis.results.some(result => result.status === 'WARNING');

    if (hasCritical) return 'Crítico';
    if (hasWarning) return 'Advertencia';
    return 'Aceptable';
  }

  private getStatusText(status: string): string {
    const statusMap = {
      'ACCEPTABLE': 'Aceptable',
      'WARNING': 'Advertencia',
      'CRITICAL': 'Crítico'
    };
    return statusMap[status as keyof typeof statusMap] || 'Pendiente';
  }

  private getTestTypeLabel(testType: string): string {
    const typeMap = {
      'RUTINARIO': 'Rutinario',
      'ESPECIAL': 'Especial',
      'INCIDENCIA': 'Incidencia'
    };
    return typeMap[testType as keyof typeof typeMap] || testType;
  }

  private getAnalysisPeriod(analyses: QualityTest[]): string {
    if (analyses.length === 0) return 'N/A';
    
    const dates = analyses.map(a => new Date(a.testDate)).sort((a, b) => a.getTime() - b.getTime());
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    
    if (firstDate.getTime() === lastDate.getTime()) {
      return this.formatDateShort(firstDate.toISOString());
    }
    
    return `${this.formatDateShort(firstDate.toISOString())} - ${this.formatDateShort(lastDate.toISOString())}`;
  }

  private formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  private formatDateShort(dateString: string): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  }

  private formatDateForFile(dateString: string): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'fecha';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}${month}${year}`;
  }

  /**
   * Obtiene colores según el estado para elementos visuales
   */
  private getStatusColors(status: string) {
    const colorMap = {
      'Aceptable': {
        bg: [34, 197, 94],
        border: [21, 128, 61],
        text: [255, 255, 255]
      },
      'Advertencia': {
        bg: [245, 158, 11],
        border: [217, 119, 6],
        text: [255, 255, 255]
      },
      'Crítico': {
        bg: [239, 68, 68],
        border: [185, 28, 28],
        text: [255, 255, 255]
      }
    };
    
    return colorMap[status as keyof typeof colorMap] || {
      bg: [100, 116, 139],
      border: [71, 85, 105],
      text: [255, 255, 255]
    };
  }

  /**
   * Divide texto en líneas según el ancho máximo
   */
  private splitTextToSize(doc: jsPDF, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? currentLine + ' ' + word : word;
      const testWidth = doc.getTextWidth(testLine);
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  /**
   * Obtiene el período de registros de cloro
   */
  private getChlorinePeriod(records: dayliRecors[]): string {
    if (records.length === 0) return 'N/A';
    
    const dates = records.map(r => new Date(r.recordDate)).sort((a, b) => a.getTime() - b.getTime());
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    
    if (firstDate.getTime() === lastDate.getTime()) {
      return this.formatDateShort(firstDate.toISOString());
    }
    
    return `${this.formatDateShort(firstDate.toISOString())} - ${this.formatDateShort(lastDate.toISOString())}`;
  }

  /**
   * Dibuja tabla de registros de cloro
   */
  private drawChlorineTable(doc: jsPDF, margin: number, startY: number, width: number, records: dayliRecors[], organizations: organization[]): number {
    // Título de sección
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('REGISTROS DE CONTROL DE CLORO', margin, startY);
    
    const tableData = records.map((record, index) => {
      const organization = organizations.find(o => o.organizationId === record.organizationId);
      return [
        (index + 1).toString(),
        record.recordCode,
        this.formatDateShort(record.recordDate),
        record.recordType,
        organization ? organization.organizationName : record.organizationId,
        `${record.level} ppm`,
        record.acceptable ? 'Aceptable' : 'No Aceptable',
        record.actionRequired ? 'Sí' : 'No'
      ];
    });
    
    autoTable(doc, {
      head: [['#', 'CÓDIGO', 'FECHA', 'TIPO', 'ORGANIZACIÓN', 'NIVEL', 'ACEPTABLE', 'ACCIÓN REQ.']],
      body: tableData,
      startY: startY + 5,
      styles: {
        fontSize: 7,
        cellPadding: 2,
        lineColor: [203, 213, 225],
        lineWidth: 0.3
      },
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { 
          cellWidth: 8, 
          halign: 'center', 
          textColor: [100, 116, 139] 
        },
        1: { 
          cellWidth: 25, 
          fontStyle: 'bold', 
          textColor: [30, 41, 59] 
        },
        2: { 
          cellWidth: 25, 
          halign: 'center', 
          fontSize: 7,
          textColor: [100, 116, 139] 
        },
        3: { 
          cellWidth: 20, 
          halign: 'center', 
          fontSize: 7,
          textColor: [100, 116, 139] 
        },
        4: { 
          cellWidth: 'auto',
          fontSize: 7,
          textColor: [71, 85, 105] 
        },
        5: { 
          cellWidth: 20, 
          halign: 'center', 
          fontSize: 7,
          textColor: [100, 116, 139] 
        },
        6: { 
          cellWidth: 20, 
          halign: 'center', 
          fontStyle: 'bold',
          fontSize: 7
        },
        7: { 
          cellWidth: 18, 
          halign: 'center', 
          fontStyle: 'bold',
          fontSize: 7
        }
      },
      didParseCell: function(data: any) {
        if (data.column.index === 6) {
          const status = data.cell.text.join('');
          if (status === 'Aceptable') {
            data.cell.styles.fillColor = [34, 197, 94];
            data.cell.styles.textColor = [255, 255, 255];
          } else {
            data.cell.styles.fillColor = [239, 68, 68];
            data.cell.styles.textColor = [255, 255, 255];
          }
        }
        if (data.column.index === 7) {
          const action = data.cell.text.join('');
          if (action === 'Sí') {
            data.cell.styles.fillColor = [245, 158, 11];
            data.cell.styles.textColor = [255, 255, 255];
          } else {
            data.cell.styles.fillColor = [156, 163, 175];
            data.cell.styles.textColor = [255, 255, 255];
          }
        }
      }
    });
    
    return (doc as any).lastAutoTable.finalY;
  }

  /**
   * Dibuja tabla de puntos de prueba
   */
  private drawTestingPointsTable(doc: jsPDF, margin: number, startY: number, width: number, points: testing_points[], zones: zones[]): number {
    // Título de sección
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('LISTA DE PUNTOS DE PRUEBA', margin, startY);
    
    const tableData = points.map((point, index) => {
      const zone = zones.find(z => z.zoneId === point.zoneId);
      return [
        (index + 1).toString(),
        point.pointCode,
        point.pointName,
        this.getPointTypeLabel(point.pointType),
        zone ? zone.zoneName : point.zoneId,
        point.locationDescription,
        this.getStatusLabel(point.status)
      ];
    });
    
    autoTable(doc, {
      head: [['#', 'CÓDIGO', 'NOMBRE', 'TIPO', 'ZONA', 'DESCRIPCIÓN', 'ESTADO']],
      body: tableData,
      startY: startY + 5,
      styles: {
        fontSize: 7,
        cellPadding: 2,
        lineColor: [203, 213, 225],
        lineWidth: 0.3
      },
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { 
          cellWidth: 8, 
          halign: 'center', 
          textColor: [100, 116, 139] 
        },
        1: { 
          cellWidth: 25, 
          fontStyle: 'bold', 
          textColor: [30, 41, 59] 
        },
        2: { 
          cellWidth: 'auto',
          fontSize: 7,
          textColor: [71, 85, 105] 
        },
        3: { 
          cellWidth: 20, 
          halign: 'center', 
          fontSize: 7,
          textColor: [100, 116, 139] 
        },
        4: { 
          cellWidth: 25,
          fontSize: 7,
          textColor: [100, 116, 139] 
        },
        5: { 
          cellWidth: 'auto',
          fontSize: 7,
          textColor: [71, 85, 105] 
        },
        6: { 
          cellWidth: 20, 
          halign: 'center', 
          fontStyle: 'bold',
          fontSize: 7
        }
      },
      didParseCell: function(data: any) {
        if (data.column.index === 6) {
          const status = data.cell.text.join('');
          if (status === 'ACTIVE') {
            data.cell.styles.fillColor = [34, 197, 94];
            data.cell.styles.textColor = [255, 255, 255];
          } else {
            data.cell.styles.fillColor = [239, 68, 68];
            data.cell.styles.textColor = [255, 255, 255];
          }
        }
      }
    });
    
    return (doc as any).lastAutoTable.finalY;
  }

  /**
   * Dibuja tabla de organizaciones
   */
  private drawOrganizationsTable(doc: jsPDF, margin: number, startY: number, width: number, organizations: organization[]): number {
    // Título de sección
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('LISTA DE ORGANIZACIONES', margin, startY);

    const tableData = organizations.map((org, index) => [
      (index + 1).toString(),
      org.organizationCode,
      org.organizationName,
      org.legalRepresentative,
      org.address,
      org.phone,
      this.getOrganizationStatusLabel(org.status)
    ]);

    autoTable(doc, {
      head: [['#', 'CÓDIGO', 'NOMBRE', 'REPRESENTANTE', 'DIRECCIÓN', 'TELÉFONO', 'ESTADO']],
      body: tableData,
      startY: startY + 5,
      styles: {
        fontSize: 7,
        cellPadding: 2,
        lineColor: [203, 213, 225],
        lineWidth: 0.3
      },
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { 
          cellWidth: 8, 
          halign: 'center', 
          textColor: [100, 116, 139] 
        },
        1: { 
          cellWidth: 25, 
          fontStyle: 'bold', 
          textColor: [30, 41, 59] 
        },
        2: { 
          cellWidth: 'auto',
          fontSize: 7,
          textColor: [71, 85, 105] 
        },
        3: { 
          cellWidth: 20, 
          halign: 'center', 
          fontSize: 7,
          textColor: [100, 116, 139] 
        },
        4: { 
          cellWidth: 25,
          fontSize: 7,
          textColor: [100, 116, 139] 
        },
        5: { 
          cellWidth: 20, 
          halign: 'center', 
          fontSize: 7,
          textColor: [100, 116, 139] 
        },
        6: { 
          cellWidth: 20, 
          halign: 'center', 
          fontStyle: 'bold',
          fontSize: 7
        }
      }
    });

    return (doc as any).lastAutoTable.finalY;
  }

  /**
   * Obtiene etiqueta del tipo de punto
   */
  private getPointTypeLabel(pointType: string): string {
    const typeMap = {
      'RUTINARIO': 'Rutinario',
      'ESPECIAL': 'Especial',
      'INCIDENCIA': 'Incidencia'
    };
    return typeMap[pointType as keyof typeof typeMap] || pointType;
  }

  /**
   * Obtiene etiqueta del estado
   */
  private getStatusLabel(status: string): string {
    const statusMap = {
      'ACTIVE': 'Activo',
      'INACTIVE': 'Inactivo'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  }

  /**
   * Obtiene etiqueta del estado de la organización
   */
  private getOrganizationStatusLabel(status: string): string {
    const statusMap = {
      'ACTIVE': 'Activo',
      'INACTIVE': 'Inactivo'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  }
}
