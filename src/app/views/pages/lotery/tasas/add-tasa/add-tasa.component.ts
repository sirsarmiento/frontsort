import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators} from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Tasa } from 'src/app/core/models/Lotery/tasa';
import { TasaService } from 'src/app/core/services/Lotery/tasa.service';


@Component({
  selector: 'app-add-n',
  templateUrl: './add-tasa.component.html'
})
export class AddTasaComponent implements OnInit {
  private data$: Observable<Tasa>;
  form: FormGroup;
  id: number;
  loading = false;
  submitted = false;

  minFecha = new Date(2025, 0, 11);
  maxFecha = new Date();

  constructor(
    private tasaService: TasaService,
    private formBuilder: FormBuilder,
    private router: Router,
  ) {
      this.myFormValues();
      this.data$ = tasaService.sharingProject;
   }

  get f() { return this.form.controls; }

  async ngOnInit() {
    this.f.fecha.setValue(this.maxFecha);

    this.setValues();
}

  back() {
    this.router.navigate(['/tasas']);
    this.tasaService.resetData();
  }

  setValues(){
    this.data$.subscribe( data => {
      if(data.id > 0){
        this.f.monto.setValue(data.monto);
        this.f.fecha.setValue(data.fecha);
        this.id = data.id;
      }
    });
  }

  myFormValues() {
    this.form = this.formBuilder.group({
      monto: ['',Validators.required],
      fecha: ['',Validators.required],
    })
  }

  onSubmit() {

    this.submitted = true;

    if (this.form.invalid) { return; }

    this.loading = true;

    const tasa: Tasa = {
      monto: this.f.monto.value,
      fecha: this.f.fecha.value
    }

    console.log(tasa);

    if(this.id == 0 || this.id == undefined){
      this.tasaService.add(tasa);
    }else{
      this.tasaService.update(this.id, tasa);
    }

  }

}
