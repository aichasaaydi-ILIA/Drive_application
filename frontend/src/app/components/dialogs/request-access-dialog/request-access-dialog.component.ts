// src/app/components/dialogs/request-access-dialog/request-access-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-request-access-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  template: `
    <h2 mat-dialog-title>Request Access</h2>
    
    <mat-dialog-content>
      <p>Request access to: <strong>{{data.fileName}}</strong></p>
      
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Message (optional)</mat-label>
        <textarea 
          matInput 
          [(ngModel)]="message" 
          placeholder="Explain why you need access..."
          rows="4">
        </textarea>
      </mat-form-field>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSubmit()">Send Request</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-top: 16px;
    }
  `]
})
export class RequestAccessDialogComponent {
  message: string = '';

  constructor(
    public dialogRef: MatDialogRef<RequestAccessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { fileName: string }
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    this.dialogRef.close({ message: this.message });
  }
}