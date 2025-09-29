import { FormBuilder, FormGroup, Validators,FormArray, FormControl, AbstractControl} from '@angular/forms';
import { UserService } from './../../../../../core/services/user.service';
import { Component, OnInit,ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { CommonsService } from 'src/app/core/services/commons.service';
import { SelectOption } from 'src/app/core/models/select-option';
import { User, userObservable } from 'src/app/core/models/user';
import { Observable, Subscription } from 'rxjs';


@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AddUserComponent implements OnInit {
  private userSubscription: Subscription;
  private data$: Observable<userObservable>;
  unamePattern = "^[a-zA-Z ]{3,30}$"; //Validate only caracters
  uidPattern = "^[VE][0-9]{7,9}$"; //Validate only VE and numbers
  loading = false;
  submitted = false;
  form: FormGroup;
  id: number;

  minDate = new Date(1950, 0, 1);
  maxDate = new Date();

  user:User;
  estados:Array<SelectOption>;
  ciudades:Array<SelectOption>;
  positions: Array<SelectOption>;
  roles: Array<SelectOption>;

  users: User[];

  constructor(
    private userService: UserService,
    private commonsService: CommonsService,
    private formBuilder: FormBuilder,
    private router: Router,
    ) {
      this.myFormValues();
      this.data$ = userService.userObservable;
    }

  get f() { return this.form.controls; }

  async ngOnInit() {

    const objetoJSON = localStorage.getItem('cusr');
    if (objetoJSON) {
      const localStore = JSON.parse(objetoJSON);
      this.estados = await this.commonsService.getAllEstados(localStore.user.country.value);
    }

    this.positions = await this.commonsService.getAllPositions();
    this.roles = await this.commonsService.getAllRoles();
    this.setValue();

  }


  get levelsFormArray(): FormArray {
    return this.form.get('levels') as FormArray;
  }

  getLevelControl(index: number): FormControl {
    return this.levelsFormArray.at(index) as FormControl;
  }

  setValue(){
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

        this.setRolesSeleccionados(data.roles);
        this.id = data.id;
      }
    });
  }

  setRolesSeleccionados(rolesGuardados: { rol: string }[]) {
    const formArray = this.form.get('roles') as FormArray;
    formArray.clear(); // Limpiar si ya existían roles cargados

    rolesGuardados.forEach(r => {
      if (!formArray.value.includes(r.rol)) {
        formArray.push(new FormControl(r.rol));
      }
    });
  }

  isChecked(value: string): boolean {
    const formArray = this.form.get('roles') as FormArray;
    return formArray.value.includes(value);
  } 

  ngOnDestroy() {
    this.userSubscription.unsubscribe();
  }

  async getCiudades(stateId:any){
    this.ciudades = [];
    this.ciudades = await this.commonsService.getAllCiudades(stateId);
  }

  setUserName(){
    this.form.patchValue({username: this.f.email.value});
  }

  back() {
    this.router.navigate(['/users']);
  }

  onSubmit() {
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }

    //this.loading = true; //desactiva el button para evitar doble clic y evitar insercion doble

    const user: any = {
      id: this.id,
      idStatus: 1,
      documentNumber: this.f.documentNumber.value,
      documentType: this.f.documentType.value,
      firstName: this.f.firstName.value,
      secondName: this.f.secondName.value,
      lastName: this.f.lastName.value,
      secondLastName: this.f.secondLastName.value,
      birthDate: this.f.birthDate.value,
      address: this.f.address.value,
      sex: this.f.sex.value,
      email: this.f.email.value,
      position: this.f.position.value,
      roles: this.f.roles.value,
      country: 1,
      estado: this.f.estado.value,
      ciudad: this.f.ciudad.value,
      idempresa: null,
    }

    console.log(user);

    this.userService.storeUser(User.mapForPost(user));
  }



  myFormValues() {
    this.form = this.formBuilder.group({
      firstName: ['',Validators.compose([Validators.pattern(this.unamePattern),Validators.maxLength(25),Validators.minLength(3),Validators.required])],
      secondName: ['',Validators.compose([Validators.pattern(this.unamePattern),Validators.maxLength(25),Validators.minLength(3),Validators.required])],
      lastName: ['',Validators.compose([Validators.pattern(this.unamePattern),Validators.maxLength(25),Validators.minLength(3),Validators.required])],
      secondLastName: ['',Validators.compose([Validators.pattern(this.unamePattern),Validators.maxLength(25),Validators.minLength(3)])],
      documentType: ['',Validators.required],
      documentNumber: ['',Validators.compose([Validators.required])],
      birthDate: ['',Validators.required],
      estado: ['',Validators.required],
      ciudad: ['',Validators.required],
      sex: ['',Validators.required],
      email: ['', Validators.compose([Validators.email,Validators.required])],
      address: ['',Validators.compose([Validators.minLength(10),Validators.maxLength(150),Validators.required])],
      position: ['',Validators.required],
      levels: this.formBuilder.array([
        this.formBuilder.control('') // Nivel 1
      ]),
      roles: this.formBuilder.array([]),
      username: [''],
    })
  }



  onCheckChange(event) {
    const formArray: FormArray = this.form.get('roles') as FormArray;

    if(event.target.checked){
      formArray.push(new FormControl(event.target.value));
    }else{
      let i: number = 0;
      formArray.controls.forEach((ctrl: AbstractControl) => {
        if(ctrl.value == event.target.value) {
          formArray.removeAt(i);
          return;
        }
        i++;
      });
    }
  }
}
