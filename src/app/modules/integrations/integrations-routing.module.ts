import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DominioExportComponent } from './dominio-export/dominio-export.component';

const routes: Routes = [
  {
    path: '',
    component: DominioExportComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IntegrationsRoutingModule { }
