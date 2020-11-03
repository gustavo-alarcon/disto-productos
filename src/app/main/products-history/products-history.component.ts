import { switchMap, map, startWith, tap, takeLast } from "rxjs/operators";
import { Observable, combineLatest, BehaviorSubject } from "rxjs";
import { Sale } from "./../../core/models/sale.model";
import { DatabaseService } from "src/app/core/services/database.service";
import { AuthService } from "src/app/core/services/auth.service";
import { FormControl } from "@angular/forms";
import { Component, OnInit } from "@angular/core";
import * as XLSX from 'xlsx';
@Component({
  selector: "app-products-history",
  templateUrl: "./products-history.component.html",
  styleUrls: ["./products-history.component.scss"],
})
export class ProductsHistoryComponent implements OnInit {
  dateForm: FormControl;
  init$: Observable<Sale[]>;
  prueba$: Observable<any>;
  chooseSale: Sale;

  view = new BehaviorSubject<number>(1);
  view$ = this.view.asObservable();

  p: number = 1;
  p1: number = 1;

  dataX:any

  constructor(private dbs: DatabaseService, private auth: AuthService) {}

  ngOnInit(): void {
    const view = this.dbs.getCurrentMonthOfViewDate();

    let beginDate = view.from;
    let endDate = new Date();
    endDate.setHours(23, 59, 59);

    this.dateForm = new FormControl({
      begin: beginDate,
      end: endDate,
    });

    this.init$ = this.auth.user$.pipe(
      switchMap((user) => {
        return combineLatest(
          this.dbs.getSalesUser(user.uid),
          this.dateForm.valueChanges.pipe(
            startWith<{ begin: Date; end: Date }>({
              begin: beginDate,
              end: endDate,
            }),
            map(({ begin, end }) => {
              begin.setHours(0, 0, 0, 0);
              end.setHours(23, 59, 59);
              return { begin, end };
            })
          )
        ).pipe(
          map(([products, date]) => {
            return products.filter((el) => {
              return this.getFilterTime(el["createdAt"], date);
            });
          })
        );
      })
    );

    this.prueba$ = this.dateForm.valueChanges.pipe(
      startWith<{ begin: Date; end: Date }>({ begin: beginDate, end: endDate }),
      map(({ begin, end }) => {
        begin.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59);
        return { begin, end };
      }),
      switchMap((res) => {
        return combineLatest(
          this.dbs.getProductsList(),
          this.dbs.getSales(res).pipe(
            map((sales) => {
              return sales.map((sal) => {
                return {
                  name: sal.correlative,
                  products: this.dbs.getneworder(sal.requestedProducts),
                };
              });
            })
          )
        ).pipe(
          map(([products, sales2]) => {
            
            return products.map((prod) => {
              let sales = sales2.filter((sale) => {
                let ejem = sale.products.filter(
                  (ol) => ol["product"]["id"] == prod.id
                );
                return ejem.length;
              });
              let quant = sales.map((ul) => {
                return ul["products"]
                  .filter((ol) => ol["product"]["id"] == prod.id)
                  .reduce((a, b) => a + b["reduce"], 0);
              });
              let first = sales.map(du=>{
                return du.products.filter((ol) => ol["product"]["id"] == prod.id)[0]['product']
              })
              return {
                name: prod.description,
                realStock:prod.realStock,
                virtualStock:prod.virtualStock,
                sales: sales.map((di) => di.name),
                quantity: quant,
                reduce:quant.reduce((a,b)=>b+a,0),
                first:sales.length?first[0]['realStock']:null,
                firstV:sales.length?first[0]['virtualStock']:null
              };
            });
          }),
          tap((ord) => {
            this.dataX = ord
            console.log(ord);
          })
        );
      })
    );
  }

  getTotal(order) {
    return order
      .map((el) => this.giveProductPrice(el))
      .reduce((a, b) => a + b, 0);
  }

  roundNumber(number) {
    return Number(parseFloat(number).toFixed(1));
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
      return this.roundNumber(promTotalPrice + noPromTotalPrice);
    } else {
      return this.roundNumber(item.quantity * item.product.price);
    }
  }

  getFilterTime(el, time) {
    let date = el.toMillis();
    let begin = time.begin.getTime();
    let end = time.end.getTime();
    return date >= begin && date <= end;
  }

  showList(item: Sale, small: boolean) {
    this.chooseSale = item;
    if (small) {
      this.view.next(2);
    }
  }

  hideList() {
    this.chooseSale = null;
  }

  back() {
    this.view.next(1);
    this.hideList();
  }

  getStatus(status: string) {
    switch (status.toLowerCase()) {
      case "solicitado":
        return "Solicitado";
        break;
      case "atendido":
        return "En atención";
        break;
      case "anulado":
        return "Anulado";
        break;
      default:
        return "Atendido";
        break;
    }
  }

  getColor(status: string) {
    switch (status.toLowerCase()) {
      case "atendido":
        return "attend status";
        break;
      case "anulado":
        return "anulado status";
        break;
      default:
        return "solicitado status";
        break;
    }
  }

  downloadXls(): void {
    let table_xlsx: any[] = [];
    let headersXlsx = [
      'Name', 'Stock Inicial', 'Vendidos','Stock teorico','Stock real','Stock virtual', 'ventas'
    ]

    table_xlsx.push(headersXlsx);

    this.dataX.forEach(product => {
      const temp = [
        product.name,
        product.first,
        product.reduce,
        product.first - product.reduce,
        product.realStock,
        product.virtualStock,
        product.sales.join(',')
      ];

      table_xlsx.push(temp);
    })

    /* generate worksheet */
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(table_xlsx);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lista_de_productos_ventas');

    /* save to file */
    const name = 'Lista_de_productos_ventas' + '.xlsx';
    XLSX.writeFile(wb, name);
  }
}
