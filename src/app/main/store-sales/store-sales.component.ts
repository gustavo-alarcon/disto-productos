import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';
import { FormControl } from '@angular/forms';
import { shareReplay, startWith, switchMap, map } from 'rxjs/operators';
import { Sale, saleStatusOptions } from 'src/app/core/models/sale.model';
import { StoreSale } from 'src/app/core/models/storeSale.model';
import { MatTableDataSource } from '@angular/material/table';
import { Product } from 'src/app/core/models/product.model';

@Component({
  selector: 'app-store-sales',
  templateUrl: './store-sales.component.html',
  styleUrls: ['./store-sales.component.scss']
})
export class StoreSalesComponent implements OnInit {

  displayedColumns: string[] = ['product', 'price', 'quantity', 'total'];
  dataSource = new MatTableDataSource<{ product: Product, quantity: number }>();

  totalPrice = new BehaviorSubject<number>(0);
  totalPrice$ = this.totalPrice.asObservable();

  defaultImage = '../../../../assets/images/no-image.png'

  saleStatusOptions = new saleStatusOptions();

  saleStateSubject: BehaviorSubject<string> = new BehaviorSubject('Total');
  saleState$: Observable<string> = this.saleStateSubject.asObservable().pipe(shareReplay(1));

  date = new FormControl();
  statusForm = new FormControl();
  search = new FormControl();

  storeSales$: Observable<StoreSale[]>;
  filteredSales$: Observable<StoreSale[]>;
  status: string[] = [];
  search$: Observable<string>;

  actualTicket: StoreSale;

  locationSubject: BehaviorSubject<number>= new BehaviorSubject(0)
  locationPadding$: Observable<string>;


  constructor(
    public auth: AuthService,
    private dbs: DatabaseService
  ) { }

  ngOnInit(): void {
    this.dbs.changeTitle('Ventas tienda');

    this.initForms();

    this.storeSales$ = this.date.valueChanges.pipe(
      startWith(this.date.value),
      switchMap((date: { begin: Date, end: Date }) => {
        date.begin.setHours(0, 0, 0);
        date.end.setHours(23, 59, 59);
        return this.dbs.getStoreSales({ begin: date.begin, end: date.end })
      }),
      map(sales => {
        return sales
      })
    );

    this.filteredSales$ = combineLatest(
      this.storeSales$,
      this.search.valueChanges.pipe(startWith('')),
      this.statusForm.valueChanges.pipe(startWith('Todos'))
    ).pipe(
      map(([sales, search, status]) => {
        let filtered = sales.filter(el => {
          let searchTerm = search.toLocaleLowerCase();

          if (status === 'Todos') {
            return el.correlative?.toString().toLocaleLowerCase().includes(searchTerm) || el.createdBy.completeName.toLocaleLowerCase().includes(searchTerm)
          } else {
            return el.correlative?.toString().toLocaleLowerCase().includes(searchTerm) &&
              (el.status?.toString() === status)
          }
        });

        this.totalPrice.next(this.calcTotal(filtered));

        return filtered;
      })
    );

    this.locationPadding$ = this.locationSubject.asObservable().pipe(
      map(location => {
        let aux = location + 1 > 10 ? (location % 10) : location;
        console.log(aux);
        // let x = 160 + 50 * aux;
        let x = 22 + 119 * aux;
        if (aux > 0) {
          console.log(x);
          return x.toFixed(0) + "px"
        } else {
          return "22px"
        }
      })
    );

  }

  initForms() {
    this.date = new FormControl({
      begin: new Date(),
      end: new Date
    });

    this.status = Object.values(['Pagado', 'Anulado', 'Fallido'])

    this.statusForm = new FormControl('Todos')
    this.search = new FormControl('');
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

  showDetails(sale: StoreSale, index: number): void {
    this.actualTicket = sale;
    this.dataSource.data = sale.ticket.productList;
    this.locationSubject.next(index);
  }

  calcTotal(sales: Array<StoreSale>): number {
    let total = 0;

    sales.forEach(el => {
      total = total + el.ticket.total;
    });

    return total
  }

  downloadXls(sales: any): void {
    // 
  }

}
