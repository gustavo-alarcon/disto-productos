import { RecipesComponent } from './recipes/recipes.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { ProductsComponent } from './products.component';
import { ShoppingCartViewComponent } from './shopping-cart-view/shopping-cart-view.component';
import { PurchaseComponent } from './purchase/purchase.component';

const routes: Routes = [
  {
    path: '',
    component: ProductsComponent,
  },
  {
    path: 'recetas/:id',
    component: RecipesComponent,
  },
  {
    path: 'carrito',
    component: ShoppingCartViewComponent
  },
  {
    path: 'compra',
    component: PurchaseComponent
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductsRoutingModule { }
