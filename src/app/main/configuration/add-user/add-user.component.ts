import { User } from 'src/app/core/models/user.model';
import { AngularFirestore, DocumentReference } from '@angular/fire/firestore';
import { take, map, filter, startWith } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatabaseService } from 'src/app/core/services/database.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { FormGroup, FormBuilder, Validators, AbstractControl, FormControl } from '@angular/forms';
import { Component, OnInit, Inject } from '@angular/core';

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss']
})
export class AddUserComponent implements OnInit {
  loading = new BehaviorSubject<boolean>(false)
  loading$ = this.loading.asObservable()

  userForm: FormGroup

  permits: Array<string> = ['Administrador', 'Vendedora', 'Logística', 'Contabilidad']

  filteredUsers$: Observable<User[]>;

  selectedUser: User

  constructor(
    private dialogRef: MatDialogRef<AddUserComponent>,
    private fb: FormBuilder,
    private dbs: DatabaseService,
    private snackBar: MatSnackBar,
    private afs: AngularFirestore,
    @Inject(MAT_DIALOG_DATA) public data: { item: any, edit: boolean }
  ) { }

  ngOnInit(): void {
    this.userForm = this.fb.group({
      email: [null, [Validators.required], [this.emailRepeatedValidator()]],
      name: [null, Validators.required],
      lastname: [null, Validators.required],
      permits: [null, Validators.required]
    })

    this.filteredUsers$ = combineLatest(
      this.dbs.getUsers(),
      this.userForm.get('email').valueChanges.pipe(
        filter(input => input !== null),
        startWith<any>(''),
        map(value => typeof value === 'string' ? value.toLowerCase() : value.email.toLowerCase()))
    ).pipe(
      map(([users, name]) => {
        let noAdmins = users.filter(el => !el['role']).map(user=>{
          let name = '---'
          let email = ""
          if(user['completeName']){
            name=user['completeName']
          } else {
            if(user['displayName']){
              name=user['displayName']
            }
          }
          user['completeName'] = name

          if(user['email']){
            email=user['email']
          }

          user['email'] = email
          return user
        })
        return name ? noAdmins.filter(option => option['email'].toLowerCase().includes(name)||option['completeName'].toLowerCase().includes(name)) : noAdmins;
      })
    );

  }

  selectUser(option: User) {
    this.selectedUser = option
    if (option.name) {
      this.userForm.get('name').setValue(option.name)
      this.userForm.get('lastname').setValue(option.lastName1)
    } else {
      if (option.displayName) {
        this.userForm.get('name').setValue(option.displayName)
        this.userForm.get('lastname').setValue(null)
      }
    }

  }

  save() {
    this.userForm.markAsPending();
    this.userForm.disable();
    this.loading.next(true);
    const ref: DocumentReference = this.afs.firestore.collection(`users`).doc(this.selectedUser.uid);
    const batch = this.afs.firestore.batch();

    let updateData = {
      completeName: this.userForm.value['name'].split(" ", 1)[0] + ' ' + this.userForm.value['lastname'].split(" ", 1)[0],
      name: this.userForm.get('name').value,
      lastName1: this.userForm.get('lastname').value,
      role: this.userForm.get('permits').value,
      admin: true,
      seller: this.userForm.get('permits').value == 'Vendedora',
      logistic: this.userForm.get('permits').value == 'Logística',
      accountant: this.userForm.get('permits').value == 'Contabilidad',
      confi: this.userForm.get('permits').value == 'Administrador'
    }

    batch.update(ref, updateData)

    batch.commit()
      .then(() => {
        this.loading.next(false)
        this.dialogRef.close();
        this.snackBar.open("Usuario agregado!", "Cerrar");
      })
      .catch(err => {
        console.log(err);
        this.snackBar.open("Ups! parece que hubo un error ...", "Cerrar");
      })
  }

  showSelectedUser(staff): string | undefined {
    return staff ? staff['email'] : undefined;
  }

  emailRepeatedValidator() {
    return (control: AbstractControl) => {
      const value = control.value;
      if (typeof value == 'string') {
        return of({ emailRepeatedValidator: true })
      } else {
        return of(null)
      }
    }
  }



}
