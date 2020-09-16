import { Component, OnInit } from '@angular/core';
import { Observable, EMPTY } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { Router, RouteConfigLoadStart, RouteConfigLoadEnd } from '@angular/router';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-logistics',
  templateUrl: './logistics.component.html',
  styleUrls: ['./logistics.component.scss']
})
export class LogisticsComponent implements OnInit {
  loading$: Observable<boolean>

  links = [
    { name: 'Fábrica', route: 'fabric' },   
    { name: 'Devoluciones', route: 'returns' }
  ];

  activeLink = this.links[0];

  constructor(
    private router: Router,
    private dbs: DatabaseService
  ) { }

  ngOnInit(): void {
    this.dbs.changeTitle('Logística');
    
    this.loading$ = this.router.events.pipe(
      filter(event => event instanceof RouteConfigLoadStart||event instanceof RouteConfigLoadEnd ),
      map(event => {
        if (event instanceof RouteConfigLoadStart) {
          return true;
        }
        if (event instanceof RouteConfigLoadEnd) {
          return false;
        }
      })
    )
  }
}
