import { Component, OnInit, Inject } from '@angular/core';
import { DocumentReference, AngularFirestore } from '@angular/fire/firestore';
import { AbstractControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { map } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-provider-dialog',
  templateUrl: './provider-dialog.component.html',
  styleUrls: ['./provider-dialog.component.scss']
})
export class ProviderDialogComponent implements OnInit {
  loading = new BehaviorSubject<boolean>(false)
  loading$ = this.loading.asObservable()

  providerForm: FormGroup

  constructor(
    private dialogRef: MatDialogRef<ProviderDialogComponent>,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private afs: AngularFirestore,
    private dbs: DatabaseService,
    @Inject(MAT_DIALOG_DATA) public data: { item: any, edit: boolean, index: number }
  ) { }

  ngOnInit(): void {
    if (this.data.edit) {
      this.providerForm = this.fb.group({
        name: [this.data.item.name, Validators.required],
        ruc: [this.data.item.ruc, Validators.required]
      })
    } else {
      this.providerForm = this.fb.group({
        name: [null, [Validators.required], [this.repeatedValidator()]],
        ruc: [null, Validators.required]
      })
    }

    this.providerForm.valid
  }

  repeatedValidator() {
    return (control: AbstractControl) => {
      const value = control.value.toLowerCase();
      return this.dbs.getProvidersDoc().pipe(
        map(res => {
          if (res) {
            return res.findIndex(el => el['name'].toLowerCase() == value) >= 0 ? { repeatedValidator: true } : null
          } else {
            return null
          }

        }))
    }
  }




  create(categorie) {
    const payRef: DocumentReference = this.afs.firestore.collection(`/db/distoProductos/config/`).doc('generalConfig');
    return this.afs.firestore.runTransaction((transaction) => {
      return transaction.get(payRef).then((doc) => {
        if (!doc.exists) {
          transaction.set(payRef, { providers: [] });
        }

        const providers = doc.data().providers ? doc.data().providers : [];
        providers.unshift(categorie);
        transaction.update(payRef, { providers: providers });
      });

    }).then(() => {
      this.dialogRef.close(true);
      this.snackBar.open("Elemento guardado", "Cerrar", {
        duration: 4000
      })
      this.loading.next(false)
    }).catch(function (error) {
      console.log("Transaction failed: ", error);
    });


  }

  editBanner(category) {
    const payRef: DocumentReference = this.afs.firestore.collection(`/db/distoProductos/config/`).doc('generalConfig');

    return this.afs.firestore.runTransaction((transaction) => {
      // This code may get re-run multiple times if there are conflicts.
      return transaction.get(payRef).then((doc) => {
        if (!doc.exists) {
          transaction.set(payRef, { providers: [] });
        }

        const providers = doc.data().providers ? doc.data().providers : [];

        let ind = providers.findIndex(el => el.name == this.data.item.name)
        providers[ind] = category
        transaction.update(payRef, { providers: providers });

      });

    }).then(() => {
      this.dialogRef.close(true)
      this.loading.next(false)
      this.snackBar.open("Elemento editado", "Cerrar", {
        duration: 4000
      })
    }).catch(function (error) {
      console.log("Transaction failed: ", error);
    });


  }

  save() {
    this.providerForm.markAsPending();
    this.providerForm.disable()
    this.loading.next(true)

    let newCategory = {
      name: this.providerForm.value['name'],
      ruc: this.providerForm.value['ruc']
    }

    if (this.data.edit) {
      this.editBanner(newCategory)
    } else {
      this.create(newCategory)
    }

  }


}
