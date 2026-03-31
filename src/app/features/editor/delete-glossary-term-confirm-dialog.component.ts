import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface DeleteGlossaryTermConfirmDialogData {
  termLabel: string;
  termId: string;
}

@Component({
  selector: 'app-delete-glossary-term-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Remove glossary term?</h2>
    <mat-dialog-content>
      <p>
        Remove &ldquo;{{ data.termLabel }}&rdquo; (ID <code>{{ data.termId }}</code>)? SOP content that still
        references this term will keep broken glossary links until you edit that content.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Cancel</button>
      <button mat-flat-button color="warn" type="button" [mat-dialog-close]="true">Remove</button>
    </mat-dialog-actions>
  `,
  styles: `
    code {
      font-size: 0.9em;
    }
  `,
})
export class DeleteGlossaryTermConfirmDialogComponent {
  readonly data = inject<DeleteGlossaryTermConfirmDialogData>(MAT_DIALOG_DATA);
}
