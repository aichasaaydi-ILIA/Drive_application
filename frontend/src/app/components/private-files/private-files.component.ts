import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

// Pipes
import { DateAgoPipe } from '../../pipes/date-ago.pipe';
import { FileSizePipe } from '../../pipes/file-size.pipe';

// Composants
import { RequestAccessDialogComponent } from '../dialogs/request-access-dialog/request-access-dialog.component';

// Services
import { FileService } from '../../services/file.service';

@Component({
  selector: 'app-private-files',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    DateAgoPipe,
    FileSizePipe
  ],
  template: `
    <div class="private-files-container">
      <div class="header">
        <h2>
          <mat-icon class="header-icon">lock</mat-icon>
          Private Files from Other Users
        </h2>
        <p class="subtitle">
          Browse private files from other users. Request access or download if approved.
        </p>
      </div>

      <!-- Statistiques -->
      <div class="stats-cards">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">folder</mat-icon>
              <div>
                <h3>{{privateFiles.length}}</h3>
                <p>Total Private Files</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">pending_actions</mat-icon>
              <div>
                <h3>{{pendingFilesCount}}</h3>
                <p>Pending Requests</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">check_circle</mat-icon>
              <div>
                <h3>{{approvedFilesCount}}</h3>
                <p>Approved Access</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Liste des fichiers -->
      <div class="files-section">
        <div class="section-header">
          <h3>All Private Files</h3>
          <button mat-button (click)="loadPrivateFiles()" [disabled]="loading">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </div>

        <!-- Loading state -->
        <div *ngIf="loading" class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading private files...</p>
        </div>

        <!-- Empty state -->
        <div *ngIf="!loading && privateFiles.length === 0" class="empty-state">
          <mat-icon class="empty-icon">folder_off</mat-icon>
          <h4>No Private Files Available</h4>
          <p>There are currently no private files from other users available.</p>
        </div>

        <!-- Files grid -->
        <div class="files-grid" *ngIf="!loading && privateFiles.length > 0">
          <mat-card *ngFor="let file of privateFiles" class="file-card" 
                    [ngClass]="{'approved-file': file.hasAccess}">
            <mat-card-header>
              <div mat-card-avatar class="status-indicator" 
                   [ngClass]="getStatusClass(file.requestStatus)">
                <mat-icon>{{getStatusIcon(file.requestStatus, file.hasAccess)}}</mat-icon>
              </div>
              <mat-card-title>
                <div class="file-header">
                  <mat-icon [ngClass]="getFileIconClass(file.fileType)">
                    {{getFileIcon(file.fileType)}}
                  </mat-icon>
                  <span class="file-name">{{file.fileName}}</span>
                </div>
              </mat-card-title>
              <mat-card-subtitle>
                <div class="owner-info">
                  <mat-icon class="owner-icon">person</mat-icon>
                  <span>{{getOwnerName(file)}}</span>
                </div>
              </mat-card-subtitle>
            </mat-card-header>

            <mat-card-content>
              <p class="file-description" *ngIf="file.description">
                {{file.description}}
              </p>
              
              <div class="file-meta">
                <span class="meta-item">
                  <mat-icon>description</mat-icon>
                  {{file.fileType || 'Unknown'}}
                </span>
                <span class="meta-item">
                  <mat-icon>storage</mat-icon>
                  {{file.fileSize | fileSize}}
                </span>
                <span class="meta-item">
                  <mat-icon>calendar_today</mat-icon>
                  {{formatDate(file.uploadedAt)}}
                </span>
              </div>

              <!-- Status badge -->
              <div class="status-badge" [ngClass]="getStatusClass(file.requestStatus)">
                <span class="status-text">
                  {{getStatusText(file.requestStatus, file.hasAccess)}}
                </span>
              </div>

              <!-- Request message -->
              <div *ngIf="file.requestMessage" class="request-message">
                <p><strong>Your request:</strong> {{file.requestMessage}}</p>
              </div>
            </mat-card-content>

            <mat-card-actions>
              <!-- Request access button -->
              <button mat-raised-button 
                      color="accent" 
                      *ngIf="file.canRequest"
                      (click)="openRequestDialog(file)">
                <mat-icon>lock_open</mat-icon>
                Request Access
              </button>

              <!-- Download button -->
              <button mat-raised-button 
                      color="primary" 
                      *ngIf="file.hasAccess || file.requestStatus === 'APPROVED'"
                      (click)="downloadFile(file)">
                <mat-icon>download</mat-icon>
                Download
              </button>

              <!-- View details button -->
              <button mat-button 
                      color="primary" 
                      (click)="viewFileDetails(file)">
                <mat-icon>info</mat-icon>
                Details
              </button>

              <!-- Pending status -->
              <span *ngIf="file.requestStatus === 'PENDING'" class="pending-text">
                <mat-icon>schedule</mat-icon>
                Request pending
              </span>
            </mat-card-actions>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .private-files-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 32px;
      text-align: center;
    }

    .header h2 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin: 0 0 8px 0;
      color: #333;
    }

    .header-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .subtitle {
      color: #666;
      margin: 0;
      font-size: 16px;
    }

    .stats-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .stat-card {
      transition: transform 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .stat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #3f51b5;
    }

    .stat-card h3 {
      margin: 0;
      font-size: 32px;
      font-weight: 500;
      color: #333;
    }

    .stat-card p {
      margin: 4px 0 0 0;
      color: #666;
    }

    .files-section {
      background: white;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #eee;
    }

    .section-header h3 {
      margin: 0;
      color: #333;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 0;
      color: #666;
    }

    .loading-state p {
      margin-top: 16px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 0;
      color: #666;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      color: #ccc;
    }

    .empty-state h4 {
      margin: 0 0 8px 0;
      color: #333;
    }

    .files-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .file-card {
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .file-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .approved-file {
      border-left: 4px solid #4caf50;
    }

    .status-indicator {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .status-approved {
      background-color: #4caf50;
    }

    .status-pending {
      background-color: #ff9800;
    }

    .status-rejected {
      background-color: #f44336;
    }

    .status-none {
      background-color: #9e9e9e;
    }

    .file-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .file-header mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .pdf-icon {
      color: #f44336;
    }

    .doc-icon {
      color: #2196f3;
    }

    .image-icon {
      color: #4caf50;
    }

    .generic-icon {
      color: #ff9800;
    }

    .file-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 500;
    }

    .owner-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      margin-top: 4px;
    }

    .owner-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .file-description {
      margin: 16px 0;
      color: #555;
      font-size: 14px;
      line-height: 1.5;
      min-height: 40px;
    }

    .file-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin: 16px 0;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #666;
      background: #f5f5f5;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .meta-item mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      margin: 8px 0;
    }

    .status-approved {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .status-pending {
      background-color: #fff3e0;
      color: #ef6c00;
    }

    .status-rejected {
      background-color: #ffebee;
      color: #c62828;
    }

    .status-none {
      background-color: #f5f5f5;
      color: #616161;
    }

    .request-message {
      margin: 12px 0;
      padding: 8px;
      background: #f9f9f9;
      border-radius: 4px;
      font-size: 12px;
    }

    .request-message p {
      margin: 0;
    }

    mat-card-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px 16px !important;
      border-top: 1px solid #eee;
    }

    .pending-text {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #ff9800;
      font-size: 12px;
    }
  `]
})
export class PrivateFilesComponent implements OnInit {
  privateFiles: any[] = [];
  loading = false;
  pendingFilesCount = 0;
  approvedFilesCount = 0;

