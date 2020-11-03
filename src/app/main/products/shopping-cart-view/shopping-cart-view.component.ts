import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';
import { LoginDialogComponent } from '../../login-dialog/login-dialog.component';

@Component({
  selector: 'app-shopping-cart-view',
  templateUrl: './shopping-cart-view.component.html',
  styleUrls: ['./shopping-cart-view.component.scss']
})
export class ShoppingCartViewComponent implements OnInit {

  loadCart$:Observable<any>

  constructor(
    public dbs: DatabaseService,
    private dialog: MatDialog,
    public auth: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCart$ = this.dbs.orderObs$
    if (
      this.dbs.order.length == 0 &&
      localStorage.getItem("order") &&
      localStorage.getItem("dbsorder")
    ) {
      let guardado = localStorage.getItem("dbsorder");
      let neworder = JSON.parse(guardado);
      this.dbs.order = neworder;
      this.dbs.orderObs.next(this.dbs.order)
      if (this.dbs.order.length) {
        this.dbs.total = this.dbs.order
          .map((el) => this.giveProductPrice(el))
          .reduce((a, b) => a + b, 0);
        this.dbs.sum.next(this.dbs.total);
      }
    }
  }

  back(route) {
    if (route) {
      this.router.navigate(["/main"]);
    }else{
      if(this.dbs.productView){
        this.router.navigate(['/main/products'], { fragment: this.dbs.productView });
      }else{
        this.router.navigate(["/main"]);
      }
    }
    this.dbs.total = this.dbs.order
      .map((el) => this.giveProductPrice(el))
      .reduce((a, b) => a + b, 0);
  }

  giveProductPrice(item) {
    if (item.product.promo) {
      let promTotalQuantity = Math.floor(
        item.quantity / item.product.promoData.quantity
      );
      let promTotalPrice =
        promTotalQuantity * item.product.promoData.promoPrice;
      let noPromTotalQuantity = item.quantity % item.product.promoData.quantity;
      let noPromTotalPrice = noPromTotalQuantity * item.product.price;
      return Number((promTotalPrice + noPromTotalPrice).toFixed(1));
    } else {
      return Number((item.quantity * item.product.price).toFixed(1));
    }
  }

  login() {
    this.dialog.open(LoginDialogComponent);
    localStorage.setItem("order", "true");
    localStorage.setItem("length", this.dbs.order.length.toString());
    localStorage.setItem("dbsorder", JSON.stringify(this.dbs.order));
  }
}
