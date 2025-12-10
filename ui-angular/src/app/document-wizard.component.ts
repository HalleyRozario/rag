import { Component, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-document-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="wizard-container">
      <h2>Document Processing Wizard</h2>
      <form (submit)="uploadPdf($event)" class="upload-form">
        <input type="file" accept="application/pdf" (change)="onFileSelected($event)" />
        <button type="submit" [disabled]="!selectedFile || uploading">Upload PDF</button>
        <span *ngIf="uploading">Uploading...</span>
      </form>
      <div *ngIf="step > 1">
        <button (click)="processContent()" [disabled]="processing">Process Content (Chunk, Embed, Store)</button>
        <span *ngIf="processing">Processing...</span>
      </div>
      <div *ngIf="statusMessage" class="status">{{ statusMessage }}</div>
    </div>
  `,
  styles: [`
    .wizard-container { max-width: 600px; margin: 40px auto; border: 1px solid #ccc; border-radius: 8px; padding: 16px; background: #fafafa; }
    .upload-form { display: flex; gap: 8px; margin-bottom: 16px; }
    input[type='file'] { flex: 1; }
    button { padding: 8px 16px; border-radius: 4px; border: none; background: #1976d2; color: #fff; cursor: pointer; }
    button:hover { background: #1565c0; }
    .status { margin-top: 16px; color: #388e3c; }
  `]
})
export class DocumentWizardComponent {
  selectedFile: File | null = null;
  uploading = false;
  processing = false;
  step = 1;
  statusMessage = '';

  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    } else {
      this.selectedFile = null;
    }
  }

  uploadPdf(event: Event) {
    event.preventDefault();
    if (!this.selectedFile) return;
    this.uploading = true;
    this.statusMessage = '';
    const formData = new FormData();
    formData.append('pdf', this.selectedFile, this.selectedFile.name);
    this.http.post<any>('http://localhost:3000/upload-pdf', formData).subscribe({
      next: (res) => {
        this.uploading = false;
        this.step = 2;
        this.statusMessage = 'PDF uploaded: ' + (res.filename || this.selectedFile?.name);
        this.cd.detectChanges();
      },
      error: (err) => {
        this.uploading = false;
        this.statusMessage = 'Error uploading PDF: ' + (err.error?.message || 'Failed');
        this.cd.detectChanges();
      }
    });
  }

  processContent() {
    if (!this.selectedFile) return;
    this.processing = true;
    this.statusMessage = '';
    this.http.post<any>(`http://localhost:3000/process-content?pdf=${encodeURIComponent(this.selectedFile.name)}`, {}).subscribe({
      next: (res) => {
        this.processing = false;
        this.statusMessage = 'Processing complete: ' + (res.message || 'Success');
        this.cd.detectChanges();
      },
      error: (err) => {
        this.processing = false;
        this.statusMessage = 'Error processing: ' + (err.error?.message || 'Failed');
        this.cd.detectChanges();
      }
    });
  }
}
