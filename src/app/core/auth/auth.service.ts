import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { LogService } from "@core/log.service";
import { BehaviorSubject, EMPTY, of, throwError } from "rxjs";
import { catchError, switchMap } from "rxjs/operators";
import { User } from "../user";
import { TokenStorageService } from "./token-storage.service";

interface UserDto {
  user: User;
  token: string;
}

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private user$ = new BehaviorSubject<User>(null);
  private apiUrl = "/api/auth/";
  private redirectUrlAfterLogin = "";

  constructor(
    private httpClient: HttpClient,
    private tokenStorage: TokenStorageService,
    private logService: LogService
  ) {}

  get loggedInUser() {
    return this.user$.value;
  }

  get isUserLoggedIn() {
    return this.user$.value !== null;
  }

  set redirectUrl(url: string) {
    this.redirectUrlAfterLogin = url;
  }

  login(email: string, password: string) {
    const loginCredentials = { email, password };
    this.logService.log(
      "login credentials sending to server",
      loginCredentials
    );

    return this.httpClient
      .post<UserDto>(`${this.apiUrl}login`, loginCredentials)
      .pipe(
        switchMap(({ user, token }) => {
          this.setUser(user);
          this.tokenStorage.setToken(token);
          this.logService.log(`user found from server:`, user);
          return of(this.redirectUrlAfterLogin);
        }),
        catchError((e) => {
          this.logService.log(`Server Error Occurred: ${e.error.message} `, e);
          return throwError(
            `Your login details could not be verified. Please try again`
          );
        })
      );
  }

  logout() {
    this.tokenStorage.removeToken();
    this.setUser(null);
    this.logService.log("user did logout successfull");
  }

  get user() {
    return this.user$.asObservable();
  }

  register(userToSave: any) {
    return this.httpClient.post<any>(`${this.apiUrl}register`, userToSave).pipe(
      switchMap(({ user, token }) =>
        this.afterUserFoundFromServer(user, token)
      ),
      catchError((e) => {
        this.logService.log(`server error occured`, e);
        return throwError(`Registration failed please contact to admin`);
      })
    );
  }

  findMe() {
    const token = this.tokenStorage.getToken();
    if (!token) {
      return EMPTY;
    }

    return this.httpClient.get<any>(`${this.apiUrl}findme`).pipe(
      switchMap(({ user, token }) =>
        this.afterUserFoundFromServer(user, token)
      ),
      catchError((e) => {
        this.logService.log(
          `Your login details could not be verified. Please try again`,
          e
        );
        return throwError(
          `Your login details could not be verified. Please try again`
        );
      })
    );
  }

  private afterUserFoundFromServer(user: any, token: string) {
    this.setUser(user);
    this.tokenStorage.setToken(token);
    this.logService.log(`user found from server:`, user);

    return of(user);
  }

  private setUser(user: any) {
    if (user) {
      const newUser = { ...user, id: user._id };
      this.user$.next(newUser);
      this.logService.log(`Logged In User`, newUser);
    } else {
      this.user$.next(null);
    }
  }
}
