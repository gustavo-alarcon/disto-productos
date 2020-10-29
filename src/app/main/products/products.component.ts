import { ActivatedRoute, Router } from "@angular/router";
import { User } from "src/app/core/models/user.model";
import { AuthService } from "src/app/core/services/auth.service";
import { MatDialog } from "@angular/material/dialog";
import { map, startWith, filter, tap, switchMap } from "rxjs/operators";
import { FormControl } from "@angular/forms";
import { DatabaseService } from "src/app/core/services/database.service";
import { Observable, combineLatest, BehaviorSubject } from "rxjs";
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Renderer2,
} from "@angular/core";
import { Product } from "src/app/core/models/product.model";
import { LoginDialogComponent } from "../login-dialog/login-dialog.component";
import { ScrollDispatcher } from "@angular/cdk/overlay";
import { ChangeStockComponent } from "./change-stock/change-stock.component";
@Component({
  selector: "app-products",
  templateUrl: "./products.component.html",
  styleUrls: ["./products.component.scss"],
})
export class ProductsComponent implements OnInit {
  firstSale: boolean = false;

  products$: Observable<any>;
  init$: Observable<User>;
  categoryList$: Observable<any[]>;

  name: string = "";
  maxWeight: number = 3;
  districts: Array<any>;
  total$: Observable<number>;

  searchForm: FormControl = new FormControl("");

  defaultImage = "../../../assets/images/default-image.jpg";

  user: User = null;

  p: number = 1;

  constructor(
    public dbs: DatabaseService,
    private dialog: MatDialog,
    public auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.dbs.delivery = 6;

    this.categoryList$ = combineLatest(
      this.route.fragment,
      this.dbs.getProductsListCategoriesValueChanges()
    ).pipe(
      map(([route, categories]) => {
        let array = [...categories].map((el) => {
          return {
            name: el.name,
            select: el.name == route,
          };
        });
        return array;
      })
    );

    this.products$ = this.route.fragment.pipe(
      switchMap(route=>{
        return combineLatest(
          this.dbs.getProductsListCategory(route),
          this.dbs.getPackagesListCategory(route),
          this.searchForm.valueChanges.pipe(
            filter((input) => input !== null),
            startWith<any>(""),
            map((value) => value.toLowerCase())
          )
        ).pipe(
          map(([products, packages, search]) => {
            this.dbs.productView = route ? route : "";
            let publish = products.filter((el) => el.published)
            let packPublish = [...packages].filter((el) => el.published)
    
            let any = [].concat(packPublish, publish).sort((a,b)=>b.priority - a.priority);
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
    
            return any.filter((el) =>
              search ? el.description.toLowerCase().includes(search) : true
            );
          })
        );
      })
    )

    this.init$ = combineLatest(
      this.auth.user$,
      this.dbs.getGeneralConfigDoc()
    ).pipe(
      map(([user, confi]) => {
        this.maxWeight = confi["maxWeight"];
        this.districts = confi["districts"];
        if (user) {
          return user;
        } else {
          return null;
        }
      }),
      tap((res) => {
        if (res) {
          this.user = res;
        }
      })
    );

    this.dbs.total = this.dbs.order
      .map((el) => this.giveProductPrice(el))
      .reduce((a, b) => a + b, 0);
  }

  getdiscount(item: Product) {
    let promo = item.price - item.promoData.promoPrice;
    let discount = (promo / item.price) * 100;
    return Math.round(discount);
  }

  login() {
    this.dialog.open(LoginDialogComponent);
    localStorage.setItem("order", "true");
    localStorage.setItem("length", this.dbs.order.length.toString());
    localStorage.setItem("dbsorder", JSON.stringify(this.dbs.order));
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

  shoppingCart() {
    //aqui comprobamos stock
    let check = this.checkStock();
    this.router.navigate(["/main/products/carrito"]);
  }

  finish() {
    //aqui también comprobamos stock
    this.p = 1;
    localStorage.removeItem("dbsorder");
    localStorage.removeItem("order");
    localStorage.removeItem("length");
    localStorage.clear();
  }

  navigate(name) {
    this.router.navigate(["/main/products"], { fragment: name });
  }

  checkStock() {
    let reduceOrder = this.dbs.getneworder(this.dbs.order);
    this.dbs.saveTransaction(reduceOrder).then((res) => {
      //this.loadCart.next(true)
      let failedItems = [];
      let rightItems = [];
      res.forEach((el) => {
        if (!el.isSave) {
          failedItems.push(el);
        } else {
          rightItems.push(el);
        }
      });
      if (failedItems.length) {
        let mess = [];
        failedItems.forEach((el) => {
          if (el.stock >= 0) {
            mess.push({
              product: reduceOrder[el.index]["product"],
              stock: el["stock"],
            });
          }
          this.dbs.changeStock.next(mess);
          this.dialog.open(ChangeStockComponent, {
            data: {
              productos: mess.map((pr) => {
                return {
                  product: pr.product.description,
                  stock: pr.stock,
                };
              }),
            },
          });
          return false;
        });
      } else {
        return true;
      }
      return false;
    });
  }

}
