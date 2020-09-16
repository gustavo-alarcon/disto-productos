import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DatabaseService } from 'src/app/core/services/database.service';
import { Observable, combineLatest } from 'rxjs';
import { User } from 'src/app/core/models/user.model';
import { map, startWith, take, tap } from 'rxjs/operators';
import { DataSource } from '@angular/cdk/table';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { AuthService } from 'src/app/core/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { CustomersEditComponent } from './customers-edit/customers-edit.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomersDeleteComponent } from './customers-delete/customers-delete.component';

import * as XLSX from 'xlsx';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent implements OnInit {

  searchFormControl: FormControl;
  search$: Observable<string>;

  customers$: Observable<Array<User>>;
  users$: Observable<Array<User>>;

  //Table
  customersDataSource = new MatTableDataSource<User>();
  customersDisplayedColumns: string[] = [
    'index', 'email', 'displayName', 'dni', 'phone', 'address', 'district',
    'salesCount', 'actions'
  ];

  @ViewChild('customersPaginator', { static: false }) set content(paginator1: MatPaginator) {
    this.customersDataSource.paginator = paginator1;
  }

  constructor(
    public dbs: DatabaseService,
    public auth: AuthService,
    private dialog: MatDialog,
    private snackbar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.dbs.changeTitle('Lista de clientes');

    this.users$ = this.dbs.getUsers();

    this.searchFormControl = new FormControl('');
    this.search$ = this.searchFormControl.valueChanges;

    this.customers$ = combineLatest(
      this.search$.pipe(startWith('')),
      this.users$
    ).pipe(
      map(([searchTerm, users]) => {
        let search = searchTerm.toLowerCase()
        let filteredUsers = users.filter(user => {
          if (user) {
            return user.completeName?.toLowerCase().includes(search) ||
              user.displayName?.toLowerCase().includes(search) ||
              user.name?.toLowerCase().includes(search) ||
              user.lastName1?.toLowerCase().includes(search) ||
              user.lastName2?.toLowerCase().includes(search) ||
              user.dni?.toString().includes(search) ||
              user.email?.toLowerCase().includes(search)
          } else {
            return false
          }

        });

        this.customersDataSource.data = filteredUsers;

        return filteredUsers
      })
    )
  }

  downloadXls(): void {
    let table_xlsx: any[] = [];
    let headersXlsx = [
      'Correo', 'Nombre completo', 'DNI', 'Teléfono', 'Dirección', 'Referencia', 'Distrito', 'Pedidos'
    ]

    table_xlsx.push(headersXlsx);

    this.customersDataSource.filteredData.forEach(customer => {
      const temp = [
        customer.email ? customer.email : '-',
        customer.completeName ? customer.completeName.toLowerCase() : (customer.displayName ? customer.displayName.toLowerCase() : '-'),
        customer.dni ? customer.dni : '-',
        customer.contact?.phone ? customer.contact?.phone : '-',
        customer.contact?.address ? customer.contact?.address.toLowerCase() : '-',
        customer.contact?.reference ? customer.contact?.reference.toLowerCase() : '-',
        customer.contact?.district?.name ? customer.contact?.district?.name.toLowerCase() : '-',
        customer.salesCount ? customer.salesCount : '-',
      ];

      table_xlsx.push(temp);
    })

    /* generate worksheet */
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(table_xlsx);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lista_de_usuarios');

    /* save to file */
    const name = 'Lista_de_usuarios' + '.xlsx';
    XLSX.writeFile(wb, name);
  }

  editUser(user: User): void {
    this.dialog.open(CustomersEditComponent, {
      data: user
    }).afterClosed().pipe(
      take(1),
      tap(res => {
        if (res) {
          this.snackbar.open('🎉 Usuario editado satisfactoriamente', 'Aceptar', {
            duration: 6000
          })
        }
      })
    )
  }

  suspendUser(user: User): void {
    // pass
  }

  deleteUser(user: User): void {
    this.dialog.open(CustomersDeleteComponent, {
      data: user
    }).afterClosed().pipe(
      take(1),
      tap(res => {
        if (res) {
          this.snackbar.open('🗑 Usuario borrado', 'Aceptar', {
            duration: 6000
          })
        }
      })
    )
  }

}
