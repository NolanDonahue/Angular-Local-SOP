import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { take } from 'rxjs';
import { CmsApiService } from '../../core/services/cms-api.service';
import { SopCategory, SopModule } from '../../core/models/sop.models';
import { glossaryToIdMap, markupToSegments, segmentsToMarkup } from '../../core/utils/content-markup';
import {
  DeleteModuleConfirmDialogComponent,
  DeleteModuleConfirmDialogData,
} from './delete-module-confirm-dialog.component';

export interface ModuleEditDialogData {
  module: SopModule;
}

export type ModuleEditDialogResult =
  | {
      action: 'save';
      title: string;
      category: SopCategory;
      content: SopModule['content'];
    }
  | { action: 'delete' };

@Component({
  selector: 'app-module-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>Edit module</h2>
    <mat-dialog-content class="dialog-body">
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Category</mat-label>
          <mat-select formControlName="category">
            <mat-option value="routine">routine</mat-option>
            <mat-option value="pitfall">pitfall</mat-option>
            <mat-option value="one-off">one-off</mat-option>
          </mat-select>
        </mat-form-field>

        <div class="insert-row">
          <mat-form-field appearance="outline" class="grow">
            <mat-label>Insert glossary term</mat-label>
            <mat-select
              [value]="selectedTermId()"
              (selectionChange)="selectedTermId.set($event.value)"
            >
              @for (t of glossarySorted(); track t.id) {
                <mat-option [value]="t.id">{{ t.term }} ({{ t.id }})</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <button mat-stroked-button type="button" (click)="insertSelectedTerm()">Insert</button>
        </div>

        <div class="insert-row">
          <button
            mat-stroked-button
            type="button"
            (click)="openImagePicker()"
            [disabled]="uploadInProgress()"
          >
            {{ uploadInProgress() ? 'Uploading image...' : 'Upload image' }}
          </button>
          <input
            #imageInput
            type="file"
            accept="image/*"
            class="hidden-file-input"
            (change)="onImageSelected($event)"
          />
          @if (uploadError()) {
            <span class="error-text">{{ uploadError() }}</span>
          }
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Content</mat-label>
          <textarea #contentArea matInput formControlName="content" rows="12"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions class="dialog-footer">
      <button mat-stroked-button color="warn" type="button" (click)="confirmDelete()">Delete</button>
      <span class="dialog-footer-spacer"></span>
      <button mat-button mat-dialog-close type="button">Cancel</button>
      <button mat-flat-button color="primary" type="button" (click)="done()" [disabled]="form.invalid">
        Done
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .dialog-body {
      min-width: min(520px, 92vw);
      padding-top: 0.5rem;
    }

    .form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .full-width {
      width: 100%;
    }

    .insert-row {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .grow {
      flex: 1;
      min-width: 200px;
    }

    .hidden-file-input {
      display: none;
    }

    .dialog-footer {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      width: 100%;
      box-sizing: border-box;
    }

    .dialog-footer-spacer {
      flex: 1;
      min-width: 0.5rem;
    }

    .error-text {
      color: var(--error-text);
      font-size: 0.85rem;
      align-self: center;
    }
  `,
})
export class ModuleEditDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ModuleEditDialogComponent, ModuleEditDialogResult>);
  private readonly dialog = inject(MatDialog);
  private readonly cms = inject(CmsApiService);
  readonly data = inject<ModuleEditDialogData>(MAT_DIALOG_DATA);

  readonly contentArea = viewChild<ElementRef<HTMLTextAreaElement>>('contentArea');
  readonly imageInput = viewChild<ElementRef<HTMLInputElement>>('imageInput');

  readonly selectedTermId = signal('');
  readonly uploadInProgress = signal(false);
  readonly uploadError = signal<string | null>(null);

  readonly glossarySorted = computed(() =>
    [...this.cms.glossary()].sort((a, b) => a.term.localeCompare(b.term)),
  );

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    category: this.fb.nonNullable.control<SopCategory>('routine', Validators.required),
    content: [''],
  });

  constructor() {
    const m = this.data.module;
    this.form.patchValue({
      title: m.title,
      category: m.category,
      content: segmentsToMarkup(m.content),
    });
  }

  insertSelectedTerm(): void {
    const termId = this.selectedTermId()?.trim();
    if (!termId) {
      return;
    }
    this.insertAtCursor(`[[${termId}]]`);
  }

  openImagePicker(): void {
    this.uploadError.set(null);
    this.imageInput()?.nativeElement.click();
  }

  async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.uploadInProgress.set(true);
    this.uploadError.set(null);
    try {
      const uploaded = await this.cms.uploadImage(file);
      const fileName = uploaded.fileName ?? uploaded.src.split('/').pop();
      if (!fileName) {
        throw new Error('Image upload failed: server did not return a valid filename.');
      }
      this.insertAtCursor(`[[img:${fileName}|${uploaded.alt}]]`);
    } catch (e) {
      this.uploadError.set(e instanceof Error ? e.message : 'Image upload failed.');
    } finally {
      this.uploadInProgress.set(false);
      input.value = '';
    }
  }

  private insertAtCursor(tag: string): void {
    const ctrl = this.form.controls.content;
    const v = ctrl.getRawValue() ?? '';
    const ta = this.contentArea()?.nativeElement;
    if (ta && typeof ta.selectionStart === 'number') {
      const start = ta.selectionStart;
      const end = ta.selectionEnd ?? start;
      ctrl.setValue(v.slice(0, start) + tag + v.slice(end));
      const pos = start + tag.length;
      queueMicrotask(() => {
        ta.focus();
        ta.setSelectionRange(pos, pos);
      });
    } else {
      ctrl.setValue(v + tag);
    }
  }

  confirmDelete(): void {
    const title = this.form.controls.title.getRawValue()?.trim() || this.data.module.title;
    const data: DeleteModuleConfirmDialogData = { moduleTitle: title };
    this.dialog
      .open(DeleteModuleConfirmDialogComponent, {
        data,
        width: 'min(420px, 92vw)',
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.dialogRef.close({ action: 'delete' });
        }
      });
  }

  done(): void {
    if (this.form.invalid) {
      return;
    }
    const raw = this.form.getRawValue();
    const map = glossaryToIdMap(this.cms.glossary());
    const content = markupToSegments(raw.content, map);
    this.dialogRef.close({
      action: 'save',
      title: raw.title,
      category: raw.category,
      content,
    });
  }
}
