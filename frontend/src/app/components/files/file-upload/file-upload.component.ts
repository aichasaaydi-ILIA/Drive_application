// src/app/components/files/file-upload/file-upload.component.ts
import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';

// Pipes
import { FileSizePipe } from '../../../pipes/file-size.pipe';

// Services
import { FileService } from '../../../services/file.service';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    FileSizePipe
  ],
  template: `
    <div class="upload-container">
      <h2>Upload File</h2>
      
      <form [formGroup]="uploadForm" (ngSubmit)="onSubmit()">
        <div class="upload-area" 
             (dragover)="onDragOver($event)"
             (dragleave)="onDragLeave($event)"
             (drop)="onDrop($event)"
             [class.drag-over]="isDragOver"
             (click)="fileInput.click()">
          
          <input type="file" 
                 #fileInput 
                 (change)="onFileSelected($event)"
                 style="display: none">
          
          <mat-icon *ngIf="!selectedFile">cloud_upload</mat-icon>
          <mat-icon *ngIf="selectedFile">insert_drive_file</mat-icon>
          
          <div *ngIf="!selectedFile" class="upload-text">
            <p>Drag & drop files here</p>
            <p class="small-text">or click to browse</p>
          </div>
          
          <div *ngIf="selectedFile" class="file-info">
            <p><strong>{{selectedFile.name}}</strong></p>
            <p class="small-text">{{selectedFile.size | fileSize}}</p>
          </div>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description (optional)</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <mat-checkbox formControlName="isPublic">
          Make file public
        </mat-checkbox>
        
        <div class="form-actions">
          <button mat-button type="button" (click)="onCancel()">Cancel</button>
          <button mat-raised-button 
                  color="primary" 
                  type="submit"
                  [disabled]="!uploadForm.valid || !selectedFile || uploading">
            <mat-icon *ngIf="!uploading">cloud_upload</mat-icon>
            <mat-spinner *ngIf="uploading" diameter="20"></mat-spinner>
            {{ uploading ? 'Uploading...' : 'Upload' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .upload-container {
      padding: 20px;
    }

    h2 {
      margin-bottom: 20px;
      color: #333;
    }

    .upload-area {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 40px;
      text-align: center;
      margin-bottom: 20px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .upload-area:hover {
      border-color: #3f51b5;
      background-color: rgba(63, 81, 181, 0.05);
    }

    .upload-area.drag-over {
      border-color: #3f51b5;
      background-color: rgba(63, 81, 181, 0.1);
    }

    .upload-area mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
      color: #3f51b5;
    }

    .upload-text {
      color: #666;
    }

    .small-text {
      font-size: 12px;
      color: #999;
      margin: 4px 0;
    }

    .file-info {
      color: #333;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }

    mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }
  `]
})
export class FileUploadComponent {
  @Output() uploadComplete = new EventEmitter<void>();

  uploadForm: FormGroup;
  selectedFile: File | null = null;
  isDragOver = false;
  uploading = false;

  constructor(
    private formBuilder: FormBuilder,
    private fileService: FileService,
    private snackBar: MatSnackBar
  ) {
    this.uploadForm = this.formBuilder.group({
      description: [''],
      isPublic: [false]
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  onSubmit(): void {
    if (this.selectedFile && this.uploadForm.valid) {
      this.uploading = true;
      
      this.fileService.uploadFile(
        this.selectedFile,
        this.uploadForm.value.description,
        this.uploadForm.value.isPublic
      ).subscribe({
        next: () => {
          this.uploading = false;
          this.uploadComplete.emit();
          this.resetForm();
        },
        error: (error) => {
          this.uploading = false;
          console.error('Upload error:', error);
          this.snackBar.open('Error uploading file: ' + (error.error || 'Unknown error'), 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  onCancel(): void {
    this.resetForm();
    this.uploadComplete.emit();
  }

  private resetForm(): void {
    this.selectedFile = null;
    this.uploadForm.reset({
      description: '',
      isPublic: false
    });
  }
}