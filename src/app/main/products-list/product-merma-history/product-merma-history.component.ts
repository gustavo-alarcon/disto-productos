import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { DatePipe } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MermaTransfer, Product } from 'src/app/core/models/product.model';
import { DatabaseService } from 'src/app/core/services/database.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';



@Component({
  selector: 'app-product-merma-history',
  templateUrl: './product-merma-history.component.html',
  styles: []
})
export class ProductMermaHistoryComponent implements OnInit {

  loadingHistory = new BehaviorSubject<boolean>(false);
  loadingHistory$ = this.loadingHistory.asObservable();

  displayedColumns: string[] = ['index', 'date', 'status', 'quantity', 'createdBy', 'observations'];
  dataSource = new MatTableDataSource<MermaTransfer>();
  @ViewChild(MatPaginator, { static: false }) set content(paginator1: MatPaginator) {
    this.dataSource.paginator = paginator1;
  }

  history$: Observable<MermaTransfer[]>;

  constructor(
    public dbs: DatabaseService,
    private datePipe: DatePipe,
    @Inject(MAT_DIALOG_DATA) public data: {
      product: Product
    }
  ) { }

  ngOnInit() {
    this.history$ = this.observeHistory(this.data.product.id).pipe(shareReplay(1));
  }

  observeHistory(id: string): Observable<MermaTransfer[]> {
    this.loadingHistory.next(true);
    const history$ =
      this.dbs.getMermaTransferHistory(id)
        .pipe(
          tap(res => {
            this.dataSource.data = [...res];
            this.loadingHistory.next(false);
          })
        )
    return history$;
    
  }

  downloadXls(): void {
    let mermaTransfer: MermaTransfer[] = this.dataSource.data

    let table_xlsx: any[] = [];
    let headersXlsx = [
      'Fecha/hora de movimiento', 'Estado', 
      'Cantidad', 'Usuario', 'Observaciones'
    ]

    table_xlsx.push(headersXlsx);

    mermaTransfer.forEach(trans => {
      const temp = [
        this.datePipe.transform(trans.date['seconds'] * 1000, 'dd/MM/yyyy(hh:mm:ss)'),
        trans.toMerma ? "Desde stock a merma" : "Desde merma a stock",
        trans.quantity,
        trans.user.displayName,
        trans.observations
      ];

      table_xlsx.push(temp);
    })

    /* generate worksheet */
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(table_xlsx);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `historial`);

    /* save to file */
    const name = 'historial_de_producto_'+this.data.product.description+ '.xlsx';
    XLSX.writeFile(wb, name);
  }

}
