import { AuthService } from 'src/app/core/services/auth.service';
import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../core/services/theme.service';
import { MatDialog } from '@angular/material/dialog';
import { LoginDialogComponent } from './login-dialog/login-dialog.component';
import { Observable } from 'rxjs';
import { DatabaseService } from '../core/services/database.service';
import { mapTo } from 'rxjs/operators';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  version: string

  openedMenu: boolean = false;

  constructor(
    public auth: AuthService,
    public themeService: ThemeService,
    private dialog: MatDialog,
    private dbs: DatabaseService
  ) { }

  ngOnInit(): void {
    this.version = this.dbs.version;
  }

  toggleSideMenu(): void {
    this.openedMenu = !this.openedMenu;
  }

  login() {
    this.dialog.open(LoginDialogComponent)
  }

  logout() {
    this.auth.logout();
    localStorage.clear()
  }

}
