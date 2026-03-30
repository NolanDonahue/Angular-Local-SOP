import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/toc/toc.component').then((m) => m.TocComponent),
  },
  {
    path: 'glossary',
    loadComponent: () =>
      import('./features/glossary/glossary.component').then((m) => m.GlossaryComponent),
  },
  {
    path: 'editor',
    loadComponent: () => import('./features/editor/editor.component').then((m) => m.EditorComponent),
  },
  {
    path: 'sop/:id',
    loadComponent: () =>
      import('./features/viewer/viewer.component').then((m) => m.ViewerComponent),
  },
  { path: '**', redirectTo: '' },
];
