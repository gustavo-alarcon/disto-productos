import { ProductDivModule } from './../product-div/product-div.module';
import { ShoppingCartModule } from './../shopping-cart/shopping-cart.module';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgmCoreModule } from '@agm/core';
import { ProductsRoutingModule } from './products-routing.module';
import { ProductsComponent } from './products.component';
import { CreateEditRecipeComponent } from './create-edit-recipe/create-edit-recipe.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PurchaseComponent } from './purchase/purchase.component';
import { RecipesComponent } from './recipes/recipes.component';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { NgxPaginationModule } from 'ngx-pagination';
import { Ng2ImgMaxModule } from 'ng2-img-max';
import { SaleDialogComponent } from './sale-dialog/sale-dialog.component';
import { MatStepperModule } from '@angular/material/stepper';
import { ChangeStockComponent } from './change-stock/change-stock.component';

@NgModule({
  declarations: [
    ProductsComponent,
    PurchaseComponent,
    CreateEditRecipeComponent,
    RecipesComponent,
    SaleDialogComponent,
    ChangeStockComponent
  ],
  imports: [
    CommonModule,
    ProductsRoutingModule,
    ProductDivModule,
    ShoppingCartModule,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatDividerModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    MatSelectModule,
    MatCardModule,
    MatChipsModule,
    MatCheckboxModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatDatepickerModule,
    MatExpansionModule,
    MatNativeDateModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyA2tVXwzAQc5Ppj8-oTEuYBCFyJp39Hz7s'
    }),
    LazyLoadImageModule.forRoot(),
    NgxPaginationModule,
    Ng2ImgMaxModule,
    MatStepperModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' }
  ],
  entryComponents: [
    CreateEditRecipeComponent,
    SaleDialogComponent,
    ChangeStockComponent
  ]
})
export class ProductsModule { }
