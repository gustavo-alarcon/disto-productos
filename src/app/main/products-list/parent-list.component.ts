import { Component, OnInit } from '@angular/core';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-parent-list',
  templateUrl: './parent-list.component.html',
  styleUrls: ['./parent-list.component.scss']
})
export class ParentListComponent implements OnInit {

  constructor(
    private dbs: DatabaseService
  ) { }

  ngOnInit(): void {
    this.dbs.changeTitle('Lista de productos');
  }

}
