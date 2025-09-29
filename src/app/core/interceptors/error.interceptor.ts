import { environment } from './../../../environments/environment';
import { AuthService } from './../services/auth.service';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';


@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService, private toastrService: ToastrService) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const isInclude = this.isOnTheBlackList(request.url, environment.endpoints.handle_error_blackList);
        if(isInclude){
            return next.handle(request);
        }
        return next.handle(request).pipe(
            catchError(err => {
                if (err.status === 401) {
                    this.toastrService.error('', err.error.error.msg);
                    //this.authService.logout();
                } else if (err.status === 404) {
                    this.toastrService.error('', err.error.msg);
                } else if (err.status === 500) {
                    this.toastrService.error('', err.error.msg);
                }

                const error = err.error.message || err.statusText;
                return throwError(error);
            })
        );
    }

    isOnTheBlackList(url:string, paths: string[]):boolean{
    
        let isInclude:boolean = false;
    
        paths.forEach((path:string)=>{
          if(url.endsWith(path)){
            isInclude = true;
          }
        });

        return isInclude;
      }

}
