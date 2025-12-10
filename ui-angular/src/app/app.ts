import { Component, signal } from '@angular/core';
import { ChatComponent } from './chat.component';
import { DocumentTabsComponent } from './document-tabs.component';
import { CommonModule } from '@angular/common';
import { StatusComponent } from './status.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, DocumentTabsComponent, ChatComponent, StatusComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('ui-angular');
  showApp = false;
}
