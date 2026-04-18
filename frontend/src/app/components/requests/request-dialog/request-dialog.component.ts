import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { FileService } from '../../../services/file.service';
import { AccessRequest } from '../../../models/file.model';

@Component({
  selector: 'app-request-dialog', 
  standalone: true,
  imports: [
    CommonModule,
    MatSnackBarModule,
    MatTabsModule,
    MatExpansionModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="request-list-container">
      <mat-tab-group>
        <!-- Received Requests Tab -->
        <mat-tab label="Received Requests">
          <div class="tab-content">
            <h4>Requests for your files</h4>
            
            @if (loading) {
              <div class="loading">
                <mat-spinner diameter="40"></mat-spinner>
                <p>Loading requests...</p>
              </div>
            }

            @if (!loading && receivedRequests.length === 0) {
              <div class="empty-state">
                <mat-icon>check_circle</mat-icon>
                <p>No pending requests</p>
              </div>
            }

            @if (!loading && receivedRequests.length > 0) {
              <mat-accordion>
                <mat-expansion-panel *ngFor="let request of receivedRequests">
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon [ngClass]="{
                        'pending-icon': request.status === 'PENDING',
                        'approved-icon': request.status === 'APPROVED',
                        'rejected-icon': request.status === 'REJECTED'
                      }">
                        {{request.status === 'PENDING' ? 'hourglass_empty' : 
                          request.status === 'APPROVED' ? 'check_circle' : 'cancel'}}
                      </mat-icon>
                      {{request.file.fileName}}
                    </mat-panel-title>
                    <mat-panel-description>
                      Requested by {{request.requester.firstName}} {{request.requester.lastName}}
                      <span class="request-date">{{request.requestedAt | dateAgo}}</span>
                    </mat-panel-description>
                  </mat-expansion-panel-header>

                  <div class="request-details">
                    <p><strong>File:</strong> {{request.file.fileName}}</p>
                    <p><strong>Requester:</strong> {{request.requester.email}}</p>
                    <p><strong>Message:</strong> {{request.message || 'No message provided'}}</p>
                    <p><strong>Status:</strong> 
                      <span [ngClass]="{
                        'status-pending': request.status === 'PENDING',
                        'status-approved': request.status === 'APPROVED',
                        'status-rejected': request.status === 'REJECTED'
                      }">
                        {{request.status}}
                      </span>
                    </p>
                  </div>

                  @if (request.status === 'PENDING') {
                    <mat-action-row>
                      <button mat-button color="warn" (click)="updateRequestStatus(request.id, 'REJECTED')">
                        <mat-icon>cancel</mat-icon>
                        Reject
                      </button>
                      <button mat-button color="primary" (click)="updateRequestStatus(request.id, 'APPROVED')">
                        <mat-icon>check_circle</mat-icon>
                        Approve
                      </button>
                    </mat-action-row>
                  }
                </mat-expansion-panel>
              </mat-accordion>
            }
          </div>
        </mat-tab>

        <!-- My Requests Tab -->
        <mat-tab label="My Requests">
          <div class="tab-content">
            <h4>Requests you sent</h4>
            
            @if (loading) {
              <div class="loading">
                <mat-spinner diameter="40"></mat-spinner>
                <p>Loading requests...</p>
              </div>
            }

            @if (!loading && myRequests.length === 0) {
              <div class="empty-state">
                <mat-icon>send</mat-icon>
                <p>No requests sent yet</p>
              </div>
            }

            @if (!loading && myRequests.length > 0) {
              <mat-list>
                <mat-list-item *ngFor="let request of myRequests" class="request-item">
                  <mat-icon mat-list-icon [ngClass]="{
                    'pending-icon': request.status === 'PENDING',
                    'approved-icon': request.status === 'APPROVED',
                    'rejected-icon': request.status === 'REJECTED'
                  }">
                    {{request.status === 'PENDING' ? 'hourglass_empty' : 
                      request.status === 'APPROVED' ? 'check_circle' : 'cancel'}}
                  </mat-icon>
                  
                  <div mat-line>
                    <strong>{{request.file.fileName}}</strong>
                    <span class="request-status" [ngClass]="{
                      'status-pending': request.status === 'PENDING',
                      'status-approved': request.status === 'APPROVED',
                      'status-rejected': request.status === 'REJECTED'
                    }">
                      {{request.status}}
                    </span>
                  </div>
                  
                  <div mat-line>
                    Owner: {{request.owner.firstName}} {{request.owner.lastName}}
                    <span class="request-date">{{request.requestedAt | dateAgo}}</span>
                  </div>
                  
                  @if (request.message) {
                    <div mat-line class="request-message">
                      {{request.message}}
                    </div>
                  }

                  @if (request.status === 'PENDING') {
                    <button mat-icon-button color="warn" (click)="deleteRequest(request.id)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  }
                </mat-list-item>
              </mat-list>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .request-list-container {
      padding: 20px;
    }

    .tab-content {
      padding: 20px 0;
    }

    h4 {
      margin-bottom: 20px;
      color: #333;
      font-weight: 500;
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

    mat-expansion-panel {
      margin-bottom: 10px;
    }

    .pending-icon {
      color: #ff9800;
    }

    .approved-icon {
      color: #4caf50;
    }

    .rejected-icon {
      color: #f44336;
    }

    .request-date {
      margin-left: 10px;
      font-size: 12px;
      color: #999;
    }

    .request-details {
      padding: 10px 0;
    }

    .request-details p {
      margin: 8px 0;
    }

    .status-pending {
      color: #ff9800;
      font-weight: bold;
    }

    .status-approved {
      color: #4caf50;
      font-weight: bold;
    }

    .status-rejected {
      color: #f44336;
      font-weight: bold;
    }

    .request-item {
      border-bottom: 1px solid #eee;
      padding: 16px 0;
    }

    .request-item:last-child {
      border-bottom: none;
    }

    .request-status {
      margin-left: 10px;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      background: #f5f5f5;
    }

    .request-message {
      color: #666;
      font-size: 14px;
      margin-top: 4px;
    }

    mat-action-row {
      padding: 8px 16px;
    }

    mat-action-row button {
      margin-left: 8px;
    }
  `]
})
export class RequestDialogComponent implements OnInit {
  @Input() receivedRequests: AccessRequest[] = [];
  @Input() myRequests: AccessRequest[] = [];
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