import { Injectable } from '@angular/core';
import { HttpService } from '../http.service';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { Bill } from '../../models/Lotery/bill';

@Injectable({
  providedIn: 'root'
})
export class BillService extends HttpService {
  private sharingObservable: BehaviorSubject<Bill> =
    new BehaviorSubject<Bill>(this.getEmptyConfig());

  getEmptyConfig(): Bill {
    return {
      id: 0,
      numero: '',
      fecha: new Date(),
      hora: 0,
      local: 0,
      user: 0,
      monto: 0,
      montoMin: 0,
      tasa: 0,
      print: 0
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

  set sharingData (data: Bill){
    this.sharingObservable.next(data);
  }

  resetData(){
    this.sharingObservable.next(this.getEmptyConfig());
  }

  getAll() {
      return this.get(environment.apiUrl, '/facturas');
  }

  /**
   * Persists Project data
   * @param data 
   */
  async add(data: any) {
    try {
      await firstValueFrom(this.post(environment.apiUrl, '/factura', data));
      this.toastrService.success('Factura registrada con éxito.');
      this.router.navigate(['/bills']);
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
      await firstValueFrom(this.put(environment.apiUrl, `/factura/${id}`, data));
      this.resetData(); //// Resetear los valores del observable después de actualizar
      this.toastrService.success('Factura actualizada con éxito.');
      this.router.navigate(['/bills']);
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
