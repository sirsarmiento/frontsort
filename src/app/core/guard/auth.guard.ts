import { AuthService } from './../services/auth.service';
import { Injectable } from '@angular/core';
import { CanActivate, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { Router } from '@angular/router';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const currentUser = this.authService.currentUser;
    
    if (!currentUser) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    const userRoles = currentUser.roles;
    const url = state.url;

    // ADMINISTRADOR tiene acceso a todo
    if (userRoles.includes('ADMINISTRADOR')) {
      return true;
    }

    // PROMOTOR solo tiene acceso a bills
    if (userRoles.includes('PROMOTOR')) {
      if (url.includes('/bills')) {
        return true;
      } else {
        this.router.navigate(['/bills']); // o redirigir a bills
        return false;
      }
    }

    // CLIENTE no tiene acceso a ninguna ruta
    if (userRoles.includes('CLIENTE')) {
      this.router.navigate(['/access-denied']);
      return false;
    }

    // Por defecto, denegar acceso
    this.router.navigate(['/access-denied']);
    return false;
  }

  // canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    
  //   if (this.auth.isLoggedIn()) {
  //     return true;
  //   } 

  //   // not logged in so redirect to login page with the return url
  //   this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  //   return false;
  // }
}