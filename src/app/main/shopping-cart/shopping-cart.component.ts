import { Product } from 'src/app/core/models/product.model';
import { Unit } from 'src/app/core/models/unit.model';
import { DatabaseService } from 'src/app/core/services/database.service';
import { Observable, combineLatest, of } from 'rxjs';
import { Component, OnInit, Input } from '@angular/core';
import { map, tap, switchMap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.scss']
})
export class ShoppingCartComponent implements OnInit {

  @Input() delivery: number = 6
  @Input() order: {
    product: Product,
    quantity: number
  }[] = []
  @Input() modified: boolean
  @Input() change: boolean

  delivery$: Observable<number>
  order$: Observable<any>
  total: number = 0

  constructor(
    private snackbar: MatSnackBar,
    public dbs: DatabaseService
  ) { }

  ngOnInit(): void {
    
    /*if(this.change){
      
      this.order$ = combineLatest(
        this.dbs.changeStock$,
        this.dbs.orderObs$
      ).pipe(
        map(([products,ord])=>{
          
          
          return [...ord].map(o=>{
            let pro = products.filter(el=>this.inProduct(el,o))[0]
            
            if(pro){
              o["change"]=this.inOrder([...ord],o['product'],pro.stock)
               
            }
            return o
            
          })
            
        }),
        tap(res=>{
          
          this.total = res.map(el => this.giveProductPrice(el)).reduce((a, b) => a + b, 0)
          
        })
      )
        
    }else{
      this.order$ = of(this.order)
      
    }*/
    this.order$ = of(this.order)
    this.total = this.order.map(el => this.giveProductPrice(el)).reduce((a, b) => a + b, 0)

  }

  inProduct(prod, ord) {
    
    if (ord.product.package) {
      return ord.chosenOptions.filter((lo) => lo["id"] == prod["product"]["id"]);
    }else{
      return ord["product"]["id"] == prod["product"]["id"]
    }
  }

  inOrder(ord,prod,stock) {
    let quant = 0
    let index = ord.findIndex(
      (el) => el["product"]["id"] == prod["id"]
    );
    if (index != -1) {
      quant+= ord[index]["quantity"];
    }
    let inPackage = ord.filter((li) => {
      if (li.product.package) {
        return li.chosenOptions.filter((lo) => lo["id"] == prod["id"]);
      } else {
        return false;
      }
    });
    if (inPackage.length) {
      quant+= inPackage.length;
    }
    return quant>stock
  }

  getUnit(quantity: number, unit: Unit) {
    if (unit.weight == 1) {
      if (quantity > 1) {
        return unit.description + 's'
      } else {
        return unit.description
      }
    } else {
      return '(' + unit.description + ')'
    }
  }

  roundNumber(number) {
    return Number(parseFloat(number).toFixed(1));
  }

  round(number) {
    return Math.floor(number)
  }

  giveProductPrice(item) {
    if (item.product.promo) {
      let promTotalQuantity = Math.floor(item.quantity / item.product.promoData.quantity);
      let promTotalPrice = promTotalQuantity * item.product.promoData.promoPrice;
      let noPromTotalQuantity = item.quantity % item.product.promoData.quantity;
      let noPromTotalPrice = noPromTotalQuantity * item.product.price;
      return this.roundNumber(promTotalPrice + noPromTotalPrice);
    }
    else {
      return this.roundNumber(item.quantity * item.product.price)
    }
  }

  delete(ind) {

    this.order.splice(ind, 1)
    this.total = this.order.map(el => this.giveProductPrice(el)).reduce((a, b) => a + b, 0)
    this.dbs.sum.next(this.total)
    localStorage.removeItem('dbsorder')
    localStorage.setItem('dbsorder', JSON.stringify(this.dbs.order));
    this.dbs.orderObs.next(this.order)
    if (this.order.length == 0) {
      
      this.dbs.total = this.total
      localStorage.removeItem('order')
      localStorage.removeItem('length')
      localStorage.clear()
    }


  }


}
