import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators} from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { Bill } from 'src/app/core/models/Lotery/bill';
import { BillService } from 'src/app/core/services/Lotery/bill.service';
import { CommonsService } from 'src/app/core/services/commons.service';
import { SelectOption } from 'src/app/core/models/select-option';
import { ToastrService } from 'ngx-toastr';
import { TasaService } from 'src/app/core/services/Lotery/tasa.service';
import { LocalService } from 'src/app/core/services/Lotery/local.service';
import { Local } from 'src/app/core/models/Lotery/local';
import { UserService } from 'src/app/core/services/user.service';
import { User, userObservable } from 'src/app/core/models/user';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-bill',
  templateUrl: './add-bill.component.html'
})
export class AddBillComponent implements OnInit {
  private userSubscription: Subscription;
  private data$: Observable<userObservable>;
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
    private clientService: UserService,
    private commonsService: CommonsService,
    private formBuilder: FormBuilder,
    private router: Router,
    private toastrService: ToastrService,
    private tasaService: TasaService,
    private localService: LocalService,
  ) {
      this.myFormValues();
      this.data$ = clientService.userObservable;
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

async searchClient() {
  try {
    const resp = await this.clientService.getUserByCi(this.f.nroDocumentoIdentidad.value);
    console.log(resp);

    if (resp) {
      this.cliente = resp[0].id;
      this.f.tipoDocumentoIdentidad.setValue(resp[0].tipoDocumentoIdentidad);
      this.f.email.setValue(resp[0].email);
      this.f.primerNombre.setValue(resp[0].primerNombre);
      this.f.segundoNombre.setValue(resp[0].segundoNombre);
      this.f.primerApellido.setValue(resp[0].primerApellido);
      this.f.segundoApellido.setValue(resp[0].segundoApellido);
      this.f.estado.setValue(resp[0].estado.id);
      this.getCiudades(resp[0].estado.id);
      this.f.ciudad.setValue(resp[0].ciudad.id);
      this.f.direccion.setValue(resp[0].direccion);

      // Dividir el número de teléfono
      const numeroCompleto = resp[0].telefonos[0].numero; // "04142781730"

      // Primeros 4 dígitos para código
      this.f.codTelefono.setValue(numeroCompleto.substring(0, 4));
      
      // Resto del número (desde la posición 4 hasta el final)
      this.f.nroTelefono.setValue(numeroCompleto.substring(4));
    }
  } catch (error) {
    console.error('Error al cargar datos del usuario:', error);
  }
}

  getMontoMin(id: number) {
    const local = this.locales.find(l => l.id === id);
    if (local) {
      this.montoMin = local.monto * this.tasa;
    }
  }

  setValues(){
    this.userSubscription = this.data$.subscribe( data => {
      if(data != null && data.id > 0){
        console.log(data);

        this.f.firstName.setValue(data.firstName);
        this.f.secondName.setValue(data.secondName);
        this.f.lastName.setValue(data.lastName);
        this.f.secondLastName.setValue(data.secondLastName);
        this.f.documentType.setValue(data.documentType);
        this.f.documentNumber.setValue(data.documentNumber);
        this.f.birthDate.setValue(data.birthDate); // La fecha viene null
        this.f.sex.setValue(data.sex);
        this.f.email.setValue(data.email);
        this.f.address.setValue(data.address);
        this.f.position.setValue(parseInt(data.position.value));
        this.f.estado.setValue(parseInt(data.estado.value));
        this.f.ciudad.setValue(parseInt(data.ciudad.value));

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

    const cliente: any = {
      id: this.id,
      idStatus: 1,
      numeroDocumento: this.f.nroDocumentoIdentidad.value,
      tipoDocumentoIdentidad: this.f.tipoDocumentoIdentidad.value,
      primerNombre: this.f.primerNombre.value,
      segundoNombre: this.f.segundoNombre.value,
      primerApellido: this.f.primerApellido.value,
      segundoApellido: this.f.segundoApellido.value,
      fechaNacimiento: '2000-01-01',
      direccion: this.f.direccion.value,
      sexo: 'M',
      email: this.f.email.value,
      username: this.f.email.value,
      idCargo: 1,
      roles: [ 
        {
          rol: 'CLIENTE'
        }
      ],
      pais: 1,
      estado: this.f.estado.value,
      ciudad: this.f.ciudad.value,
      idempresa: null,
      telefono: [
        { 
          numero: this.f.codTelefono.value + this.f.nroTelefono.value 
        },
      ],
    }

    const factura: Bill = {
      numero: this.f.nroFactura.value,
      fecha: this.f.fecha.value,
      hora: this.f.hora.value,
      monto: this.f.monto.value,
      montoMin: Number(this.montoMin.toFixed(2)),
      tasa: this.tasa,
      local: this.f.local.value,
      user: this.cliente,
      print: 0 
    }

    console.log(cliente);
    console.log(factura);

    if(this.cliente == 0 || this.cliente == undefined){
      //Si el cliente no existe guardamos cliente, capturamos el id y guardamos facturas
      this.clientService.add(cliente).subscribe({
        next: ((resp) => {
          this.toastrService.success('Cliente registrado con exito.');
            console.log(resp);

            this.cliente = resp['id'];
            factura.user = this.cliente;
            console.log(factura);
          
        }),
        error: (error) => {
          this.loading = false;
          this.toastrService.error('Error al registrar cliente:', error.error.msg);
        },
        complete: () => this.billService.add(factura)
      });
    }else{
      // Si el cliente existe tomamos el id del cliente y solo guardamos la factura

       this.billService.add(factura);
    }

  }

}
