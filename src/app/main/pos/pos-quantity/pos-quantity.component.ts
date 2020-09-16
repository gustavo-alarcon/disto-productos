import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-pos-quantity',
  templateUrl: './pos-quantity.component.html',
  styleUrls: ['./pos-quantity.component.scss']
})
export class PosQuantityComponent implements OnInit {

  quantityFormControl = new FormControl();

  constructor(
    private dialogRef: MatDialogRef<PosQuantityComponent>
  ) { }

  ngOnInit(): void {
  }

  save(): void {
    this.dialogRef.close(parseFloat(this.quantityFormControl.value));
  }

  close(): void {
    this.dialogRef.close();
  }

}
