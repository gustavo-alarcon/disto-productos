import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable, combineLatest, iif, of } from 'rxjs';
import { startWith, tap, map, share, switchMap, take } from 'rxjs/operators';
import { FormBuilder, FormControl } from '@angular/forms';
import * as XLSX from 'xlsx';


import { DatabaseService } from 'src/app/core/services/database.service';
import { AuthService } from 'src/app/core/services/auth.service';

import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

import { Product } from 'src/app/core/models/product.model';
import { ProductCreateEditComponent } from '../product-create-edit/product-create-edit.component';
import { ProductEditPromoComponent } from '../product-edit-promo/product-edit-promo.component';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';
import { Category } from 'src/app/core/models/category.model';
import { User } from 'src/app/core/models/user.model';
import { ProductTransferMermaComponent } from '../product-transfer-merma/product-transfer-merma.component';
import { ProductMermaHistoryComponent } from '../product-merma-history/product-merma-history.component';


@Component({
  selector: 'app-products-merma-list',
  templateUrl: './products-merma-list.component.html',
  styleUrls: ['./products-merma-list.component.scss']
})
export class ProductsMermaListComponent implements OnInit {

  //Forms
  categoryForm: FormControl;
  itemsFilterForm: FormControl;
  promoFilterForm: FormControl;

  //Table
  productsTableDataSource = new MatTableDataSource<Product>();
  productsDisplayedColumns: string[] = [
    'index', 'photoURL', 'description', 'sku', 'category', /*'price',*/
    'unitDescription', /*'unitAbbreviation', */'unitWeight', /*'sellMinimum', 'alertMinimum',*/
    /*'realStock',*/ 'mermaStock', /*'virtualStock', 'published', */'actions'
  ]

  productsObservable$: Observable<Product[]>
  @ViewChild('productsPaginator', { static: false }) set content(paginator1: MatPaginator) {
    this.productsTableDataSource.paginator = paginator1;
  }

  //Observables
  categoryObservable$: Observable<[any, Category[]]>
  categoryList$: Observable<Category[]>
  filter$: Observable<boolean>


  //Variables
  defaultImage = "../../../assets/images/Disto_Logo1.png";

  //noResult
  noResult$: Observable<string>;
  noResultImage: string = '';

  categorySelected: boolean  = false;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    public snackBar: MatSnackBar,
    private dbs: DatabaseService,
    public auth: AuthService
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.initObservables();
  }

  initForms() {
    this.categoryForm = this.fb.control("");
    this.itemsFilterForm = this.fb.control("");
    this.promoFilterForm = this.fb.control(false);
  }

  initObservables() {
    this.productsTableDataSource.filterPredicate =
      (data: Product, filter: string) => {
        let category = filter.trim().split('&+&')[0];   //category
        let name = filter.trim().split('&+&')[1];       //product name
        return (!!data.category.match(new RegExp(category, 'ig'))
          && !!data.description.match(new RegExp(name, 'ig')))
      }

    this.categoryObservable$ = combineLatest(
      this.categoryForm.valueChanges.pipe(startWith('')),
      this.dbs.getProductsListCategoriesValueChanges()
    ).pipe(share());

    this.categoryList$ = this.categoryObservable$.pipe(map(([formValue, categories]) => {
      // sanitazing form input
      let cleanFormValue = formValue.name ? formValue.name : '';
      // Flagging category selection
      this.categorySelected = formValue.name ? true : false;

      let filter = categories.filter(el => {
        return el.name.toLocaleLowerCase().includes(cleanFormValue.toLocaleLowerCase());
      });

      if (!(filter.length == 1 && filter[0] === formValue) && formValue.length) {
        this.categoryForm.setErrors({ invalid: true });
      }
      return filter;
    }));

    this.filter$ = combineLatest([
      this.categoryList$,
      this.itemsFilterForm.valueChanges.pipe(startWith(''))])
      .pipe(
        map(([categorySelected, itemsFormValue]) => {
          this.productsTableDataSource.filter = (categorySelected.length > 1 ? '' : categorySelected[0].name) + '&+&' + itemsFormValue;
          return true
        })
      )

    this.productsObservable$ = this.dbs.getProductsListValueChanges().pipe(
      map(res => res.filter(el => !!el.mermaStock)),
      tap(res => {
        this.productsTableDataSource.data = res.map(el => {
          el['virtualStock$'] = this.dbs.getVirtualStock(el).pipe(
            map(prod => prod.reduce((a, b) => a + b.quantity, 0))
          );
          return el
        })
      })
    )


  }

  showCategory(category: any): string | null {
    return category ? category.name : null
  }

  onTransferMerma(toMerma: boolean, product: Product, user: User){
    let dialogRef: MatDialogRef<ProductTransferMermaComponent>;

    if(toMerma){
      dialogRef = this.dialog.open(ProductTransferMermaComponent, {
        width: '350px',
        data: {
          data: { ...product },
          toMerma,
          user
        }
      });
      dialogRef.afterClosed().subscribe(res => {
        switch (res) {
          case true:
            this.snackBar.open('El producto fue editado satisfactoriamente', 'Aceptar', { duration: 5000 });
            break;
          case false:
            this.snackBar.open('Ocurrió un error. Por favor, vuelva a intentarlo', 'Aceptar', { duration: 5000 });
            break;
          default:
            break;
        }
      })
    } else {
      dialogRef = this.dialog.open(ProductTransferMermaComponent, {
        width: '350px',
        data: {
          data: { ...product },
          toMerma,
          user
        }
      });
      dialogRef.afterClosed().subscribe(res => {
        switch (res) {
          case true:
            this.snackBar.open('El producto fue editado satisfactoriamente', 'Aceptar', { duration: 5000 });
            break;
          case false:
            this.snackBar.open('Ocurrió un error. Por favor, vuelva a intentarlo', 'Aceptar', { duration: 5000 });
            break;
          default:
            break;
        }
      })
    }
  }

  onTransferHistoryMerma(product: Product){
    let dialogRef: MatDialogRef<ProductMermaHistoryComponent>;
    dialogRef = this.dialog.open(ProductMermaHistoryComponent, {
      data: {
        product: { ...product },
      }
    });
  }

  downloadXls(): void {
    let table_xlsx: any[] = [];
    let headersXlsx = [
      'Descripcion', 'SKU', 'Categoría', 'Precio',
      'Descripción de Unidad', 'Abreviación', 'Peso (KG)', 'Stock Real', 'Mínimo de venta', 'Mínimio de alerta',
      'Stock de merma', 'Stock Virtual', 'Publicado'
    ]

    table_xlsx.push(headersXlsx);

    this.productsTableDataSource.filteredData.forEach(product => {
      const temp = [
        product.description,
        product.sku,
        product.category,
        "S/." + product.price,
        product.unit.description,
        product.unit.abbreviation,
        product.unit.weight,
        product.realStock,
        product.sellMinimum,
        product.alertMinimum,
        product.mermaStock,
        0, //virtualStock
        product.published ? "Sí" : "No"
      ];

      table_xlsx.push(temp);
    })

    /* generate worksheet */
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(table_xlsx);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lista_de_productos');

    /* save to file */
    const name = 'Lista_de_productos' + '.xlsx';
    XLSX.writeFile(wb, name);
  }
}
