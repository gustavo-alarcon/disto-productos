import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Ticket } from 'src/app/core/models/ticket.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { tap } from 'rxjs/internal/operators/tap';
import { User } from 'src/app/core/models/user.model';
import { Observable } from 'rxjs/internal/Observable';
import { FormControl } from '@angular/forms';
import { PosSavingComponent } from '../pos-saving/pos-saving.component';
import { take } from 'rxjs/operators';
import { Product } from 'src/app/core/models/product.model';
import { BehaviorSubject } from 'rxjs';
import { DatabaseService } from 'src/app/core/services/database.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-pos-finish',
  templateUrl: './pos-finish.component.html',
  styleUrls: ['./pos-finish.component.scss']
})
export class PosFinishComponent implements OnInit {

  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  user$: Observable<User>;
  payment = new FormControl();
  failedItems: Array<Product> = [];

  paymentMethod = new FormControl();
  paymentTypes$: Observable<Array<any>>;

  failedCorrelative: number;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Ticket,
    private dialogRef: MatDialogRef<PosFinishComponent>,
    private dialog: MatDialog,
    private dbs: DatabaseService,
    private snackbar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.paymentTypes$ = this.dbs.getPayments();
  }

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    this.loading.next(true);

    if (this.paymentMethod.value && (this.payment.value >= this.data.total)){
      this.dialog.open(PosSavingComponent, {
        data: {
          ticket: this.data,
          payment: this.payment.value,
          paymentMethod: this.paymentMethod.value
        }
      }).afterClosed()
        .pipe(take(1))
        .subscribe(res => {
          if (res.list.length > 0) {
            res.forEach(el => {
              this.failedItems.push(this.data.productList[el].product);
            });

            this.failedCorrelative = res.correlative;
          } else {
            this.dialogRef.close(true);
          }

          this.loading.next(false);
        })
    } else {
      this.snackbar.open("Complete el formulario o asigne un monto de pago, por lo menos igual al importe a cobrar!", "Aceptar")
    }


  }

}