  constructor(
    private fileService: FileService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPrivateFiles();
  }

  loadPrivateFiles(): void {
    this.loading = true;
    this.fileService.getOthersPrivateFiles().subscribe({
      next: (files) => {
        console.log('Private files loaded:', files);
        this.privateFiles = files;
        this.calculateStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading private files:', error);
        this.snackBar.open('Error loading private files: ' + error.message, 'Close', {
          duration: 5000
        });
        this.loading = false;
      }
    });
  }

  calculateStats(): void {
    this.pendingFilesCount = this.privateFiles.filter(file => 
      file.requestStatus === 'PENDING'
    ).length;
    
    this.approvedFilesCount = this.privateFiles.filter(file => 
      file.hasAccess || file.requestStatus === 'APPROVED'
    ).length;
  }

  getOwnerName(file: any): string {
    if (typeof file.owner === 'string') {
      return file.owner;
    }
    
    if (file.owner && typeof file.owner === 'object') {
      if (file.owner.firstName && file.owner.lastName) {
        return `${file.owner.firstName} ${file.owner.lastName}`;
      }
      if (file.owner.name) {
        return file.owner.name;
      }
      if (file.owner.email) {
        return file.owner.email;
      }
    }
    
    return file.ownerName || file.ownerEmail || 'Unknown Owner';
  }

