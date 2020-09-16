import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { ProductsListRoutingModule } from './parent-list-routing.module';

import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import {MatChipsModule} from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { SatDatepickerModule, SatNativeDateModule } from 'saturn-datepicker';
import {MatTabsModule} from '@angular/material/tabs';



import { Ng2ImgMaxModule } from 'ng2-img-max';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { ProductCreateEditComponent } from './product-create-edit/product-create-edit.component';
import { ProductConfigCategoriesComponent } from './product-config-categories/product-config-categories.component';
import { ProductEditPromoComponent } from './product-edit-promo/product-edit-promo.component';
import { DatabaseService } from 'src/app/core/services/database.service';
import { ProductConfigUnitsComponent } from './product-config-units/product-config-units.component';
import { PackagesCreateEditComponent } from './packages-create-edit/packages-create-edit.component';
import { PackagesConfigUnitsComponent } from './packages-config-units/packages-config-units.component';
import { PackagesListComponent } from './packages-list/packages-list.component';
import { ProductsListComponent } from './products-list/products-list.component';
import { ParentListComponent } from './parent-list.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductEntryComponent } from './product-entry/product-entry.component';
import { MatRadioModule } from '@angular/material/radio';




@NgModule({
  declarations: [
    ParentListComponent,
    ProductsListComponent,
    ProductCreateEditComponent,
    ProductConfigCategoriesComponent,
    ProductEditPromoComponent,
    ProductConfigUnitsComponent,
    PackagesCreateEditComponent,
    PackagesConfigUnitsComponent,
    PackagesListComponent,
    ProductEntryComponent
  ],
  imports: [
    CommonModule,
    ProductsListRoutingModule,
    MatMenuModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatSlideToggleModule,
    LazyLoadImageModule.forRoot(),
    Ng2ImgMaxModule,
    MatDividerModule,
    MatDialogModule,
    MatProgressBarModule,
    MatSelectModule,
    MatDatepickerModule,
    SatDatepickerModule,
    SatNativeDateModule,
    MatChipsModule,
    MatTabsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatRadioModule
  ],
  providers: [
    ProductCreateEditComponent,
    ProductEditPromoComponent,
    PackagesCreateEditComponent,
    PackagesConfigUnitsComponent,
    DatabaseService
  ]
})
export class ParentListModule { }
