import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/toc/toc.component').then((m) => m.TocComponent),
  },
  {
    path: 'sop/:id',
    loadComponent: () =>
      import('./features/viewer/viewer.component').then((m) => m.ViewerComponent),
  },
  { path: '**', redirectTo: '' },
];
