import { DatabaseService } from 'src/app/core/services/database.service';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormControl, ValidationErrors } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, startWith, tap, debounceTime, take, switchMap, mapTo } from 'rxjs/operators';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from 'src/app/core/services/auth.service';
import { Observable, of, combineLatest, BehaviorSubject } from 'rxjs';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-login-dialog',
  templateUrl: './login-dialog.component.html',
  styleUrls: ['./login-dialog.component.scss']
})
export class LoginDialogComponent implements OnInit {
  version: string
  auth$: Observable<any>
  dataFormGroup: FormGroup;

  registerLogin$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false) //true when email already exist, so you need to login

  hidePass: boolean = true;

  register: boolean = false

  registerForm = new FormControl(false)
  register$: Observable<boolean>

  constructor(
    public auth: AuthService,
    private dbs: DatabaseService,
    private snackbar: MatSnackBar,
    private fb: FormBuilder,
    private dialogref: MatDialogRef<LoginDialogComponent>,
  ) { }

  ngOnInit() {
    this.version = this.dbs.version;

    this.dataFormGroup = this.fb.group({
      email: [null, [Validators.required, Validators.email], [this.emailRepeatedValidator()]],
      pass: [null, [Validators.required, Validators.minLength(6)]]
    });

    this.auth$ = this.auth.user$.pipe(
      map(user => {
        if (user) {
          this.dialogref.close(true)
          return true
        } else {
          return false
        }
      })
    )

  }

  login(): void {
    this.auth.signInEmail(this.dataFormGroup.get('email').value, this.dataFormGroup.get('pass').value)
      .then(res => {
        this.snackbar.open('Hola!', 'Cerrar', {
          duration: 6000
        });
        this.dialogref.close(true);
      })
      .catch(err => {
        this.snackbar.open(err.message, 'Cerrar', {
          duration: 6000
        });
        console.log(err.message);
      })
  }

  registerUser(): void {
    this.auth.signUp(this.dataFormGroup.value)
      .then(res => {
        this.snackbar.open('Bienvenid@!', 'Cerrar', {
          duration: 6000
        });
        this.dialogref.close(true);
      })
      .catch(error => {
        this.snackbar.open('Parece que hubo un error ...', 'Cerrar', {
          duration: 6000
        });
        console.log(error);
      });
  }

  signInProvider(type: 'facebook'|'google') {
    this.auth.signIn(type).then(res => {
      if(res){
        this.snackbar.open('¡Bienvenido!', 'Cerrar');
      } else {
        this.snackbar.open('Parece que hubo un error ...', 'Cerrar');
        console.log('res from signingoogle not found');
      }
    })
    .catch(error => {
      this.snackbar.open('Parece que hubo un error ...', 'Cerrar');
      console.log(error);
    });;
  }

  passwordReset() {
    this.auth.resetPassword(this.dataFormGroup.get('email').value).then(() => {
      // Email sent.
      this.snackbar.open(
        'Se envió un correo para restaurar su contraseña. Revise correo no deseado.',
        'Cerrar');
    }).catch((error) => {
      this.snackbar.open(
        'Ocurrió un error. Por favor, vuelva a intentarlo.',
        'Cerrar');
    });
  }

  emailRepeatedValidator() {
    return (control: AbstractControl): Observable<ValidationErrors|null> => {
      const email = control.value;
      return this.dbs.emailMethod(email).pipe(
        debounceTime(500),
        map(res => {
          control.parent.get('pass').enable()
          this.registerLogin$.next(false)
          switch(res[0]) {
            case 'google.com':
              control.parent.get('pass').disable()
              return {googleLogin: true}
            case 'facebook.com':
              control.parent.get('pass').disable()
              return {facebookLogin: true}
            case 'password':
              this.registerLogin$.next(true)
              return null
            default: 
              return null
          }
        }
      ))
    }
  }
}
