import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { QualityTest, testing_points } from '../../../../core/models/water-quality.model';
import { WaterQualityService } from '../../../../core/services/water-quality.service';
import { PdfService } from '../../../../core/services/pdf.service';
import { AuthService } from '../../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { OrganizationResolverService } from 'app/modules/organizations/components/services/organization-resolver.service';

@Component({
  selector: 'app-analysis-list',
  templateUrl: './analysis-list.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AnalysisListComponent implements OnInit {
  analyses: QualityTest[] = [];
  filteredAnalyses: QualityTest[] = [];
  loading = false;
  showAlert = false;
  alertType: 'success' | 'error' | 'info' = 'info';
  alertMessage = '';
  searchTerm = '';
  selectedAnalysisType = 'todos';
  selectedStatus = 'todos';
  testingPoints: testing_points[] = [];
  organizationName: string = '';

  constructor(
    private waterQualityService: WaterQualityService,
    private router: Router,
    private pdfService: PdfService,
    private organizationResolver: OrganizationResolverService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadAnalyses();
    this.loadTestingPoints();
    this.loadOrganizationName();
  }

  private loadAnalyses(): void {
    this.loading = true;
    this.waterQualityService.getAllTest().subscribe({
      next: (analyses) => {
        this.analyses = analyses;
        this.filteredAnalyses = analyses;
        this.loading = false;
      },
      error: (error) => {
        this.handleError('Error al cargar los análisis', error);
        this.loading = false;
      }
    });
  }
  
  onSearch(): void {
    this.filterAnalyses();
  }

  onAnalysisTypeChange(): void {
    this.filterAnalyses();
  }

  onStatusChange(): void {
    this.filterAnalyses();
  }

  private filterAnalyses(): void {
    this.filteredAnalyses = this.analyses.filter(analysis => {
      const testingPointName = this.getTestingPointName(analysis.testingPointId);
      const matchesSearch = !this.searchTerm || 
        analysis.testCode.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        testingPointName.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesType = this.selectedAnalysisType === 'todos' || 
        analysis.testType === this.selectedAnalysisType;

      const matchesStatus = this.selectedStatus === 'todos' || 
        this.getStatusText(analysis) === this.selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }

  getAcceptableAnalysesCount(): number {
    return this.analyses.filter(analysis => 
      this.getStatusText(analysis) === 'Aceptable'
    ).length;
  }

  getWarningAnalysesCount(): number {
    return this.analyses.filter(analysis => 
      this.getStatusText(analysis) === 'Advertencia'
    ).length;
  }

  getCriticalAnalysesCount(): number {
    return this.analyses.filter(analysis => 
      this.getStatusText(analysis) === 'Crítico'
    ).length;
  }

  getStatusText(analysis: QualityTest): string {
    if (!analysis || !analysis.results || analysis.results.length === 0) {
      return 'Pendiente';
    }

    const hasCritical = analysis.results.some(result => result.status === 'CRITICAL');
    const hasWarning = analysis.results.some(result => result.status === 'WARNING');

    if (hasCritical) return 'Crítico';
    if (hasWarning) return 'Advertencia';
    return 'Aceptable';
  }

  getStatusClass(analysis: QualityTest): string {
    const status = this.getStatusText(analysis);
    switch (status) {
      case 'Aceptable':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Advertencia':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Crítico':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  }

  viewAnalysisDetail(id: string): void {
    this.router.navigate(['/admin/water-quality/testDetail', id]);
  }

  addNewAnalysis(): void {
    this.router.navigate(['/admin/water-quality/testNew']);
  }

  updateAnalysis(id:string):void{
    this.router.navigate(['/admin/water-quality/testEdit',id])
  }

  trackByAnalysisId(index: number, analysis: QualityTest): string {
    return analysis.id;
  }

  getTestingPointName(testingPointId: string): string {
    const point = this.testingPoints.find(p => p.id === testingPointId);
    return point ? point.pointName : testingPointId;
  }

  private handleError(message: string, error: any): void {
    console.error('Error:', error);
    this.showAlert = true;
    this.alertType = 'error';
    this.alertMessage = message;
  }

  dismissAlert(): void {
    this.showAlert = false;
  }

  loadTestingPoints(): void {
    this.waterQualityService.getAllTestingPoints().subscribe({
      next: (points) => {
        console.log('Puntos de prueba cargados:', points);
        this.testingPoints = points;
      },
      error: (error) => {
        console.error('Error al cargar los puntos de prueba:', error);
      }
    });
  }

  private loadOrganizationName(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.organizationId) {
      this.organizationResolver.getOrganizationName(currentUser.organizationId).subscribe({
        next: (organizationName) => {
          this.organizationName = organizationName;
          console.log('Nombre de organización cargado:', this.organizationName);
        },
        error: (error) => {
          console.error('Error al cargar nombre de organización:', error);
          this.organizationName = `Organización ${currentUser.organizationId}`;
        }
      });
    } else {
      console.warn('Usuario no tiene organización asignada');
      this.organizationName = 'Organización no disponible';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    const months = [
      'ene', 'feb', 'mar', 'abr', 'may', 'jun',
      'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
    ];
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);
    
    return `${day}-${month}-${year}`;
  }

  getTestTypeLabel(testType: string): string {
    switch (testType) {
      case 'RUTINARIO':
        return 'Rutinario';
      case 'ESPECIAL':
        return 'Especial';
      case 'INCIDENCIA':
        return 'Incidencia';
      default:
        return testType;
    }
  }

  /**
   * Descarga un PDF individual de un análisis
   */
  downloadAnalysisPdf(analysis: QualityTest): void {
    try {
      this.pdfService.generateAnalysisPdf(analysis, this.testingPoints, this.organizationName);
      this.showSuccessAlert('PDF generado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.handleError('Error al generar el PDF', error);
    }
  }

  /**
   * Descarga un PDF con todos los análisis filtrados
   */
  downloadAllAnalysesPdf(): void {
    try {
      if (this.filteredAnalyses.length === 0) {
        this.showInfoAlert('No hay análisis para generar el PDF');
        return;
      }
      
      this.pdfService.generateAllAnalysesPdf(this.filteredAnalyses, this.testingPoints, this.organizationName);
      this.showSuccessAlert('PDF general generado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF general:', error);
      this.handleError('Error al generar el PDF general', error);
    }
  }

  private showSuccessAlert(message: string): void {
    this.showAlert = true;
    this.alertType = 'success';
    this.alertMessage = message;
    setTimeout(() => this.dismissAlert(), 3000);
  }

  private showInfoAlert(message: string): void {
    this.showAlert = true;
    this.alertType = 'info';
    this.alertMessage = message;
    setTimeout(() => this.dismissAlert(), 3000);
  }
}
