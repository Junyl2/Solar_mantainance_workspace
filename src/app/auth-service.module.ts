import {
  Component,
  EventEmitter,
  Injectable,
  Input,
  ModuleWithProviders,
  NgModule,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import moment from 'moment';
import { environment } from 'src/environments/environment';
import { Token } from './models/token';
import { UserEntity } from './models/user-entity';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';

@NgModule({
  declarations: [],
  imports: [CommonModule],
})
@Injectable()
export class AuthServiceModule {
  private emitChangeSource: BehaviorSubject<boolean>;
  changeEmitted$: Observable<boolean>;
  emitChange(data) {
    console.log('emitChange');
    console.log(data);
    this.emitChangeSource.next(data);
  }

  constructor(private http: HttpClient) {
    if (localStorage.getItem('account') != null) {
      this.emitChangeSource = new BehaviorSubject<boolean>(true);
    } else {
      this.emitChangeSource = new BehaviorSubject<boolean>(false);
    }
    this.changeEmitted$ = this.emitChangeSource.asObservable();
  }

  isAuth() {
    return this.emitChangeSource.getValue();
  }

  getUserInfo(account: string) {
    return this.http
      .get<UserEntity>(
        `${environment.baseUserUrl}/public/api/v1/user/account/${account}`
      )
      .pipe(
        tap((res) => this.setAccount(res)),
        shareReplay()
      );
  }

  login(account: string, password: string) {
    return this.http
      .post<Token>(`${environment.baseUserUrl}/auth/user/login`, {
        account,
        password,
      })
      .pipe(
        tap((res) => {
          this.setSession(res);
          console.log(res);
        }),
        shareReplay()
      );
  }

  private setAccount(accountResult) {
    localStorage.setItem('account', JSON.stringify(accountResult));
  }

  private setSession(authResult) {
    const expiresAt = moment().add(authResult.accessTokenExpiresIn, 'second');

    localStorage.setItem('token', authResult.accessToken);
    localStorage.setItem('expires_at', JSON.stringify(expiresAt.valueOf()));
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('expires_at');
    localStorage.removeItem('account');
    this.emitChange(false);
  }

  public isLoggedIn() {
    return moment().isBefore(this.getExpiration());
  }

  isLoggedOut() {
    return !this.isLoggedIn();
  }

  getExpiration() {
    const expiration = localStorage.getItem('expires_at');
    const expiresAt = JSON.parse(expiration);
    return moment(expiresAt);
  }
}
