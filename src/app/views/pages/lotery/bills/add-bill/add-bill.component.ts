import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators} from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Bill } from 'src/app/core/models/Lotery/bill';
import { BillService } from 'src/app/core/services/Lotery/bill.service';


@Component({
  selector: 'app-add-bill',
  templateUrl: './add-bill.component.html'
})
export class AddBillComponent implements OnInit {
  private data$: Observable<Bill>;
  form: FormGroup;
  id: number;
  loading = false;
  submitted = false;

  constructor(
    private billService: BillService,
    private formBuilder: FormBuilder,
    private router: Router,
  ) {
      this.myFormValues();
      this.data$ = billService.sharingProject;
   }

  get f() { return this.form.controls; }

  ngOnInit() {
    this.setValues();
  }

  back() {
    this.router.navigate(['/bills']);
    this.billService.resetData();
  }

  setValues(){
    this.data$.subscribe( data => {
      if(data.id > 0){
        // this.f.nombre.setValue(data.nombre);
        // this.f.costoInicial.setValue(data.costoInicial);
        // this.f.valorResidual.setValue(data.valorResidual);
        // this.f.vidaUtil.setValue(data.vidaUtil);
        // this.f.fechaCompra.setValue(data.fechaCompra);
        this.id = data.id;
      }
    });
  }

  myFormValues() {
    this.form = this.formBuilder.group({
      nombre: ['',Validators.required],
      costoInicial: ['',Validators.required],
      valorResidual: ['',Validators.required],
      vidaUtil: ['',Validators.required],
      fechaCompra: ['',Validators.required],
    })
  }

  onSubmit() {

    this.submitted = true;

    if (this.form.invalid) { return; }

    this.loading = true;

    const bill: Bill = {
      local: this.f.local.value,
      monto: this.f.monto.value,
      numero: this.f.numero.value,
      fecha: this.f.fecha.value,
    }

    console.log(bill);

    if(this.id == 0 || this.id == undefined){
      this.billService.add(bill);
    }else{
      this.billService.update(this.id, bill);
    }

  }

}
