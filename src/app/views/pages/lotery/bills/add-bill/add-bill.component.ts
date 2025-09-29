import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators} from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Bill } from 'src/app/core/models/Lotery/bill';
import { BillService } from 'src/app/core/services/Lotery/bill.service';
import { CommonsService } from 'src/app/core/services/commons.service';
import { SelectOption } from 'src/app/core/models/select-option';
import { Client } from 'src/app/core/models/Lotery/client';
import { ClientService } from 'src/app/core/services/Lotery/client.service';
import { ToastrService } from 'ngx-toastr';
import { TasaService } from 'src/app/core/services/Lotery/tasa.service';
import { LocalService } from 'src/app/core/services/Lotery/local.service';
import { Local } from 'src/app/core/models/Lotery/local';


@Component({
  selector: 'app-add-bill',
  templateUrl: './add-bill.component.html'
})
export class AddBillComponent implements OnInit {
  private data$: Observable<Bill>;
  form: FormGroup;
  id: number;
  tasa: number = 0;
  montoMin: number = 0;
  cliente: 0;
  loading = false;
  submitted = false;
  unamePattern = "^[a-zA-Z ]{3,30}$"; //Validate only caracters
  uidPattern = "^[VE][0-9]{7,9}$"; //Validate only VE and numbers

  minFecha = new Date(1950, 0, 1);
  maxFecha = new Date();

  estados:Array<SelectOption>;
  ciudades:Array<SelectOption>;

  locales: Local[] = [];

  constructor(
    private billService: BillService,
    private clientService: ClientService,
    private commonsService: CommonsService,
    private formBuilder: FormBuilder,
    private router: Router,
    private toastrService: ToastrService,
    private tasaService: TasaService,
    private localService: LocalService,
  ) {
      this.myFormValues();
      this.data$ = billService.sharingProject;
   }

  get f() { return this.form.controls; }

  async ngOnInit() {
    this.setValues();
    this.getLastTasa();
    this.getLocales();
      const objetoJSON = localStorage.getItem('cusr');
      if (objetoJSON) {
        const localStore = JSON.parse(objetoJSON);
        this.estados = await this.commonsService.getAllEstados(localStore.user.country.value);
    }
  }

  getLastTasa(){
    this.tasaService.getAll().subscribe((resp: any) => {
       this.tasa = Number(resp.data[0].monto);
       console.log(resp.data[0].monto);
    });
  }

  getLocales(){
    this.localService.getAll().subscribe((resp: any) => {
      this.locales = resp.data;
    });
  }
      

  back() {
    this.router.navigate(['/bills']);
    this.billService.resetData();
  }

  searchClient  (){
    if(this.f.nroDocumentoIdentidad.value.length > 6){
      this.clientService.getByNroDocumentoIdentidad(this.f.nroDocumentoIdentidad.value).subscribe((resp: any) => {
        this.cliente = resp.id;
        this.f.tipoDocumentoIdentidad.setValue(resp.tipoDocumentoIdentidad);
        this.f.email.setValue(resp.email);  
        this.f.primerNombre.setValue(resp.primerNombre);
        this.f.segundoNombre.setValue(resp.segundoNombre);
        this.f.primerApellido.setValue(resp.primerApellido);
        this.f.segundoApellido.setValue(resp.segundoApellido);
        this.f.estado.setValue(resp.estado.id);
        this.getCiudades(resp.estado.id);
        this.f.ciudad.setValue(resp.ciudad.id);
        this.f.direccion.setValue(resp.direccion);
        this.f.codTelefono.setValue(resp.codTelefono);
        this.f.nroTelefono.setValue(resp.nroTelefono);
       });
    }
  }

  getMontoMin(id: number){
    this.locales.forEach( l => {
      if(l.id == id){
        this.montoMin = l.monto * this.tasa;
      }
    })
  }

