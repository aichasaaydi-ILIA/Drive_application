// src/app/components/files/file-list/file-list.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Pipes
import { FileSizePipe } from '../../../pipes/file-size.pipe';
import { DateAgoPipe } from '../../../pipes/date-ago.pipe';

// Services
import { FileService } from '../../../services/file.service';
import { AuthService } from '../../../services/auth.service';
import { File } from '../../../models/file.model';

@Component({
  selector: 'app-file-list',
  standalone: true,
  imports: [
    CommonModule,
    MatSnackBarModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    FileSizePipe,
    DateAgoPipe
  ],
  template: `
    <div class="file-list-container">
      <div class="list-header">
        <h3>{{isOwner ? 'My Files' : 'Public Files'}}</h3>
        <div class="stats" *ngIf="files.length > 0">
          <span class="stat-item">
            <mat-icon>folder</mat-icon>
            {{files.length}} files
          </span>
          <span class="stat-item">
            <mat-icon>storage</mat-icon>
            {{totalSize | fileSize}}
          </span>
        </div>
      </div>

      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading files...</p>
      </div>

      <div *ngIf="!loading && files.length === 0" class="empty-state">
        <mat-icon>folder_open</mat-icon>
        <h4>No files found</h4>
        <p *ngIf="isOwner">Upload your first file to get started</p>
        <p *ngIf="!isOwner">No public files available at the moment</p>
      </div>

      <div class="files-grid" *ngIf="!loading && files.length > 0">
        <mat-card *ngFor="let file of files" class="file-card">
          <mat-card-header>
            <mat-card-title class="file-title">
              <mat-icon class="file-icon" [ngClass]="getFileIconClass(file.fileType)">
                {{getFileIcon(file.fileType)}}
              </mat-icon>
              <span class="file-name">{{file.fileName}}</span>
            </mat-card-title>
            <mat-card-subtitle>
              Uploaded {{file.uploadedAt | dateAgo}}
              <span *ngIf="file.owner">by {{file.owner.firstName}} {{file.owner.lastName}}</span>
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <p *ngIf="file.description" class="file-description">{{file.description}}</p>
            
            <div class="file-meta">
              <span class="meta-item">
                <mat-icon>description</mat-icon>
                {{file.fileType}}
              </span>
              <span class="meta-item">
                <mat-icon>storage</mat-icon>
                {{file.fileSize | fileSize}}
              </span>
              <span class="meta-item" *ngIf="file.isPublic">
                <mat-icon>public</mat-icon>
                Public
              </span>
              <span class="meta-item" *ngIf="!file.isPublic">
                <mat-icon>lock</mat-icon>
                Private
              </span>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button mat-button color="primary" (click)="downloadFile(file)">
              <mat-icon>download</mat-icon>
              Download
            </button>
            
            <ng-container *ngIf="isOwner; else requestAccess">
              <button mat-button color="warn" (click)="deleteFile(file)">
                <mat-icon>delete</mat-icon>
                Delete
              </button>
              
              <button mat-button color="accent" (click)="viewRequests(file)">
                <mat-icon>visibility</mat-icon>
                View Access
              </button>
            </ng-container>
            
            <ng-template #requestAccess>
              <button mat-button color="primary" (click)="onRequestAccess(file)">
                <mat-icon>lock_open</mat-icon>
                Request Access
              </button>
            </ng-template>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .file-list-container {
      padding: 20px;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 1px solid #eee;
    }

    .list-header h3 {
      margin: 0;
      color: #333;
      font-weight: 500;
    }

    .stats {
      display: flex;
      gap: 20px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-size: 14px;
    }

    .stat-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 0;
      color: #666;
    }

    .loading p {
      margin-top: 16px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 0;
      color: #666;
    }

    .empty-state mat-icon {
      font-size: 60px;
      height: 60px;
      width: 60px;
      margin-bottom: 16px;
      color: #ccc;
    }

    .empty-state h4 {
      margin: 0 0 8px 0;
      color: #333;
    }

    .files-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .file-card {
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .file-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .file-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .file-icon {
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
    }

    .file-description {
      margin: 16px 0;
      color: #555;
      font-size: 14px;
      line-height: 1.5;
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

    mat-card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 8px 16px 16px !important;
    }

    mat-card-actions button {
      font-size: 12px;
    }
  `]
})
export class FileListComponent implements OnInit {
  @Input() files: File[] = [];
  @Input() isOwner = false;
  @Output() refresh = new EventEmitter<void>();
  @Output() requestAccess = new EventEmitter<File>();

  loading = false;
  totalSize = 0;

  constructor(
    private fileService: FileService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.calculateTotalSize();
  }

  calculateTotalSize(): void {
    this.totalSize = this.files.reduce((sum, file) => sum + file.fileSize, 0);
  }

  getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return 'picture_as_pdf';
    if (fileType.includes('word') || fileType.includes('document')) return 'description';
    if (fileType.includes('image')) return 'image';
    if (fileType.includes('text')) return 'text_snippet';
    return 'insert_drive_file';
  }

  getFileIconClass(fileType: string): string {
    if (fileType.includes('pdf')) return 'pdf-icon';
    if (fileType.includes('word') || fileType.includes('document')) return 'doc-icon';
    if (fileType.includes('image')) return 'image-icon';
    return 'generic-icon';
  }

  downloadFile(file: File): void {
    this.loading = true;
    this.fileService.downloadFile(file.id).subscribe({
      next: (blob) => {
        this.loading = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (error) => {
        this.loading = false;
        console.error('Download error:', error);
        this.snackBar.open('Error downloading file: Access denied or file not found', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  deleteFile(file: File): void {
    if (confirm(`Are you sure you want to delete "${file.fileName}"?`)) {
      this.loading = true;
      this.fileService.deleteFile(file.id).subscribe({
        next: () => {
          this.loading = false;
          this.refresh.emit();
          this.snackBar.open('File deleted successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          this.loading = false;
          console.error('Delete error:', error);
          this.snackBar.open('Error deleting file', 'Close', { duration: 3000 });
        }
      });
    }
  }

  viewRequests(file: File): void {
    this.snackBar.open('Viewing access requests for: ' + file.fileName, 'Close', { duration: 3000 });
  }

  onRequestAccess(file: File): void {
    this.requestAccess.emit(file);
  }
}