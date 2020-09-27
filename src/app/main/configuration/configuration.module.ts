import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { ConfigurationRoutingModule } from './configuration-routing.module';
import { ConfigurationComponent } from './configuration.component';
import { CreatePayComponent } from './create-pay/create-pay.component';
import { CreateUserComponent } from './create-user/create-user.component';
import { Ng2ImgMaxModule } from 'ng2-img-max';
import { HttpClientModule } from '@angular/common/http';
import { AddUserComponent } from './add-user/add-user.component';
import { CreateCategoryComponent } from './create-category/create-category.component';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ProviderDialogComponent } from './provider-dialog/provider-dialog.component';

@NgModule({
  declarations: [
    ConfigurationComponent,
    CreatePayComponent,
    CreateUserComponent,
    AddUserComponent,
    CreateCategoryComponent,
    ProviderDialogComponent
  ],
  imports: [
    CommonModule,
    ConfigurationRoutingModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatDividerModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatSelectModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatExpansionModule,
    MatCardModule,
    ReactiveFormsModule,
    FormsModule,
    NgxPaginationModule,
    Ng2ImgMaxModule,
    HttpClientModule,
    LazyLoadImageModule,
    DragDropModule
  ],
  entryComponents: [
    CreatePayComponent,
    CreateUserComponent,
    ProviderDialogComponent
  ]
})
export class ConfigurationModule { }
