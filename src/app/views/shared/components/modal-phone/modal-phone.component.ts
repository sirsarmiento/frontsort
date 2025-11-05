import { Component, Inject, OnInit,  } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { BillService } from 'src/app/core/services/Lotery/bill.service';
import { AuthService } from 'src/app/core/services/auth.service';

export interface DialogData { phoneId: number, phone: string }


@Component({
  selector: 'app-modal-phone',
  styleUrls: ['./modal-phone.component.scss'],
  templateUrl: './modal-phone.component.html'
})
export class ModalPhoneComponent implements OnInit {
  form: FormGroup;  
  userRoles: any[] = [];
  submitted = false;
  loading = false;

  constructor(
     private billService: BillService,
     private formBuilder: FormBuilder,
     public dialogRef: MatDialogRef<ModalPhoneComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private authService: AuthService,
    private toastrService: ToastrService,
  ) {
    const currentUser = this.authService.currentUser;
    this.userRoles = currentUser.roles;
    this.myFormValues();
  }

  get f() { return this.form.controls; }

  ngOnInit() {
    this.f.nroTelefono.setValue(this.data.phone);
  }


  onEdit(){
    this.submitted = true;

    if (this.form.invalid) { return; }

    this.loading = true;

    this.billService.editTelefono(this.data.phoneId, this.f.nroTelefono.value).subscribe({
      next: (() => {
        this.toastrService.success('Teléfono actualizado con éxito.');
      }),
      error: () => {
        this.loading = false;
      },
      complete: () => this.closeModal()
    })
  }

  myFormValues() {
    this.form = this.formBuilder.group({
      nroTelefono: ['', Validators.required],
      phoneId: [this.data.phoneId],
    });
  }
  
  closeModal() {
    this.dialogRef.close(this.f);
  }

}
