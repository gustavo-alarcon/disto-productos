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

import { MermaTransfer, MermaTransferWithProduct, Product } from 'src/app/core/models/product.model';
import { ProductCreateEditComponent } from '../product-create-edit/product-create-edit.component';
import { ProductEditPromoComponent } from '../product-edit-promo/product-edit-promo.component';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';
import { Category } from 'src/app/core/models/category.model';
import { User } from 'src/app/core/models/user.model';
import { ProductTransferMermaComponent } from '../product-transfer-merma/product-transfer-merma.component';
import { ProductMermaHistoryComponent } from '../product-merma-history/product-merma-history.component';
import { DatePipe } from '@angular/common';


@Component({
  selector: 'app-products-merma-list',
  templateUrl: './products-merma-list.component.html',
  styleUrls: ['./products-merma-list.component.scss']
})
export class ProductsMermaListComponent implements OnInit {

  //Forms
  categoryForm: FormControl;
  itemsFilterForm: FormControl;
  historyForm: FormControl;
  date: FormControl;

  //Table
  productsTableDataSource = new MatTableDataSource<Product>();
  productsDisplayedColumns: string[] = [
    'index', 'photoURL', 'description', 'sku', 'category', /*'price',*/
    'unitDescription', /*'unitAbbreviation', */'unitWeight', /*'sellMinimum', 'alertMinimum',*/
    /*'realStock',*/ 'mermaStock', /*'virtualStock', 'published', */'actions'
  ]
  mermaTableDataSource = new MatTableDataSource<MermaTransferWithProduct>();
  mermaDisplayedColumns: string[] = [
    'index', 'description', 'sku', 'category', 'unitDescription', 'unitWeight', 
    'toMerma', 'quantity', 'date', 'user', 'observations', 'actions'
  ]

  productsObservable$: Observable<Product[]>
  @ViewChild('productsPaginator', { static: false }) set content(paginator1: MatPaginator) {
    this.productsTableDataSource.paginator = paginator1;
  }

  mermaObservable$: Observable<MermaTransferWithProduct[]>
  @ViewChild('mermaPaginator', { static: false }) set contentMerma(paginator1: MatPaginator) {
    this.mermaTableDataSource.paginator = paginator1;
  }

  //Observables
  categoryObservable$: Observable<[any, Category[]]>
  categoryList$: Observable<Category[]>;
  filter$: Observable<boolean>;


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
    public auth: AuthService,
    private datePipe: DatePipe,

  ) { }

  ngOnInit(): void {
    this.initForms();
    this.initObservables();
  }

  initForms() {
    this.categoryForm = this.fb.control("");
    this.itemsFilterForm = this.fb.control("");
    this.historyForm = this.fb.control(false);

    this.date = new FormControl({
      begin: this.getCurrentMonthOfViewDate().from,
      end: this.getCurrentMonthOfViewDate().to
    });
  }

  initObservables() {
    this.productsTableDataSource.filterPredicate =
      (data: Product, filter: string) => {
        let category = filter.trim().split('&+&')[0];   //category
        let name = filter.trim().split('&+&')[1];       //product name
        return (!!data.category.match(new RegExp(category, 'ig'))
          && !!data.description.match(new RegExp(name, 'ig')))
      }

    this.mermaTableDataSource.filterPredicate =
      (data: MermaTransferWithProduct, filter: string) => {
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
          this.mermaTableDataSource.filter = (categorySelected.length > 1 ? '' : categorySelected[0].name) + '&+&' + itemsFormValue;
          return true
        })
      )

    this.productsObservable$ = this.dbs.getProductsListValueChanges().pipe(
      tap(res => {
        let withMerma = res.filter(el => !!el.mermaStock)
        this.productsTableDataSource.data = withMerma.map(el => {
          // el['virtualStock$'] = this.dbs.getVirtualStock(el).pipe(
          //   map(prod => prod.reduce((a, b) => a + b.quantity, 0))
          // );
          return el
        })
      })
    )

    this.mermaObservable$ = combineLatest([
      this.productsObservable$,
      this.date.valueChanges.pipe(startWith(this.date.value), switchMap(date => (
        this.dbs.getMermaTransferHistoryDate(date)
      )))
    ]).pipe(map(([productList, mermaHistory])=>{


      let productWithMerma: MermaTransferWithProduct[] = mermaHistory
        .filter(el => !!productList.find(el2 => el.productId==el2.id))
        .map(el => ({...productList.find(el2 => el.productId==el2.id), ...el}))


      this.mermaTableDataSource.data = productWithMerma

      return productWithMerma
    }))




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

  onTransferHistoryMerma(product: MermaTransferWithProduct){
    let dialogRef: MatDialogRef<ProductMermaHistoryComponent>;
    dialogRef = this.dialog.open(ProductMermaHistoryComponent, {
      data: {
        product: { ...product, id: product.productId },
      }
    });
  }

  getCurrentMonthOfViewDate(): { from: Date, to: Date } {
    const date = new Date();
    const fromMonth = date.getMonth();
    const fromYear = date.getFullYear();

    const actualFromDate = new Date(fromYear, fromMonth, 1);

    const toMonth = (fromMonth + 1) % 12;
    let toYear = fromYear;

    if (fromMonth + 1 >= 12) {
      toYear++;
    }

    const toDate = new Date(toYear, toMonth, 1);

    return { from: actualFromDate, to: toDate };
  }

  downloadXls(): void {
    let table_xlsx: any[] = [];
    let headersXlsxProducts = [
      'Descripcion', 'SKU', 'Categoría', 
      'Descripción de Unidad', 'Peso (KG)', 'Merma'
    ]
    let headersXlsxMerma = [
      'Descripcion', 'SKU', 'Categoría', 
      'Descripción de Unidad', 'Peso (KG)', 'Dirección',
      'Cantidad', 'Fecha', 'Usuario', 'Observaciones'
    ]

    if(!this.historyForm.value){
      table_xlsx.push(headersXlsxProducts);

      this.productsTableDataSource.filteredData.forEach(product => {
        const temp = [
          product.description,
          product.sku,
          product.category,
          product.unit.description,
          product.unit.weight,
          product.mermaStock,
        ];

        table_xlsx.push(temp);
      })
    } else {
      table_xlsx.push(headersXlsxMerma);

      this.mermaTableDataSource.data.forEach(product => {
        const temp = [
          product.description,
          product.sku,
          product.category,
          product.unit.description,
          product.unit.weight,
          product.toMerma ? "De stock a Merma.":"De merma a Stock.",
          product.quantity,
          this.datePipe.transform(product.date['seconds'] * 1000, 'dd/MM/yyyy(hh:mm:ss)'),
          product.user.displayName,
          product.observations
        ];

        table_xlsx.push(temp);
      })
    }

    /* generate worksheet */
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(table_xlsx);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, this.historyForm.value ? "Historial_de_merma":'Lista_de_productos');

    /* save to file */
    const name = (this.historyForm.value ? "Historial_de_merma":'Lista_de_productos') + '.xlsx';
    XLSX.writeFile(wb, name);
  }
}
