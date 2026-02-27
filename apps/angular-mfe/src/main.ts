import { bootstrapApplication } from '@angular/platform-browser'
import { provideExperimentalZonelessChangeDetection } from '@angular/core'
import { AppComponent } from './app.component'

bootstrapApplication(AppComponent, {
  providers: [
    // ← Zoneless — no Zone.js, DOM updates driven purely by signal changes
    provideExperimentalZonelessChangeDetection(),
  ],
}).catch(console.error)
