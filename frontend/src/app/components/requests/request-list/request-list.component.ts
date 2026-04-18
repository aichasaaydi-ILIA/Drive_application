// src/app/components/requests/request-list/request-list.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Pipes
import { DateAgoPipe } from '../../../pipes/date-ago.pipe';

// Services
import { FileService } from '../../../services/file.service';

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [
    CommonModule,
    MatSnackBarModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    DateAgoPipe
  ],
  template: `
    <div class="request-list-container">
      <h4>Access Requests</h4>
      
      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading requests...</p>
      </div>

      <div *ngIf="!loading && receivedRequests.length === 0 && myRequests.length === 0" class="empty-state">
        <mat-icon>check_circle</mat-icon>
        <p>No access requests found</p>
      </div>

      <div *ngIf="!loading && (receivedRequests.length > 0 || myRequests.length > 0)">
        <!-- Received Requests -->
        <div *ngIf="receivedRequests.length > 0" class="requests-section">
          <h5>Requests for your files</h5>
          <mat-card *ngFor="let request of receivedRequests" class="request-card">
            <mat-card-content>
              <div class="request-info">
                <div class="file-info">
                  <mat-icon class="file-icon">insert_drive_file</mat-icon>
                  <div>
                    <strong>{{request.file.fileName}}</strong>
                    <p>Requested by {{request.requester.firstName}} {{request.requester.lastName}}</p>
                  </div>
                </div>
                
                <div class="request-status">
                  <span [ngClass]="{
                    'status-pending': request.status === 'PENDING',
                    'status-approved': request.status === 'APPROVED',
                    'status-rejected': request.status === 'REJECTED'
                  }">
                    {{request.status}}
                  </span>
                </div>
              </div>
              
              <div *ngIf="request.message" class="request-message">
                <p><strong>Message:</strong> {{request.message}}</p>
              </div>
              
              <div class="request-date">
                Requested {{request.requestedAt | dateAgo}}
              </div>
              
              <div *ngIf="request.status === 'PENDING'" class="request-actions">
                <button mat-button color="warn" (click)="updateRequestStatus(request.id, 'REJECTED')">
                  Reject
                </button>
                <button mat-button color="primary" (click)="updateRequestStatus(request.id, 'APPROVED')">
                  Approve
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- My Requests -->
        <div *ngIf="myRequests.length > 0" class="requests-section">
          <h5>Requests you sent</h5>
          <mat-card *ngFor="let request of myRequests" class="request-card">
            <mat-card-content>
              <div class="request-info">
                <div class="file-info">
                  <mat-icon class="file-icon">insert_drive_file</mat-icon>
                  <div>
                    <strong>{{request.file.fileName}}</strong>
                    <p>Owner: {{request.owner.firstName}} {{request.owner.lastName}}</p>
                  </div>
                </div>
                
                <div class="request-status">
                  <span [ngClass]="{
                    'status-pending': request.status === 'PENDING',
                    'status-approved': request.status === 'APPROVED',
                    'status-rejected': request.status === 'REJECTED'
                  }">
                    {{request.status}}
                  </span>
                </div>
              </div>
              
              <div *ngIf="request.message" class="request-message">
                <p><strong>Message:</strong> {{request.message}}</p>
              </div>
              
              <div class="request-date">
                Requested {{request.requestedAt | dateAgo}}
              </div>
              
              <div *ngIf="request.status === 'PENDING'" class="request-actions">
                <button mat-button color="warn" (click)="deleteRequest(request.id)">
                  Cancel Request
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .request-list-container {
      padding: 20px;
    }

    h4 {
      margin-bottom: 20px;
      color: #333;
      font-weight: 500;
    }

    h5 {
      margin: 20px 0 10px 0;
      color: #666;
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
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
      color: #ccc;
    }

    .requests-section {
      margin-bottom: 30px;
    }

    .request-card {
      margin-bottom: 15px;
    }

    .request-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .file-icon {
      font-size: 24px;
      color: #666;
    }

    .request-status {
      font-weight: bold;
    }

    .status-pending {
      color: #ff9800;
    }

    .status-approved {
      color: #4caf50;
    }

    .status-rejected {
      color: #f44336;
    }

    .request-message {
      margin: 10px 0;
      padding: 10px;
      background: #f5f5f5;
      border-radius: 4px;
      font-size: 14px;
    }

    .request-date {
      font-size: 12px;
      color: #999;
      margin-bottom: 10px;
    }

    .request-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  `]
})
export class RequestListComponent implements OnInit {
  @Input() receivedRequests: any[] = [];
  @Input() myRequests: any[] = [];
  @Output() refresh = new EventEmitter<void>();
  @Output() updateStatus = new EventEmitter<{requestId: number; status: string}>();

  loading = false;

  constructor(
    private fileService: FileService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    this.refresh.emit();
    setTimeout(() => {
      this.loading = false;
    }, 500);
  }

  updateRequestStatus(requestId: number, status: string): void {
    this.updateStatus.emit({ requestId, status });
  }

  deleteRequest(requestId: number): void {
    if (confirm('Are you sure you want to delete this request?')) {
      this.fileService.deleteRequest(requestId).subscribe({
        next: () => {
          this.refresh.emit();
          this.snackBar.open('Request deleted successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Delete error:', error);
          this.snackBar.open('Error deleting request', 'Close', { duration: 3000 });
        }
      });
    }
  }
}