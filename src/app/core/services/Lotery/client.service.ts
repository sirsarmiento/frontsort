import { Injectable } from '@angular/core';
import { HttpService } from '../http.service';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { Client } from '../../models/Lotery/client';


@Injectable({
  providedIn: 'root'
})
export class ClientService extends HttpService {
  private sharingObservable: BehaviorSubject<Client> =
    new BehaviorSubject<Client>(this.getEmptyConfig());

  getEmptyConfig(): Client {
    return {
      id: 0,
      tipoDocumentoIdentidad: '',
      nroDocumentoIdentidad: 0,
      email: '',
      primerNombre: '',
      segundoNombre: '',
      primerApellido: '',
      segundoApellido: '',
      estado: '',
      ciudad: '',
      direccion: '',
      codTelefono: '',
      nroTelefono: 0,
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

  set sharingData (data: Client){
    this.sharingObservable.next(data);
  }

  resetData(){
    this.sharingObservable.next(this.getEmptyConfig());
  }

  getAll() {
      return this.get(environment.apiUrl, '/clientes');
  }

  /**
   * Persists client data
   * @param data 
   */
  add(data: any) {
    return this.http.post(`${ environment.apiUrl }/cliente`, data);
  }

  async update(id: number, data: any) {
    try {
      await firstValueFrom(this.put(environment.apiUrl, `/cliente/${id}`, data));
      this.resetData(); //// Resetear los valores del observable después de actualizar
      this.toastrService.success('Cliente actualizado con éxito.');
      this.router.navigate(['/clientes']);
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
