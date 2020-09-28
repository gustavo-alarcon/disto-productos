import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DatabaseService } from 'src/app/core/services/database.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Product } from 'src/app/core/models/product.model';
import { Observable, combineLatest, BehaviorSubject, of } from 'rxjs';
import { startWith, map, take, switchMap, filter } from 'rxjs/operators';
import { Unit } from 'src/app/core/models/unit.model';
import { User } from 'src/app/core/models/user.model';
import { Buy, BuyRequestedProduct } from 'src/app/core/models/buy.model';
import { ProviderDialogComponent } from 'src/app/main/provider-dialog/provider-dialog.component';

interface SelProd {
  id: string,
  productDescription: string,
  unit: Unit;
  unitPrice: number,
  quantity: number,
  desiredDate: Date,
}

@Component({
  selector: 'app-request-create-edit',
  templateUrl: './request-create-edit.component.html',
  styleUrls: ['./request-create-edit.component.scss']
})

export class RequestCreateEditComponent implements OnInit {
  dateLimit = new Date(Date.now() + 8.64e+7)

  correlative$: Observable<string>;

  selectedProducts: BehaviorSubject<SelProd[]> = new BehaviorSubject([]);
  selectedProducts$: Observable<SelProd[]>;

  products$: Observable<Product[]>;
  requestFormGroup: FormGroup;

  filteredProvider$: Observable<any>

  providerForm: FormControl

  constructor(
    private dialogRef: MatDialogRef<RequestCreateEditComponent>,
    private dbs: DatabaseService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: { data: Buy, edit: boolean }
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.initObservables();
  }

  initForms() {
    let provider = null
    this.requestFormGroup = this.fb.group({
      product: ["", [Validators.required, this.productObjectValidator()]],
      quantity: [0, [Validators.required, Validators.min(0.01)]],
      // unitPrice: [0, [Validators.required, Validators.min(0.01)]],
      desiredDate: [null, Validators.required]
    })
    if (this.data.edit) {
      provider = this.data.data.provider ? this.data.data.provider : null
    }
    this.providerForm = new FormControl(provider, [Validators.required, this.productObjectValidator()])
  }

  initObservables() {
    this.correlative$ = this.data.edit ?
      of(this.data.data.correlative.toString().padStart(6, "0")) :
      this.dbs.getBuysCorrelativeValueChanges().pipe(
        map(corr => corr.toString().padStart(4, "0")),
        startWith("0001")
      );

    this.products$ = combineLatest(
      this.requestFormGroup.get('product').valueChanges.pipe(startWith("")),
      this.dbs.getProductsListValueChanges()).pipe(
        map(([formValue, products]) => {
          if (typeof formValue === 'string') {
            return products.filter(el => el.description.match(new RegExp(formValue, 'ig')))
          } else {
            return []
          }
        })
      )

    this.selectedProducts$ = !this.data.edit ? this.selectedProducts.asObservable() :
      this.dbs.getBuyRequestedProducts(this.data.data.id).pipe(
        take(1),
        switchMap(prodList => {
          //We need to convert timestamps to Date
          prodList.forEach(prod => {
            let aux = new Date(1970)
            aux.setSeconds(prod.desiredDate['seconds']);
            prod.desiredDate = aux;
          })
          this.selectedProducts.next(prodList);
          return this.selectedProducts.asObservable()
        })
      )

    this.filteredProvider$ = combineLatest(
      this.dbs.getProvidersDoc(),
      this.providerForm.valueChanges.pipe(
        filter(input => input !== null),
        startWith<any>(''),
        map(value => typeof value === 'string' ? value.toLowerCase() : value.name.toLowerCase()))
    ).pipe(
      map(([providers, name]) => {
        return name ? providers.filter(option => option['name'].toLowerCase().includes(name)) : providers;
      })
    );
  }

