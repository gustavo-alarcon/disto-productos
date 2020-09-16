import { Injectable } from '@angular/core';
import { CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { DatabaseService } from './services/database.service';
import { tap } from 'rxjs/internal/operators/tap';
import { map, switchMap, take, shareReplay } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from './services/auth.service';
import { StoreClosedDialogComponent } from '../shared-dialogs/store-closed-dialog/store-closed-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class OpeningGuard implements CanActivateChild {

  daysArray: Array<string> = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo'
  ];

  constructor(
    private router: Router,
    private dbs: DatabaseService,
    private auth: AuthService,
    private snackbar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  timeConverter(hours: number, minutes: number, seconds: number): number {
    let h = hours;
    let m = minutes * (1 / 60);
    let s = seconds * (1 / 3600);

    return h + m + s;
  }

  canActivateChild(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.auth.user$.pipe(
      switchMap(user => {
        return this.dbs.opening$.pipe(
          map(res => {

            // Conditioning the system based in opening and closing time
            let isOpen = false;

            if (user?.admin || user?.seller || user?.accountant || user?.logistic) {
              // console.log('is admin');
              this.dbs.isAdmin = true;
              isOpen = true;
            } else {
              // console.log('is not admin')
              this.dbs.isAdmin = false;
              
              // Calculating the actual decimal time based in hours
              let now = new Date();
              let day = now.getDay();
              let dayIndex = (day - 1) < 0 ? 6 : (day - 1);
              let hours = now.getHours();
              let minutes = now.getMinutes();
              let seconds = now.getSeconds();

              let time = this.timeConverter(hours, minutes, seconds);

              // Getting the opening time for the actual day and calculating the time
              let opening_hours = parseInt(res[dayIndex]['opening'].split(':')[0]);
              let opening_minutes = parseInt(res[dayIndex]['opening'].split(':')[1]);

              let opening_time = this.timeConverter(opening_hours, opening_minutes, 0);

              let closing_hours = parseInt(res[dayIndex]['closing'].split(':')[0]);
              let closing_minutes = parseInt(res[dayIndex]['closing'].split(':')[1]);

              let closing_time = this.timeConverter(closing_hours, closing_minutes, 0);



              if (time >= opening_time && time <= closing_time) {
                isOpen = true;
              } else {
                if (time < opening_time) {
                  // this.snackbar.open(`😢 Lo sentimos cheese lover 💚, comenzaremos a tomar pedidos de ⌚ ${res[day - 1]['opening']} a ${res[day - 1]['closing']}`, 'Aceptar')
                  this.dialog.open(StoreClosedDialogComponent)
                    .afterClosed()
                    .subscribe(res => {
                      this.dialog.closeAll()
                    })
                }

                if (time > closing_time) {
                  //check for availability on next day
                  let found = false;
                  let next_opening_hours;
                  let next_opening_minutes;
                  let next_opening_time;

                  while (!found) {
                    dayIndex = (dayIndex + 1) % 7;

                    next_opening_hours = parseInt(res[dayIndex]['opening'].split(':')[0]);
                    next_opening_minutes = parseInt(res[dayIndex]['opening'].split(':')[1]);

                    next_opening_time = this.timeConverter(next_opening_hours, next_opening_minutes, 0);


                    if (next_opening_time > 0) {
                      // console.log('Found ' + dayIndex);
                      found = true;
                    }
                  }

                  // this.snackbar.open(`😢 Lo sentimos cheese lover 💚, estaremos tomando pedidods el 📅 ${this.daysArray[dayIndex]} de ⌚ ${res[dayIndex]['opening']} a ${res[dayIndex]['closing']}`, 'Aceptar')
                  this.dialog.open(StoreClosedDialogComponent)
                    .afterClosed()
                    .subscribe(res => {
                      this.dialog.closeAll()
                    })
                }

                isOpen = false;
              }
            }

            this.dbs.isOpen = isOpen;

            return true;
          }),
          // tap(res => {
          //   this.dbs.isOpen = res;

          //   // if (!res) {
          //   //   console.log('main');
          //   //   this.router.navigate(['/login']);
          //   // }

          // })
        );
      })
    )

  }

}