  getFileIcon(fileType: string): string {
    if (!fileType) return 'insert_drive_file';
    if (fileType.includes('pdf')) return 'picture_as_pdf';
    if (fileType.includes('word') || fileType.includes('document')) return 'description';
    if (fileType.includes('image')) return 'image';
    if (fileType.includes('text')) return 'text_snippet';
    return 'insert_drive_file';
  }

  getFileIconClass(fileType: string): string {
    if (!fileType) return 'generic-icon';
    if (fileType.includes('pdf')) return 'pdf-icon';
    if (fileType.includes('word') || fileType.includes('document')) return 'doc-icon';
    if (fileType.includes('image')) return 'image-icon';
    return 'generic-icon';
  }

  getStatusClass(status: string): string {
    if (!status || status === 'NO_REQUEST') return 'status-none';
    if (status === 'APPROVED') return 'status-approved';
    if (status === 'PENDING') return 'status-pending';
    if (status === 'REJECTED') return 'status-rejected';
    return 'status-none';
  }

  getStatusIcon(status: string, hasAccess?: boolean): string {
    if (hasAccess || status === 'APPROVED') return 'check_circle';
    if (status === 'PENDING') return 'schedule';
    if (status === 'REJECTED') return 'cancel';
    return 'lock';
  }

  getStatusText(status: string, hasAccess?: boolean): string {
    if (hasAccess || status === 'APPROVED') return 'Access Approved';
    if (status === 'PENDING') return 'Request Pending';
    if (status === 'REJECTED') return 'Request Rejected';
    return 'No Request';
  }

  formatDate(date: any): string {
    if (!date) return 'Unknown date';
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  }

  openRequestDialog(file: any): void {
    const dialogRef = this.dialog.open(RequestAccessDialogComponent, {
      width: '400px',
      data: { fileName: file.fileName }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.message) {
        this.fileService.requestAccess(file.id, result.message).subscribe({
          next: () => {
            this.snackBar.open('Access request sent successfully', 'Close', { 
              duration: 3000 
            });
            this.loadPrivateFiles();
          },
          error: (error) => {
            this.snackBar.open('Error: ' + error.message, 'Close', { 
              duration: 5000 
            });
          }
        });
      }
    });
  }

  viewFileDetails(file: any): void {
    this.fileService.getPrivateFileDetails(file.id).subscribe({
      next: (fileDetails) => {
        console.log('File details:', fileDetails);
        const ownerName = this.getOwnerName(fileDetails);
        const message = `File: ${fileDetails.fileName}\n` +
                       `Owner: ${ownerName}\n` +
                       `Size: ${this.formatFileSize(fileDetails.fileSize)}\n` +
                       `Type: ${fileDetails.fileType || 'Unknown'}\n` +
                       `Status: ${fileDetails.requestStatus || 'No request'}\n` +
                       `Uploaded: ${this.formatDate(fileDetails.uploadedAt)}`;
        
        this.snackBar.open(message, 'Close', {
          duration: 5000,
          verticalPosition: 'top'
        });
      },
      error: (error) => {
        this.snackBar.open('Error loading file details', 'Close', { duration: 3000 });
      }
    });
  }

  downloadFile(file: any): void {
    this.fileService.downloadFile(file.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.snackBar.open('File downloaded successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open('Error downloading file: ' + error.message, 'Close', {
          duration: 5000
        });
      }
    });
  }

  private formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}