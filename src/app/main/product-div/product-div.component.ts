import { Package } from "src/app/core/models/package.model";
import { Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { DatabaseService } from "src/app/core/services/database.service";
import { Product } from "src/app/core/models/product.model";
import {
  Component,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
  Input,
} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { StoreClosedDialogComponent } from "src/app/shared-dialogs/store-closed-dialog/store-closed-dialog.component";
import { Observable, combineLatest, of, BehaviorSubject, forkJoin } from "rxjs";
import { tap, map, switchMap, mergeMap, take } from "rxjs/operators";

@Component({
  selector: "app-product-div",
  templateUrl: "./product-div.component.html",
  styleUrls: ["./product-div.component.scss"],
})
export class ProductDivComponent implements OnInit {
  @Input() package: boolean;
  @Input() id: string;
  @Input() maxWeight: number;
  @Input() buttonAdd: boolean;
  defaultImage = "../../../assets/images/Disto_Logo1.png";

  product$: Observable<any>;
  product: Product;

  stock:number

  productsList: Array<Product>;
  constructor(
    public dbs: DatabaseService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    
    if (this.package) {
      this.product$ = this.dbs.orderObs$.pipe(
        switchMap(ord=>{
          return this.dbs.getPackage(this.id).pipe(
            switchMap((pack) => {
             
              return this.dbs.getProductsListValueChanges().pipe(
                map(items => {
                  
                  pack["items"] = pack["items"].map((el) => {
                    let options = [...el.productsOptions].map((ul) => {
                      let productOp = items
                        .filter((lo) => lo.id == ul.id).map(lu=>{
                
                          return this.inOrder(lu,[...ord])
                        })[0]
                      if (productOp) {
                        ul["virtualStock"] = productOp["virtualStock"];
                        ul["sellMinimum"] = productOp["sellMinimum"];
                      }
                      return ul;
                    });
    
                    // let select = options.filter(lu => (lu.virtualStock >= lu.sellMinimum) && lu.published)[0]
                    let select = options.filter(
                      (lu) => lu?.virtualStock > lu?.sellMinimum
                    )[0];
                    return {
                      productsOptions: options,
                      choose: select,
                    };
                  });
                  return pack;
                })
              );
            })
          );
        }),
        tap((res) => {
          
          this.product = res;
        })
      )
    } else {
      this.product$ = this.dbs.orderObs$.pipe(
        switchMap(ord=>{
          return this.dbs.getProduct(this.id).pipe(
            map(prod=>{
             
              return this.inOrder(prod,[...ord])
            })
          )
        }),
        tap(prod=>{
          this.product = prod;
        })
      );
    }
  }

  inOrder(res,ord) {
    let index = [...ord].findIndex(
      (el) => el["product"]["id"] == res["id"]
    );
    if (index != -1) {
      res["virtualStock"] -= [...ord][index]["quantity"];
    }
    let inPackage = [...ord].filter((li) => {
      if (li.product.package) {
        return li.chosenOptions.filter((lo) => lo["id"] == res["id"]);
      } else {
        return false;
      }
    });
    if (inPackage.length) {
      res["virtualStock"]-= inPackage.length;
    }
    return res;
  }

  add(item) {
    
    if (!this.dbs.isOpen && !this.dbs.isAdmin) {
      this.dialog.open(StoreClosedDialogComponent);
      return;
    }

    if (this.package) {
      let newpackage = {
        product: item,
        quantity: 1,
        chosenOptions: item["items"].map((el) => el["choose"]),
      };
      this.dbs.order.push(newpackage);
    } else {
      let index = this.dbs.order.findIndex(
        (el) => el["product"]["id"] == item["id"]
      );

      if (index == -1) {
        let newproduct = {
          product: item,
          quantity: 1,
        };
        this.dbs.order.push(newproduct);
      } else {
        this.dbs.order[index]["quantity"]++;
      }
    }
    localStorage.removeItem("dbsorder");
    localStorage.setItem("dbsorder", JSON.stringify(this.dbs.order));
    this.dbs.total = [...this.dbs.order]
      .map((el) => this.giveProductPrice(el))
      .reduce((a, b) => a + b, 0);
    this.dbs.sum.next(
      [...this.dbs.order]
        .map((el) => this.giveProductPrice(el))
        .reduce((a, b) => a + b, 0)
    );
    this.dbs.orderObs.next(this.dbs.order);
    
    let stop = this.maxWeight;
    let realQuantity = this.dbs.order.map((el) => {
      if (el.product["package"]) {
        return el["chosenOptions"]
          .map((ol) => {
            return el.quantity * ol.unit.weight;
          })
          .reduce((a, b) => a + b, 0);
      } else {
        return el.quantity * el.product.unit.weight;
      }
    });

    let quantity = realQuantity.reduce((a, b) => a + b, 0);

    if (quantity >= stop) {
      this.snackBar.open(
        "🤯 Ha llegado al límite máximo de peso por pedido 🧀",
        "Aceptar",
        {
          duration: 6000,
        }
      );
    }
  }

  stopBuy(item: Product) {
    let prod = 0;
    if (item["package"]) {
      prod = item["items"]
        .map((el) => {
          return el["choose"].unit.weight;
        })
        .reduce((a, b) => a + b, 0);
    } else {
      prod = item.unit.weight;
    }

    let stop = this.maxWeight;
    let realQuantity = this.dbs.order.map((el) => {
      if (el.product["package"]) {
        return el["chosenOptions"]
          .map((ol) => {
            return el.quantity * ol.unit.weight;
          })
          .reduce((a, b) => a + b, 0);
      } else {
        return el.quantity * el.product.unit.weight;
      }
    });

    let quantity = realQuantity.reduce((a, b) => a + b, 0);

    return stop - quantity >= prod;
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

  getdiscount(item: Product) {
    let promo = item.price - item.promoData.promoPrice;
    let discount = (promo / item.price) * 100;
    return Math.round(discount);
  }

  navigate(name) {
    this.router.navigate(["/main/products/recetas", name]);
  }

  optionDisabled(product: Product): boolean {
    let stock = product.virtualStock <= product.sellMinimum;
    return stock;
  }

  packageDisabled(pack): boolean {
    let disabled = pack.items.filter((el) => !el.choose);
    return disabled.length > 0;
    // return false
  }
}
