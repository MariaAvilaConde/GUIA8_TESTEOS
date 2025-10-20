import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WaterBoxAssignment } from 'app/core/models/box.model';

@Injectable({
  providedIn: 'root',
})
export class BoxAssignmentReportService {
  generatePDF(
    assignments: WaterBoxAssignment[],
    getBoxCodeById: (id: number) => string,
    getUsernameById: (id: string) => string
  ): void {
    const doc = new jsPDF();

    // Título del reporte
    doc.setFontSize(18);
    doc.text('Reporte de Asignaciones de Cajas de Agua', 10, 10);

    // Configuración de la tabla
    const tableData = assignments.map((assignment) => [
      assignment.id,
      getBoxCodeById(assignment.waterBoxId),
      getUsernameById(assignment.userId),
      assignment.startDate.split('T')[0],
      assignment.endDate ? assignment.endDate.split('T')[0] : '-',
      `S/${assignment.monthlyFee.toFixed(2)}`,
      assignment.status,
    ]);

    const tableHeaders = [
      'N°',
      'N° Suministro',
      'Usuario',
      'Inicio',
      'Fin',
      'Cuota',
      'Estado',
    ];

    // Generar la tabla
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: 20,
      styles: { fontSize: 10, halign: 'center' },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      bodyStyles: { textColor: 50 },
    });

    // Descargar el PDF
    doc.save('Reporte_Asignaciones_Cajas.pdf');
  }
}