  onAddProduct() {
    let product = <Product>this.requestFormGroup.get('product').value
    if (this.selectedProducts.value.find(el => el.id == product.id)) {
      this.snackBar.open("Este producto ya se encuentra en la lista", "Aceptar")
    } else {
      let selProds = this.selectedProducts.value;
      selProds.unshift({
        id: product.id,
        desiredDate: this.requestFormGroup.get('desiredDate').value,
        productDescription: product.description,
        quantity: this.requestFormGroup.get('quantity').value,
        unit: product.unit,
        unitPrice: 0 //this.requestFormGroup.get('unitPrice').value
      })
      this.selectedProducts.next(selProds);
    }
    this.requestFormGroup.setValue({
      product: "",
      quantity: 0,
      // unitPrice: 0,
      desiredDate: null,
    });
    this.requestFormGroup.markAsUntouched();
  }

  onDeleteProduct(productId: string) {
    let selProds = this.selectedProducts.value;
    selProds = selProds.filter(el => el.id != productId);
    this.selectedProducts.next(selProds);
  }

  onSubmitForm(user: User) {
    this.requestFormGroup.markAsPending();
    let date = new Date()

    let buy: Buy;
    let buyRequestedProducts: BuyRequestedProduct[];

    //edition
    if (this.data.edit) {
      buy = {
        id: this.data.data.id,
        correlative: this.data.data.correlative,
        requestedProducts: this.selectedProducts.value.map(el => el.id),
        totalAmount: this.selectedProducts.value.reduce((a, b) => a + b.quantity * b.unit.weight, 0),
        totalPrice: this.selectedProducts.value.reduce((a, b) => a + b.quantity * b.unitPrice, 0),
        validated: false,       //already validated docs should not be editted again
        validatedDate: null,
        status: 'por validar',
        //provider: this.providerForm.value,
        requestedDate: this.data.data.requestedDate,
        requestedBy: this.data.data.requestedBy,
        editedBy: user,
        editedDate: date
      }
    }
    //creation
    else {
      buy = {
        id: null,
        correlative: null,
        requestedProducts: this.selectedProducts.value.map(el => el.id),
        totalAmount: this.selectedProducts.value.reduce((a, b) => a + b.quantity * b.unit.weight, 0),
        totalPrice: this.selectedProducts.value.reduce((a, b) => a + b.quantity * b.unitPrice, 0),
        validated: false,
        validatedDate: null,
        status: 'por validar',
        //provider: this.providerForm.value,
        requestedDate: date,
        requestedBy: user,
        editedBy: null,
        editedDate: null,
      }
    }
    this.selectedProducts.getValue()
    buyRequestedProducts = this.selectedProducts.value.map(el => ({
      id: el.id,
      buyId: null,
      productDescription: el.productDescription,
      unit: el.unit,
      unitPrice: el.unitPrice,
      quantity: el.quantity,
      desiredDate: el.desiredDate,
      validated: false,
      validatedStatus: 'por validar',
      validationData: null,
      validatedBy: null,
      validatedDate: null,
      requestedDate: date,
      requestedBy: user,
    }))

    this.dbs.createEditBuyRequest(buy, buyRequestedProducts, this.data.edit, this.data.data)
      .then(
        res => {
          this.dialogRef.close(true);
        },
        err => {
          console.log(err);
          this.dialogRef.close(false);
        })
  }

  displayFn(input: Product) {
    if (!input) return '';
    return input.description;
  }

  displayPr(input: { name: string, ruc: string }) {
    if (!input) return '';
    return input.name;
  }

  productObjectValidator() {
    return (control: FormControl): { 'noProduct': boolean } => {
      if (control) {
        if (control.value) {
          if (typeof control.value != 'object') {
            return { noProduct: true }
          }
        }
      }
      return null
    }
  }

  createProvider() {
    this.dialog.open(ProviderDialogComponent, {
      data: {
        item: null,
        edit: false
      }
    })
  }
}
