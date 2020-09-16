import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';
import { FormControl } from '@angular/forms';
import { DatabaseService } from 'src/app/core/services/database.service';
import { Ticket } from 'src/app/core/models/ticket.model';
import { Product } from 'src/app/core/models/product.model';
import { tap } from 'rxjs/internal/operators/tap';
import { MatDialog } from '@angular/material/dialog';
import { PosQuantityComponent } from './pos-quantity/pos-quantity.component';
import { take, switchMap, startWith, map } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { PosFinishComponent } from './pos-finish/pos-finish.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Platform } from '@angular/cdk/platform';
import { AngularFirestore } from '@angular/fire/firestore';
import { ProductCreateEditComponent } from '../products-list/product-create-edit/product-create-edit.component';

@Component({
  selector: 'app-pos',
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class PosComponent implements OnInit {

  displayedColumns: string[] = ['product', 'price', 'quantity', 'total', 'actions'];
  dataSource = new MatTableDataSource<{ product: Product, quantity: number }>();

  selected = new FormControl(0);
  search = new FormControl('');

  productList$: Observable<Array<Product>>;
  productList: Array<Product> = [];

  options$: Observable<Array<Product>>;

  tickets$: Observable<Array<Ticket>>;

  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();


  constructor(
    public auth: AuthService,
    public dbs: DatabaseService,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private af: AngularFirestore,
    public platform: Platform
  ) { }

  ngOnInit(): void {
    this.dbs.changeTitle('Punto de Venta');

    this.productList$ =
      this.dbs.getProductsListValueChanges()
        .pipe(
          tap(res => {
            if (res) {
              this.productList = res;
            }
          })
        )

    this.auth.user$
      .pipe(
        switchMap(user => {
          return this.dbs.getUserTickets(user.uid).pipe(
            tap(tickets => {
              this.dbs.tabs = [...tickets];

              if (this.dbs.tabs.length > 0) {
                this.dataSource.data = this.dbs.tabs[this.selected.value].productList;
              }

            })
          )
        })
      ).pipe(
        take(1)
      )
      .subscribe()

    this.options$ = combineLatest(
      this.search.valueChanges.pipe(startWith('')),
      this.productList$
    ).pipe(
      map(([search, productList]) => {
        let term: string = search.toString().toLowerCase().trim();
        if (term === '') {
          return []
        } else {
          let options = productList.filter(el => el.description.toLowerCase().includes(term) || el.sku.toLowerCase().includes(term));
          return options
        }
      })
    )
  }

  showOption(product: Product): string | null {
    return product.sku ? product.sku : null;
  }

  playSuccessAudio() {
    let audio = new Audio();
    audio.src = "../../../assets/audio/good.mp3";
    audio.load();
    audio.play();
  }

  playErrorAudio() {
    let audio = new Audio();
    audio.src = "../../../assets/audio/bad.mp3";
    audio.load();
    audio.play();
  }

  setTab(index: number): void {
    this.selected.setValue(index);
    if (this.dbs.tabs.length > 0) {
      this.dataSource.data = this.dbs.tabs[this.selected.value].productList;
    }
  }

  addTicket() {
    this.loading.next(true);
    setTimeout(() => {
      this.auth.user$
        .pipe(
          take(1)
        )
        .subscribe(user => {
          let userTicketRef = this.af.firestore.collection(`/users/${user.uid}/tickets`).doc();

          let batch = this.af.firestore.batch();

          this.dbs.tabCounter++;

          let newTicket: Ticket = {
            index: this.dbs.tabCounter,
            productList: [],
            total: 0
          }

          this.dbs.tabs.push(newTicket);

          // setTimeout(() => {
          this.selected.setValue(this.dbs.tabs.length - 1);
          // }, 200);

          this.dbs.tabs[this.selected.value].id = userTicketRef.id;

          batch.set(userTicketRef, this.dbs.tabs[this.selected.value]);

          batch.commit()
            .then(() => {
              // console.log(this.selected.value);

              this.dataSource.data = this.dbs.tabs[this.selected.value].productList;


              this.snackbar.open("Ticket creado", "Aceptar", {
                duration: 3000
              });
              this.loading.next(false);
            })
            .catch(err => {
              console.log(err);
              this.snackbar.open("Hubo un error guardando el ticket");
            });
        })
    }, 200);
    // Saving tickets in database

  }

  removeTicket(index: number) {
    this.loading.next(true);
    // Updating tickets in database

    this.auth.user$
      .pipe(
        take(1)
      )
      .subscribe(user => {
        // let userTicketRef = this.af.firestore.collection(`/users/${user.uid}/tickets`).doc(this.dbs.tabs[this.selected.value].id);
        this.af.firestore.collection(`/users/${user.uid}/tickets`).doc(this.dbs.tabs[this.selected.value].id)
          .delete()
          .then(() => {
            this.dbs.tabs.splice(index, 1);
            if (this.dbs.tabs.length > 0) {
              this.selected.setValue(this.dbs.tabs.length - 1);
            }

            this.snackbar.open("Ticket borrado", "Aceptar", {
              duration: 3000
            });
            this.loading.next(false);
          })
          .catch(err => {
            console.log(err);
            this.snackbar.open("Hubo un error guardando el ticket");
          });

        // let batch = this.af.firestore.batch();

        // batch.delete(userTicketRef);

        // batch.commit()
        //   .then(() => {

        //     this.dbs.tabs.splice(index, 1);
        //     if (this.dbs.tabs.length > 0) {
        //       this.selected.setValue(this.dbs.tabs.length - 1);
        //     }

        //     this.snackbar.open("Ticket borrado", "Aceptar", {
        //       duration: 3000
        //     });
        //     this.loading.next(false);
        //   })
        //   .catch(err => {
        //     console.log(err);
        //     this.snackbar.open("Hubo un error guardando el ticket");
        //   });
      })
  }

  finishTicket(): void {
    if (this.dbs.tabs[this.selected.value].productList.length < 1) {
      return
    }

    this.dialog.open(PosFinishComponent, {
      data: this.dbs.tabs[this.selected.value]
    }).afterClosed()
      .pipe(
        take(1),
        tap(res => {
          if (res) {
            this.snackbar.open("Ticket finalizado exitosamente!", "Aceptar", {
              duration: 6000
            });

            this.dbs.tabs[this.selected.value].status = 'Pagado';

            this.removeTicket(this.selected.value);
            this.addTicket();
          }
        })
      ).subscribe()
  }

  addProduct(): void {

    if (this.dbs.tabs.length === 0) {
      this.snackbar.open("Agregando nuevo ticket", "Aceptar", {
        duration: 6000
      });

      this.addTicket();

      setTimeout(() => {
        this.addProduct();
      }, 1000);

      return;
    }

    if (!this.search.value) {
      this.snackbar.open("Debe escanear o escribir el código/nombre del producto", "Aceptar", {
        duration: 6000
      });
      return;
    }

    // search if product already exist in basket
    let foundIndex = -1;
    let basketArray = this.dbs.tabs[this.selected.value].productList;

    let search = this.search.value.sku ? this.search.value.sku : this.search.value;

    // Loop over to find the index if product already exist
    for (let i = 0; i < basketArray.length; i++) {
      if (basketArray[i].product.sku === search) {
        foundIndex = i;
        break;
      }
    }

    if (foundIndex > -1) {
      // Ok, is already in basket, just add one more
      if (basketArray[foundIndex].product.saleType !== '2') {
        basketArray[foundIndex].quantity++;
      } else {
        this.dialog.open(PosQuantityComponent)
          .afterClosed()
          .pipe(take(1))
          .subscribe(qty => {
            basketArray[foundIndex].quantity = basketArray[foundIndex].quantity + qty;
          })
      }


      // Update total ticket price
      this.updateTicketPrice();

      // Updating tickets in database
      this.auth.user$
        .pipe(
          take(1)
        )
        .subscribe(user => {
          let userTicketRef = this.af.firestore.collection(`/users/${user.uid}/tickets`).doc(this.dbs.tabs[this.selected.value].id);

          let batch = this.af.firestore.batch();

          batch.update(userTicketRef, { productList: this.dbs.tabs[this.selected.value].productList, total: this.dbs.tabs[this.selected.value].total });

          batch.commit()
            .then(() => {
              this.snackbar.open("Producto agregado", "Aceptar", {
                duration: 3000
              });
              this.playSuccessAudio();
              this.loading.next(false);
            })
            .catch(err => {
              console.log(err);
              this.snackbar.open("Hubo un error guardando el ticket");
            });
        })

    } else {
      // Let's put one in the basket
      // search for sku in product list
      let productResult = this.productList.filter(el => el.sku === search);

      if (productResult.length > 0) {

        if (productResult[0].saleType !== '2') {
          // Push product first in the list
          this.dbs.tabs[this.selected.value].productList.unshift({ product: productResult[0], quantity: 1 });

          // Update total ticket price
          this.updateTicketPrice();

          // Update data table
          this.dataSource.data = this.dbs.tabs[this.selected.value].productList;

          // Updating tickets in database
          this.auth.user$
            .pipe(
              take(1)
            )
            .subscribe(user => {
              let userTicketRef = this.af.firestore.collection(`/users/${user.uid}/tickets`).doc(this.dbs.tabs[this.selected.value].id);

              let batch = this.af.firestore.batch();

              batch.update(userTicketRef, { productList: this.dbs.tabs[this.selected.value].productList, total: this.dbs.tabs[this.selected.value].total });

              batch.commit()
                .then(() => {
                  this.snackbar.open("Producto agregado", "Aceptar", {
                    duration: 3000
                  });
                  this.playSuccessAudio();
                  this.loading.next(false);
                })
                .catch(err => {
                  console.log(err);
                  this.snackbar.open("Hubo un error guardando el ticket");
                });
            })

        } else {
          this.dialog.open(PosQuantityComponent)
            .afterClosed()
            .pipe(take(1))
            .subscribe(qty => {
              // Push product first in the list
              this.dbs.tabs[this.selected.value].productList.unshift({ product: productResult[0], quantity: qty });

              // Update total ticket price
              this.updateTicketPrice();

              // Update data table
              this.dataSource.data = this.dbs.tabs[this.selected.value].productList;

              // Updating tickets in database
              this.auth.user$
                .pipe(
                  take(1)
                )
                .subscribe(user => {
                  let userTicketRef = this.af.firestore.collection(`/users/${user.uid}/tickets`).doc(this.dbs.tabs[this.selected.value].id);

                  let batch = this.af.firestore.batch();

                  batch.update(userTicketRef, { productList: this.dbs.tabs[this.selected.value].productList, total: this.dbs.tabs[this.selected.value].total });

                  batch.commit()
                    .then(() => {
                      this.snackbar.open("Producto agregado", "Aceptar", {
                        duration: 3000
                      });
                      this.playSuccessAudio();
                      this.loading.next(false);
                    })
                    .catch(err => {
                      console.log(err);
                      this.snackbar.open("Hubo un error guardando el ticket");
                    });
                })
            })
        }



      } else {
        this.snackbar.open("Producto NO REGISTRADO", "Aceptar", {
          duration: 4000
        });
        this.playErrorAudio();
        this.dialog.open(ProductCreateEditComponent, {
          data: {
            data: null,
            edit: false
          }
        }).afterClosed()
          .pipe(take(1))
          .subscribe(res => {
            if (res) {
              setTimeout(() => {
                this.addProduct();
              }, 1000);
            }

            this.search.setValue('');
          })

        return;
      }
    }

    // Clean search input
    this.search.setValue('');



  }

  editItem(index: number): void {
    this.dialog.open(PosQuantityComponent)
      .afterClosed()
      .pipe(
        take(1),
        tap(qty => {
          if (qty) {
            this.dbs.tabs[this.selected.value].productList[index].quantity = qty;

            this.updateTicketPrice();

            this.dataSource.data = this.dbs.tabs[this.selected.value].productList;
          }
        })
      ).subscribe()
  }

  updateTicketPrice(): void {
    let total = 0;

    this.dbs.tabs[this.selected.value].productList.forEach(el => {
      total = total + (el.quantity * el.product.price);
    });

    this.dbs.tabs[this.selected.value].total = total;
  }

  checkStock(product: Product, isAdding: boolean): boolean {
    if (isAdding) {
      let actualStock
    }

    return
  }

  addQuantity(index: number): void {
    this.loading.next(true);

    // Updating tickets in database
    this.auth.user$
      .pipe(
        take(1)
      )
      .subscribe(user => {

        if (this.dbs.tabs[this.selected.value].productList[index].product.saleType !== '2') {
          // Add product's quantity
          this.dbs.tabs[this.selected.value].productList[index].quantity++;

          // Update total ticket price
          this.updateTicketPrice();

          // Update data table
          this.dataSource.data = this.dbs.tabs[this.selected.value].productList;

          let userTicketRef = this.af.firestore.collection(`/users/${user.uid}/tickets`).doc(this.dbs.tabs[this.selected.value].id);

          let batch = this.af.firestore.batch();

          batch.update(userTicketRef, { productList: this.dbs.tabs[this.selected.value].productList, total: this.dbs.tabs[this.selected.value].total });

          batch.commit()
            .then(() => {
              this.snackbar.open("Producto agregado", "Aceptar", {
                duration: 3000
              });
              this.loading.next(false);
            })
            .catch(err => {
              console.log(err);
              this.snackbar.open("Hubo un error guardando el ticket");
            });

        } else {
          this.dialog.open(PosQuantityComponent)
            .afterClosed()
            .pipe(take(1))
            .subscribe(qty => {
              console.log(qty);
              if (qty) {
                // Add product's quantity
                this.dbs.tabs[this.selected.value].productList[index].quantity = this.dbs.tabs[this.selected.value].productList[index].quantity + qty;

                // Update total ticket price
                this.updateTicketPrice();

                // Update data table
                this.dataSource.data = this.dbs.tabs[this.selected.value].productList;

                let userTicketRef = this.af.firestore.collection(`/users/${user.uid}/tickets`).doc(this.dbs.tabs[this.selected.value].id);

                let batch = this.af.firestore.batch();

                batch.update(userTicketRef, { productList: this.dbs.tabs[this.selected.value].productList, total: this.dbs.tabs[this.selected.value].total });

                batch.commit()
                  .then(() => {
                    this.snackbar.open("Producto agregado", "Aceptar", {
                      duration: 3000
                    });
                    this.loading.next(false);
                  })
                  .catch(err => {
                    console.log(err);
                    this.snackbar.open("Hubo un error guardando el ticket");
                  });
              } else {
                this.snackbar.open("Debe asignar una cantidad", "Aceptar", {
                  duration: 3000
                });
                this.loading.next(false);
              }

            })
        }


      })
  }

  removeQuantity(index: number): void {
    this.loading.next(true);

    // Updating tickets in database
    this.auth.user$
      .pipe(
        take(1)
      )
      .subscribe(user => {

        if (this.dbs.tabs[this.selected.value].productList[index].product.saleType !== '2') {
          // Add product's quantity
          this.dbs.tabs[this.selected.value].productList[index].quantity--;
          // Update total ticket price
          this.updateTicketPrice();

          // Update data table
          this.dataSource.data = this.dbs.tabs[this.selected.value].productList;

          let userTicketRef = this.af.firestore.collection(`/users/${user.uid}/tickets`).doc(this.dbs.tabs[this.selected.value].id);

          let batch = this.af.firestore.batch();

          batch.update(userTicketRef, { productList: this.dbs.tabs[this.selected.value].productList, total: this.dbs.tabs[this.selected.value].total });

          batch.commit()
            .then(() => {
              this.snackbar.open("Producto restado", "Aceptar", {
                duration: 3000
              });
              this.loading.next(false);
            })
            .catch(err => {
              console.log(err);
              this.snackbar.open("Hubo un error guardando el ticket");
              this.loading.next(false);
            });
        } else {
          this.dialog.open(PosQuantityComponent)
            .afterClosed()
            .pipe(take(1))
            .subscribe(qty => {

              if (qty) {
                // Add product's quantity
                this.dbs.tabs[this.selected.value].productList[index].quantity = this.dbs.tabs[this.selected.value].productList[index].quantity - qty;

                // Update total ticket price
                this.updateTicketPrice();

                // Update data table
                this.dataSource.data = this.dbs.tabs[this.selected.value].productList;

                let userTicketRef = this.af.firestore.collection(`/users/${user.uid}/tickets`).doc(this.dbs.tabs[this.selected.value].id);

                let batch = this.af.firestore.batch();

                batch.update(userTicketRef, { productList: this.dbs.tabs[this.selected.value].productList, total: this.dbs.tabs[this.selected.value].total });

                batch.commit()
                  .then(() => {
                    this.snackbar.open("Producto restado", "Aceptar", {
                      duration: 3000
                    });
                    this.loading.next(false);
                  })
                  .catch(err => {
                    console.log(err);
                    this.snackbar.open("Hubo un error guardando el ticket");
                    this.loading.next(false);
                  });
              } else {
                this.snackbar.open("Debe asignar una cantidad", "Aceptar", {
                  duration: 3000
                });
                this.loading.next(false);
              }

            })
        }


      })
  }

  removeItem(index: number): void {
    this.loading.next(true);

    this.dbs.tabs[this.selected.value].productList.splice(index, 1);

    // Update total ticket price
    this.updateTicketPrice();

    this.dataSource.data = this.dbs.tabs[this.selected.value].productList;

    // Updating tickets in database
    this.auth.user$
      .pipe(
        take(1)
      )
      .subscribe(user => {
        let userTicketRef = this.af.firestore.collection(`/users/${user.uid}/tickets`).doc(this.dbs.tabs[this.selected.value].id);

        let batch = this.af.firestore.batch();

        batch.update(userTicketRef, { productList: this.dbs.tabs[this.selected.value].productList, total: this.dbs.tabs[this.selected.value].total });

        batch.commit()
          .then(() => {
            this.snackbar.open("Producto retirado", "Aceptar", {
              duration: 3000
            });
            this.loading.next(false);
          })
          .catch(err => {
            console.log(err);
            this.snackbar.open("Hubo un error guardando el ticket");
          });
      })
  }

}