  setValues(){
    this.data$.subscribe( data => {
      if(data.id > 0){
        // this.f.tipoDocumentoIdentidad.setValue(data.tipoDocumentoIdentidad);
        // this.f.nroDocumentoIdentidad.setValue(data.nroDocumentoIdentidad);getCiudadesciudad
        // this.f.email.setValue(data.email);
        // this.f.primerNombre.setValue(data.primerNombre);
        // this.f.segundoNombre.setValue(data.segundoNombre);
        // this.f.primerApellido.setValue(data.primerApellido);
        // this.f.segundoApellido.setValue(data.segundoApellido);
        // this.f.estado.setValue(data.estado);
        // this.f.ciudad.setValue(data.ciudad);
        // this.f.direccion.setValue(data.direccion);
        // this.f.codTelefono.setValue(data.codTelefono);
        // this.f.nroTelefono.setValue(data.nroTelefono);
        // this.f.nroFactura.setValue(data.nroFactura);
        // this.f.fecha.setValue(data.fecha);
        // this.f.hora.setValue(data.hora);
        // this.f.local.setValue(data.local);
        // this.f.monto.setValue(data.monto);
        this.id = data.id;
      }
    });
  }

  async getCiudades(estadoId:any){
    this.ciudades = [];
    this.ciudades = await this.commonsService.getAllCiudades(estadoId);
  }

  setUserName(){
    this.form.patchValue({username: this.f.email.value});
  }

  myFormValues() {
    this.form = this.formBuilder.group({
      tipoDocumentoIdentidad: ['',Validators.required],
      nroDocumentoIdentidad: ['',Validators.required],
      email: ['',Validators.required],
      primerNombre: ['',Validators.required],
      segundoNombre: ['',Validators.required],
      primerApellido: ['',Validators.required],
      segundoApellido: [''],
      estado: ['',Validators.required],
      ciudad: ['',Validators.required],
      direccion: ['',Validators.required],
      codTelefono: ['',Validators.required],
      nroTelefono: ['',Validators.required],
      nroFactura: ['',Validators.required],
      fecha: ['',Validators.required],
      hora: ['',Validators.required],
      local: ['',Validators.required],
      monto: ['',Validators.required],
    })
  }

  onSubmit() {

    if(this.montoMin > this.f.monto.value) {
      this.toastrService.error('', 'El monto debe ser mayor o igual al monto mínimo.');
      return;
    }

    this.submitted = true;

    if (this.form.invalid) { return; }

    this.loading = true;

    const cliente: Client = {
      tipoDocumentoIdentidad: this.f.tipoDocumentoIdentidad.value,
      nroDocumentoIdentidad: this.f.nroDocumentoIdentidad.value,
      email: this.f.email.value,
      primerNombre: this.f.primerNombre.value,
      segundoNombre: this.f.segundoNombre.value,
      primerApellido: this.f.primerApellido.value,
      segundoApellido: this.f.segundoApellido.value,
      estado: this.f.estado.value,
      ciudad: this.f.ciudad.value,
      direccion: this.f.direccion.value,
      codTelefono: this.f.codTelefono.value,
      nroTelefono: this.f.nroTelefono.value,
    }

    const factura: Bill = {
      numero: this.f.nroFactura.value,
      fecha: this.f.fecha.value,
      hora: this.f.hora.value,
      monto: this.f.monto.value,
      montoMin: Number(this.montoMin.toFixed(2)),
      tasa: this.tasa,
      local: this.f.local.value,
      cliente: this.cliente,
      print: 0 
    }

    console.log(cliente);
    console.log(factura);

    if(this.cliente == 0 || this.cliente == undefined){
      //Si el cliente no existe guardamos cliente, capturamos el id y guardamos facturas

      this.clientService.add(cliente).subscribe({
        next: ((resp: any) => {
          factura.cliente = resp.id;
        }),
        error: () => {
          this.toastrService.error('', 'Ha ocurrido un error' )
        },
        complete: () => this.billService.add(factura)
      })
    }else{
      // Si el cliente existe tomamos el id del cliente y solo guardamos la factura
      
       this.billService.add(factura);
    }

  }

}
