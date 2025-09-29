import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators} from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Local } from 'src/app/core/models/Lotery/local';
import { LocalService } from 'src/app/core/services/Lotery/local.service';
import { CommonsService } from 'src/app/core/services/commons.service';



@Component({
  selector: 'app-add-local',
  templateUrl: './add-local.component.html'
})
export class AddLocalComponent implements OnInit {
  private data$: Observable<Local>;
  form: FormGroup;
  id: number;
  loading = false;
  submitted = false;

  constructor(
    private localService: LocalService,
    private commonsService: CommonsService,
    private formBuilder: FormBuilder,
    private router: Router,
  ) {
      this.myFormValues();
      this.data$ = localService.sharingProject;
   }

  get f() { return this.form.controls; }

  async ngOnInit() {
    this.setValues();
}

  back() {
    this.router.navigate(['/locales']);
    this.localService.resetData();
  }

  setValues(){
    this.data$.subscribe( data => {
      if(data.id > 0){
        this.f.nombre.setValue(data.nombre);
        this.f.monto.setValue(data.monto);
        this.id = data.id;
      }
    });
  }

  myFormValues() {
    this.form = this.formBuilder.group({
      nombre: ['',Validators.required],
      monto: ['',Validators.required],
    })
  }

  onSubmit() {

    this.submitted = true;

    if (this.form.invalid) { return; }

    this.loading = true;

    const local: Local = {
      nombre: this.f.nombre.value,
      monto: this.f.monto.value,
    }

    console.log(local);

    if(this.id == 0 || this.id == undefined){
      this.localService.add(local);
    }else{
      this.localService.update(this.id, local);
    }

  }

}
