import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-change-stock',
  templateUrl: './change-stock.component.html',
  styleUrls: ['./change-stock.component.scss']
})
export class ChangeStockComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { productos:Array<{product:string,stock:number}> },
  ) { }

  ngOnInit(): void {
  }

}
