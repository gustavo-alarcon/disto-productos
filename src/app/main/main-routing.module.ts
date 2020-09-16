import { NgModule } from '@angular/core';
import { MainComponent } from './main.component';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '../core/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('./categories/categories.module').then(mod => mod.CategoriesModule)
      },
      {
        path: 'products',
        loadChildren: () => import('./products/products.module').then(mod => mod.ProductsModule),
        canActivate: [AuthGuard]
      },
      {
        path: 'products-history',
        loadChildren: () => import('./products-history/products-history.module').then(mod => mod.ProductsHistoryModule),
        canActivate: [AuthGuard]
      },
      {
        path: 'products-list',
        loadChildren: () => import('./products-list/parent-list.module').then(mod => mod.ParentListModule),
        canActivate: [AuthGuard]
      },
      {
        path: 'online-sales',
        loadChildren: () => import('./sales/sales.module').then(mod => mod.SalesModule),
        canActivate: [AuthGuard]
      },
      {
        path: 'store-sales',
        loadChildren: () => import('./store-sales/store-sales.module').then(mod => mod.StoreSalesModule),
        canActivate: [AuthGuard]
      },
      {
        path: 'pos',
        loadChildren: () => import('./pos/pos.module').then(mod => mod.PosModule),
        canActivate: [AuthGuard]
        
      },
      {
        path: 'logistics',
        loadChildren: () => import('./logistics/logistics.module').then(mod => mod.LogisticsModule),
        canActivate: [AuthGuard]
      },
      {
        path: 'configuration',
        loadChildren: () => import('./configuration/configuration.module').then(mod => mod.ConfigurationModule),
        canActivate: [AuthGuard]
      },
      {
        path: 'customers',
        loadChildren: () => import('./customers/customers.module').then(mod => mod.CustomersModule),
        canActivate: [AuthGuard]
      },
    ]
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainRoutingModule { }
