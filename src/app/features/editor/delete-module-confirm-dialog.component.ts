import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface DeleteModuleConfirmDialogData {
  moduleTitle: string;
}

@Component({
  selector: 'app-delete-module-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Delete module?</h2>
    <mat-dialog-content>
      <p>
        Delete &ldquo;{{ data.moduleTitle }}&rdquo; and all nested modules? This cannot be undone until you save or
        reload.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Cancel</button>
      <button mat-flat-button color="warn" type="button" [mat-dialog-close]="true">Delete</button>
    </mat-dialog-actions>
  `,
})
export class DeleteModuleConfirmDialogComponent {
  readonly data = inject<DeleteModuleConfirmDialogData>(MAT_DIALOG_DATA);
}
