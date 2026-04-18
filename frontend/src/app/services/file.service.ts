import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // File operations
  uploadFile(file: File, description: string, isPublic: boolean): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    formData.append('isPublic', isPublic.toString());
    
    return this.http.post(`${this.apiUrl}/files/upload`, formData)
      .pipe(catchError(this.handleError));
  }

  getMyFiles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/files/my-files`)
      .pipe(catchError(this.handleError));
  }

  getPublicFiles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/files/public`)
      .pipe(catchError(this.handleError));
  }

  getVisibleFiles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/files/visible`)
      .pipe(catchError(this.handleError));
  }

  // CORRIGÉ: Obtenir tous les fichiers privés d'autres utilisateurs
  getFilesForAccessRequest(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/files/for-request`)
      .pipe(catchError(this.handleError));
  }

  // NOUVELLE MÉTHODE: Alias pour getFilesForAccessRequest
  getOthersPrivateFiles(): Observable<any[]> {
    return this.getFilesForAccessRequest();
  }

  downloadFile(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/files/download/${id}`, {
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  deleteFile(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/files/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Demander l'accès à un fichier
  requestAccess(fileId: number, message?: string): Observable<any> {
    const formData = new FormData();
    if (message) {
      formData.append('message', message);
    }
    
    return this.http.post(
      `${this.apiUrl}/files/${fileId}/request-access`, 
      formData
    ).pipe(catchError(this.handleError));
  }

  // Obtenir les demandes reçues
  getReceivedRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/requests/received`)
      .pipe(catchError(this.handleError));
  }

  // Obtenir les demandes envoyées
  getSentRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/requests/sent`)
      .pipe(catchError(this.handleError));
  }

  // Mettre à jour le statut d'une demande
  updateRequestStatus(requestId: number, status: string): Observable<any> {
    const params = new HttpParams().set('status', status);
    return this.http.put(
      `${this.apiUrl}/requests/${requestId}`, 
      {},
      { params }
    ).pipe(catchError(this.handleError));
  }

  // Supprimer une demande
  deleteRequest(requestId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/requests/${requestId}`)
      .pipe(catchError(this.handleError));
  }

  // Vérifier si l'utilisateur a accès à un fichier
  checkAccess(fileId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/files/${fileId}/check-access`)
      .pipe(catchError(this.handleError));
  }

  // Vérifier si l'utilisateur peut demander l'accès
  canRequestAccess(fileId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/files/${fileId}/can-request`)
      .pipe(catchError(this.handleError));
  }

  // Vérifier si l'utilisateur a déjà demandé l'accès
  hasRequestedAccess(fileId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/files/${fileId}/has-requested`)
      .pipe(catchError(this.handleError));
  }

  // Prévisualiser un fichier
  previewFile(fileId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/files/preview/${fileId}`, {
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  // Obtenir les informations d'un fichier
  getFileInfo(fileId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/files/${fileId}`)
      .pipe(catchError(this.handleError));
  }

  // Obtenir les détails d'un fichier privé
  getPrivateFileDetails(fileId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/private-files/${fileId}`)
      .pipe(catchError(this.handleError));
  }

  // Vérification rapide d'un fichier privé
  quickCheckFile(fileId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/private-files/${fileId}/quick-check`)
      .pipe(catchError(this.handleError));
  }

  // NOUVELLE MÉTHODE: Vérifier si un fichier est approuvé
  checkFileApproval(fileId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/files/${fileId}/check-access`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'Unable to connect to server. Please check your connection.';
    } else if (error.status === 403) {
      errorMessage = 'Access denied. You may need to request access to this file.';
    } else if (error.status === 404) {
      errorMessage = 'Resource not found.';
    } else if (error.error && error.error.error) {
      errorMessage = error.error.error;
    } else if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}