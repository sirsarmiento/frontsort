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
      console.log('paso');
      // this.clientService.getByNroDocumentoIdentidad(this.f.nroDocumentoIdentidad.value).subscribe((resp: any) => {
      //   if(resp.data.length > 0){
      //     const data = resp.data[0];
      //     this.cliente = data.id; 
      //   }
      //  });
    }
  }

  getMontoMin(id: number){
    console.log(id);
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
        // this.f.nroDocumentoIdentidad.setValue(data.nroDocumentoIdentidad);
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
      tipoDocumentoIdentidad: ['V',Validators.required],
      nroDocumentoIdentidad: ['13044519',Validators.required],
      email: ['sirsarmiento@gmail.com',Validators.required],
      primerNombre: ['Sir',Validators.required],
      segundoNombre: ['Oscar',Validators.required],
      primerApellido: ['Sarmiento',Validators.required],
      segundoApellido: [''],
      estado: ['',Validators.required],
      ciudad: ['',Validators.required],
      direccion: ['Puelo Arriba',Validators.required],
      codTelefono: ['0414',Validators.required],
      nroTelefono: ['2781730',Validators.required],
      nroFactura: ['098798798',Validators.required],
      fecha: ['',Validators.required],
      hora: ['10:09',Validators.required],
      local: ['Test',Validators.required],
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

    const factura: Bill = {
      numero: this.f.nroFactura.value,
      fecha: this.f.fecha.value,
      hora: this.f.hora.value,
      monto: this.f.monto.value,
      montoMin: this.montoMin,
      tasa: this.tasa,
      local: this.f.local.value,
      cliente: this.cliente,
    }

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

    console.log(cliente);
    console.log(factura);

    // if(this.id == 0 || this.id == undefined){
    //   //Si el cliente no existe guardamos cliente, capturamos el id y guardamos facturas

    //   this.clientService.add(cliente).subscribe({
    //     next: ((resp: any) => {
    //       console.log(resp, resp['clienteId']);
    //       factura.cliente = resp['clienteId'];
    //       console.log(factura);  
    //     }),
    //     error: (err) => {
    //       this.toastrService.error('', 'Ha ocurrido un error' )
    //     },
    //     complete: () => this.billService.add(factura)
    //   })
    // }else{
    //   // Si el cliente existe tomamos el id del cliente y solo guardamos la factura
    //    this.billService.add(factura);
    // }

  }

}
