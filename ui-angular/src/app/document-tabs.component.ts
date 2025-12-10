import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';
import { DocumentWizardComponent } from './document-wizard.component';

@Component({
  selector: 'app-document-tabs',
  standalone: true,
  imports: [CommonModule, DocumentWizardComponent],
  template: `
    <nav class="tab-nav">
      <button [class.active]="selectedTab === 0" (click)="selectedTab = 0">Document Processing</button>
      <button [class.active]="selectedTab === 1" (click)="selectedTab = 1">Chat Conversation</button>
    </nav>
    <section *ngIf="selectedTab === 0">
      <app-document-wizard></app-document-wizard>
    </section>
    <section *ngIf="selectedTab === 1">
      <ng-content select="[chat]"></ng-content>
    </section>
  `,
  styles: [`
    .tab-nav { display: flex; border-bottom: 1px solid #ccc; margin-bottom: 1rem; }
    .tab-nav button { background: none; border: none; padding: 1rem 2rem; cursor: pointer; font-size: 1rem; }
    .tab-nav button.active { border-bottom: 2px solid #1976d2; color: #1976d2; font-weight: bold; }
    section { padding: 1rem; }
  `]
})
export class DocumentTabsComponent {
  selectedTab = 0;
}
