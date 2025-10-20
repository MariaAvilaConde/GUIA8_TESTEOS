import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Product {
     productId: string;
     organizationId: string;
     categoryId: string;
     productCode: string;
     productName: string;
     productDescription: string;
     unitMeasure: string;
     unitCost: number;
     salePrice: number;
     currentStock: number;
     minimumStock: number;
     maximumStock: number;
     status: boolean;
     categoryName?: string;
     createdAt: string;
     updatedAt: string;
}

export interface MaterialResponse {
     status: boolean;
     message: string;
     data: ProductResponse[];
}

export interface ProductResponse {
     productId: string;
     organizationId: string;
     categoryId: string;
     productCode: string;
     productName: string;
     productDescription: string;
     unitMeasure: string;
     unitCost: number;
     salePrice: number;
     currentStock: number;
     minimumStock: number;
     maximumStock: number;
     status: string; // ACTIVO, INACTIVO, DESCONTINUADO
     categoryName?: string;
     createdAt: string;
     updatedAt: string;
}

@Injectable({
     providedIn: 'root'
})
export class ProductService {

     private readonly apiUrl = `${environment.inventoryApiUrl}/materials`;

     constructor(private http: HttpClient) { }

     /**
      * Obtener productos por organización
      */
     getProductsByOrganization(organizationId: string): Observable<Product[]> {
          return this.http.get<MaterialResponse>(`${this.apiUrl}?organizationId=${organizationId}`)
               .pipe(
                    map(response => {
                         if (response.status && response.data) {
                              return response.data.map(material => ({
                                   productId: material.productId,
                                   organizationId: material.organizationId,
                                   categoryId: material.categoryId,
                                   productCode: material.productCode,
                                   productName: material.productName,
                                   productDescription: material.productDescription,
                                   unitMeasure: material.unitMeasure,
                                   unitCost: material.unitCost || 0,
                                   salePrice: material.salePrice || 0,
                                   currentStock: material.currentStock || 0,
                                   minimumStock: material.minimumStock || 0,
                                   maximumStock: material.maximumStock || 100,
                                   status: material.status === 'ACTIVO',
                                   categoryName: material.categoryName,
                                   createdAt: material.createdAt,
                                   updatedAt: material.updatedAt
                              } as Product));
                         }
                         return [];
                    })
               );
     }

     /**
      * Obtener producto por ID
      */
     getProductById(productId: string): Observable<Product> {
          return this.http.get<Product>(`${this.apiUrl}/${productId}`);
     }

     /**
      * Obtener todos los productos
      */
     getAllProducts(): Observable<Product[]> {
          return this.http.get<Product[]>(this.apiUrl);
     }
}
