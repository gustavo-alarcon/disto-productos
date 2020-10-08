import { ActivatedRoute, Router } from '@angular/router';
import { User } from 'src/app/core/models/user.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { map, startWith, filter, tap } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { DatabaseService } from 'src/app/core/services/database.service';
import { Observable, combineLatest } from 'rxjs';
import { Component, OnInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { Product } from 'src/app/core/models/product.model';
import { LoginDialogComponent } from '../login-dialog/login-dialog.component';
import { ScrollDispatcher } from '@angular/cdk/overlay';
@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  firstSale: boolean = false

  products$: Observable<any>
  init$: Observable<User>
  categoryList$: Observable<any[]>

  name: string = ''
  maxWeight: number = 3
  districts: Array<any>
  total$: Observable<number>

  searchForm: FormControl = new FormControl('')

  defaultImage = "../../../assets/images/default-image.jpg";

  user: User = null
  scroll$: Observable<any>

  p: number = 1;

  @ViewChild("scroll", { static: false }) scrollbar: ElementRef;

  constructor(
    public dbs: DatabaseService,
    private dialog: MatDialog,
    public auth: AuthService,
    private router: Router,
    public scroll: ScrollDispatcher,
    private renderer: Renderer2,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.dbs.delivery = 0
    this.scroll$ = this.scroll.scrolled().pipe(
      tap(data => {
        const scrollTop = data.getElementRef().nativeElement.scrollTop || 0;
        if (scrollTop >= 120) {
          this.renderer.addClass(this.scrollbar.nativeElement, 'shadow')
        } else {
          this.renderer.removeClass(this.scrollbar.nativeElement, 'shadow')
        }
      })
    )
    this.categoryList$ = combineLatest(
      this.route.fragment, this.dbs.getProductsListCategoriesValueChanges()).pipe(
        map(([route, categories]) => {
          let array = [...categories].map(el => {
            return {
              name: el.name,
              select: el.name == route
            }
          })
          return array
        })
      )

    this.products$ = combineLatest(
      this.route.fragment,
      this.dbs.getProductsList(),
      this.dbs.getPackagesList(),
      this.searchForm.valueChanges.pipe(
        filter(input => input !== null),
        startWith<any>(''),
        map(value => value.toLowerCase())
      )
    ).pipe(
      map(([route, products, packages, search]) => {
        let publish = products.filter(el => route ? el.category == route : true)
        let packPublish = [...packages].filter(el => el.published).map(el => {
          el['items'] = el.items.map(el => {
            let options = [...el.productsOptions].map(ul => {
              let productOp = products.filter(lo => lo.id == ul.id)[0]
              return productOp
            })

            // let select = options.filter(lu => (lu.realStock >= lu.sellMinimum) && lu.published)[0]
            let select = options.filter(lu => (lu?.realStock >= lu?.sellMinimum))[0]
            return {
              productsOptions: options,
              choose: select
            }
          })

          return el
        }).filter(el => route ? el.category == route : true)

        let any = [].concat(packPublish, publish)


        return any.filter(el => search ? el.description.toLowerCase().includes(search) : true)
      }),
      tap(res => {
        if (this.dbs.order.length == 0 && localStorage.getItem('order') && localStorage.getItem('dbsorder')) {
          let guardado = localStorage.getItem('dbsorder')
          this.dbs.order = JSON.parse(guardado)
          if (this.dbs.order.length) {
            this.dbs.view.next(2)
            this.dbs.total = this.dbs.order.map(el => this.giveProductPrice(el)).reduce((a, b) => a + b, 0)
            this.dbs.sum.next(this.dbs.total)
          }

        }
      })
    )

    this.init$ = combineLatest(
      this.auth.user$,
      this.dbs.getGeneralConfigDoc()
    ).pipe(
      map(([user, confi]) => {
        this.maxWeight = confi['maxWeight']
        this.districts = confi['districts']
        if (user) {
          return user
        } else {
          return null
        }
      }),
      tap(res => {
        if (res) {
          this.user = res
          if (res['salesCount']) {
            this.firstSale = false
          } else {
            this.firstSale = true
          }

          if (res['contact']) {
            this.name = res.name.split(' ')[0]
            if (this.compareDistricts(res.contact.district)) {
              this.dbs.delivery = res.contact.district.delivery
            }

          }
        }
      })
    )

    this.dbs.total = this.dbs.order.map(el => this.giveProductPrice(el)).reduce((a, b) => a + b, 0)


  }

  compareDistricts(district) {
    return this.districts.find(el => el['name'] == district['name'])
  }

  getdiscount(item: Product) {
    let promo = item.price - item.promoData.promoPrice
    let discount = (promo / item.price) * 100
    return Math.round(discount)
  }

  login() {
    this.dialog.open(LoginDialogComponent)
    localStorage.setItem('order', 'true')
    localStorage.setItem('length', this.dbs.order.length.toString())
    localStorage.setItem('dbsorder', JSON.stringify(this.dbs.order));
  }



  giveProductPrice(item) {
    if (item.product.promo) {
      let promTotalQuantity = Math.floor(item.quantity / item.product.promoData.quantity);
      let promTotalPrice = promTotalQuantity * item.product.promoData.promoPrice;
      let noPromTotalQuantity = item.quantity % item.product.promoData.quantity;
      let noPromTotalPrice = noPromTotalQuantity * item.product.price;
      return Number((promTotalPrice + noPromTotalPrice).toFixed(1));
    }
    else {
      return Number((item.quantity * item.product.price).toFixed(1));
    }
  }

  shoppingCart() {
    this.dbs.view.next(2)
  }

  back(route) {
    if (route) {
      this.router.navigate(['/main']);
    }
    this.dbs.view.next(1)
    this.p = 1
    this.dbs.total = this.dbs.order.map(el => this.giveProductPrice(el)).reduce((a, b) => a + b, 0)
  }

  finish() {
    this.dbs.view.next(3)
    this.p = 1
    localStorage.removeItem('dbsorder')
    localStorage.removeItem('order')
    localStorage.removeItem('length')
    localStorage.clear()
  }


  navigate(name) {
    this.router.navigate(['/main/products'], { fragment: name });
  }

}
