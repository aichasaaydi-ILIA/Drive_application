import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { DateAgoPipe } from '../../../pipes/date-ago.pipe';
import { FileSizePipe } from '../../../pipes/file-size.pipe';

@Component({
  selector: 'app-file-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    DateAgoPipe,
    FileSizePipe
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="title-icon">info</mat-icon>
      File Details
    </h2>
    
    <mat-dialog-content>
      <mat-list>
        <mat-list-item>
          <mat-icon mat-list-icon>description</mat-icon>
          <div mat-line>File Name</div>
          <div mat-line class="detail-value">{{data.fileName}}</div>
        </mat-list-item>

        <mat-divider></mat-divider>

        <mat-list-item>
          <mat-icon mat-list-icon>person</mat-icon>
          <div mat-line>Owner</div>
          <div mat-line class="detail-value">{{data.ownerName}} ({{data.owner}})</div>
        </mat-list-item>

        <mat-divider></mat-divider>

        <mat-list-item>
          <mat-icon mat-list-icon>calendar_today</mat-icon>
          <div mat-line>Upload Date</div>
          <div mat-line class="detail-value">{{data.uploadedAt | date:'full'}}</div>
        </mat-list-item>

        <mat-divider></mat-divider>

        <mat-list-item>
          <mat-icon mat-list-icon>storage</mat-icon>
          <div mat-line>File Size</div>
          <div mat-line class="detail-value">{{data.fileSize | fileSize}}</div>
        </mat-list-item>

        <mat-divider></mat-divider>

        <mat-list-item>
          <mat-icon mat-list-icon>category</mat-icon>
          <div mat-line>File Type</div>
          <div mat-line class="detail-value">{{data.fileType || 'Unknown'}}</div>
        </mat-list-item>

        <mat-divider></mat-divider>

        <mat-list-item *ngIf="data.description">
          <mat-icon mat-list-icon>notes</mat-icon>
          <div mat-line>Description</div>
          <div mat-line class="detail-value description-text">{{data.description}}</div>
        </mat-list-item>

        <mat-divider *ngIf="data.description"></mat-divider>

        <mat-list-item>
          <mat-icon mat-list-icon>visibility</mat-icon>
          <div mat-line>Visibility</div>
          <div mat-line class="detail-value">
            <mat-chip [color]="data.isPublic ? 'primary' : 'warn'" selected>
              {{data.isPublic ? 'Public' : 'Private'}}
            </mat-chip>
          </div>
        </mat-list-item>
      </mat-list>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .title-icon {
      margin-right: 12px;
      vertical-align: middle;
    }

    .detail-value {
      color: #333;
      font-weight: 500;
    }

    .description-text {
      white-space: pre-wrap;
      line-height: 1.5;
    }

    mat-list-item {
      height: auto !important;
      min-height: 64px;
      padding: 12px 0;
    }

    mat-divider {
      margin: 8px 0;
    }
  `]
})
export class FileDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<FileDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
}