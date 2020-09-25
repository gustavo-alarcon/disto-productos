import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, FormControl } from '@angular/forms';
import { DatabaseService } from 'src/app/core/services/database.service';
import { Product } from 'src/app/core/models/product.model';
import { of, Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith, tap, debounceTime, distinctUntilChanged, filter, take } from 'rxjs/operators';
import { Ng2ImgMaxService } from 'ng2-img-max';
import { ProductConfigCategoriesComponent } from '../product-config-categories/product-config-categories.component';
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from 'src/app/core/models/user.model';
import { Unit } from 'src/app/core/models/unit.model';
import { ProductConfigUnitsComponent } from '../product-config-units/product-config-units.component';

@Component({
  selector: 'app-product-transfer-merma',
  templateUrl: './product-transfer-merma.component.html',
  styleUrls: ['./product-transfer-merma.component.scss']
})
export class ProductTransferMermaComponent implements OnInit {
  mermaForm: FormGroup;
  toMerma: FormControl;
  fromMerma: FormControl

  constructor(
    private dialogRef: MatDialogRef<ProductTransferMermaComponent>,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private dbs: DatabaseService,
    private snackBar: MatSnackBar,
    private ng2ImgMax: Ng2ImgMaxService,
    @Inject(MAT_DIALOG_DATA) public data: { data: Product, toMerma: boolean, user: User }
  ) { }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.mermaForm = this.fb.group({
      toMerma: [{disabled: !this.data.toMerma, value:0}, [
        Validators.required, Validators.min(0), Validators.max(this.data.data.realStock)]],
      fromMerma: [{disabled: this.data.toMerma, value:0}, [
        Validators.required, Validators.min(0), Validators.max(this.data.data.mermaStock)]],
    })
  }

  deb() {
    //console.log(this.productForm);
  }

  onSubmitForm() {
    this.mermaForm.markAsPending();

    this.dbs.transferStock(this.data.toMerma, 
      this.mermaForm.get(this.data.toMerma ? "toMerma": "fromMerma").value, this.data.data, this.data.user)
        .commit().then(res => {
          this.dialogRef.close(true);
        },
          err => {
            this.dialogRef.close(false);
        })
  }

}
