import { Injectable } from '@angular/core';
import { HttpService } from '../http.service';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { Local } from '../../models/Lotery/local';

@Injectable({
  providedIn: 'root'
})
export class LocalService extends HttpService {
  private sharingObservable: BehaviorSubject<Local> =
    new BehaviorSubject<Local>(this.getEmptyConfig());

  getEmptyConfig(): Local {
    return {
      id: 0,
      nombre: '',
      monto: 0,
    };

  }

  constructor(protected http: HttpClient,
    private toastrService: ToastrService,
    private router: Router,
    ) {
    super(http);
  }

  get sharingProject(){
    return this.sharingObservable.asObservable();
  }

  set sharingData (data: Local){
    this.sharingObservable.next(data);
  }

  resetData(){
    this.sharingObservable.next(this.getEmptyConfig());
  }

  getAll() {
      return this.get(environment.apiUrl, '/locales');
  }

  /**
   * Persists Project data
   * @param data 
   */
  async add(data: any) {
    try {
      await firstValueFrom(this.post(environment.apiUrl, '/local', data));
      this.toastrService.success('Local registrado con éxito.');
      this.router.navigate(['/locales']);
    } catch (error: any) {        
      if (error.status == 409) {
        this.toastrService.error('', error.error.msg);
      }
      if (error.status != 500 && error.status != 409) {
        this.toastrService.error('', 'Ha ocurrido un error. Intente más tarde.');
      }
    }
  }

  async update(id: number, data: any) {
    try {
      await firstValueFrom(this.put(environment.apiUrl, `/local/${id}`, data));
      this.resetData(); //// Resetear los valores del observable después de actualizar
      this.toastrService.success('Local actualizado con éxito.');
      this.router.navigate(['/locales']);
    } catch (error: any) {
      if (error.status == 409) {
        this.toastrService.error('', error.msg);
      }
      if (error.status != 500) {
        this.toastrService.error('', 'Ha ocurrido un error. Intente más tarde.');
      }
    }
  }
}
