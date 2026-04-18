// src/app/components/dashboard/dashboard.component.ts
import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Components
import { FileListComponent } from '../files/file-list/file-list.component';
import { FileUploadComponent } from '../files/file-upload/file-upload.component';
import { RequestListComponent } from '../requests/request-list/request-list.component';
import { RequestAccessDialogComponent } from '../dialogs/request-access-dialog/request-access-dialog.component'; // <-- NOUVEAU

// Services
import { FileService } from '../../services/file.service';
import { AuthService } from '../../services/auth.service';

// Models
import { File, AccessRequest } from '../../models/file.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    FileListComponent,
    FileUploadComponent,
    RequestListComponent,
    RequestAccessDialogComponent // <-- AJOUTEZ CETTE LIGNE
  ],
  template: `
    <div class="dashboard-container">
      <div class="header">
        <h1>My Drive</h1>
        <button mat-raised-button color="primary" (click)="openUploadDialog()">
          <mat-icon>cloud_upload</mat-icon>
          Upload File
        </button>
      </div>

      <mat-tab-group [selectedIndex]="selectedTab" (selectedIndexChange)="onTabChange($event)">
        <mat-tab label="My Files">
          <div class="tab-content">
            <app-file-list 
              [files]="myFiles" 
              [isOwner]="true"
              (refresh)="loadMyFiles()"
              (requestAccess)="onRequestAccess($event)">
            </app-file-list>
          </div>
        </mat-tab>
        
        <mat-tab label="Public Files">
          <div class="tab-content">
            <app-file-list 
              [files]="publicFiles" 
              [isOwner]="false"
              (refresh)="loadPublicFiles()"
              (requestAccess)="onRequestAccess($event)">
            </app-file-list>
          </div>
        </mat-tab>
        
        <mat-tab label="Access Requests">
          <div class="tab-content">
            <app-request-list 
              [receivedRequests]="receivedRequests"
              [myRequests]="myRequests"
              (refresh)="loadRequests()"
              (updateStatus)="onUpdateStatus($event)">
            </app-request-list>
          </div>
        </mat-tab>
      </mat-tab-group>

      <!-- Upload Dialog -->
      <ng-template #uploadDialog>
        <app-file-upload (uploadComplete)="onUploadComplete()"></app-file-upload>
      </ng-template>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .header h1 {
      margin: 0;
      color: #333;
      font-weight: 500;
    }

    .tab-content {
      padding: 20px 0;
    }
  `]
})
export class DashboardComponent implements OnInit {
  @ViewChild('uploadDialog') uploadDialog!: TemplateRef<any>;

  selectedTab = 0;
  myFiles: File[] = [];
  publicFiles: File[] = [];
  receivedRequests: AccessRequest[] = [];
  myRequests: AccessRequest[] = [];
  selectedFile: File | null = null;

  constructor(
    private fileService: FileService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Vérifier les paramètres de l'URL pour le tab sélectionné
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'public-files') {
        this.selectedTab = 1;
      } else if (params['tab'] === 'requests') {
        this.selectedTab = 2;
      } else {
        this.selectedTab = 0;
      }
    });

    this.loadData();
  }

  loadData(): void {
    this.loadMyFiles();
    this.loadPublicFiles();
    this.loadRequests();
  }

  loadMyFiles(): void {
    this.fileService.getMyFiles().subscribe({
      next: (files) => {
        this.myFiles = files;
      },
      error: (error) => {
        console.error('Error loading my files:', error);
        this.snackBar.open('Error loading files', 'Close', { duration: 3000 });
      }
    });
  }

  loadPublicFiles(): void {
    this.fileService.getPublicFiles().subscribe({
      next: (files) => {
        this.publicFiles = files;
      },
      error: (error) => {
        console.error('Error loading public files:', error);
        this.snackBar.open('Error loading public files', 'Close', { duration: 3000 });
      }
    });
  }

  loadRequests(): void {
    this.fileService.getReceivedRequests().subscribe({
      next: (requests: AccessRequest[]) => {
        this.receivedRequests = requests;
      },
      error: (error: any) => {
        console.error('Error getting received requests:', error);
      }
    });

    this.fileService.getSentRequests().subscribe({
      next: (requests: AccessRequest[]) => {
        this.myRequests = requests;
      },
      error: (error: any) => {
        console.error('Error getting sent requests:', error);
      }
    });
  }

  openUploadDialog(): void {
    const dialogRef = this.dialog.open(this.uploadDialog, {
      width: '500px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMyFiles();
      }
    });
  }

  onRequestAccess(file: File): void {
    // Ouvrir un dialogue pour demander un message
    const dialogRef = this.dialog.open(RequestAccessDialogComponent, {
      width: '400px',
      data: { fileName: file.fileName }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.message) {
        // Utiliser la méthode du service
        this.fileService.requestAccess(file.id, result.message).subscribe({
          next: (response) => {
            console.log('Request sent:', response);
            this.snackBar.open('Access request sent successfully', 'Close', { 
              duration: 3000 
            });
            // Recharger les demandes si nécessaire
            this.loadRequests();
          },
          error: (error) => {
            console.error('Error:', error);
            this.snackBar.open('Error: ' + error.message, 'Close', { 
              duration: 5000 
            });
          }
        });
      }
    });
  }

  onUploadComplete(): void {
    this.loadMyFiles();
    this.dialog.closeAll();
    this.snackBar.open('File uploaded successfully', 'Close', { duration: 3000 });
  }

  onUpdateStatus(event: { requestId: number; status: string }): void {
    this.fileService.updateRequestStatus(event.requestId, event.status).subscribe({
      next: () => {
        this.loadRequests();
        this.snackBar.open(`Request ${event.status.toLowerCase()} successfully`, 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error updating request:', error);
        this.snackBar.open('Error updating request', 'Close', { duration: 3000 });
      }
    });
  }

  onTabChange(index: number): void {
    this.selectedTab = index;
    // Update URL without reloading
    const tabMap = ['my-files', 'public-files', 'requests'];
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabMap[index] },
      queryParamsHandling: 'merge'
    });
  }
}