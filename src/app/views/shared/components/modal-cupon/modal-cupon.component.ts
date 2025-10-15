import { Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { BillQr, ClientBill, LocalBill } from 'src/app/core/models/Lotery/bill';
import { BillService } from 'src/app/core/services/Lotery/bill.service';
import Swal from 'sweetalert2';
export interface DialogData { bill: BillQr }


@Component({
  selector: 'app-modal-cupon',
  styleUrls: ['./modal-cupon.component.scss'],
  templateUrl: './modal-cupon.component.html'
})
export class ModalCuponComponent implements OnInit {
  selectedRow;
  displayedColumns: string[] = ['fullName','dependence','position'];
  dataSource: MatTableDataSource<any>;

  constructor(
     private billService: BillService,
     public dialogRef: MatDialogRef<ModalCuponComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  //@Input() data: any;

  // Propiedades separadas para facilitar el acceso en el template
  id: number = 0;
  numero: string = '';
  fecha: string = '';
  hora: string = '';
  monto: number = 0;
  montoMin: number = 0;
  tasa: number = 0;
  print: number = 0;
  cupones: number = 0;
  cliente: ClientBill = {} as ClientBill;
  local: LocalBill = {} as LocalBill;
  cuponesArray: number[] = [];

  ngOnInit() {
    this.initializeData();
  }

  initializeData() {
    if (this.data) {
      this.id = this.data.bill.id;
      this.numero = this.data.bill.numero;
      this.fecha = this.data.bill.fecha.toString();
      this.hora = this.data.bill.hora;
      this.monto = this.data.bill.monto;
      this.montoMin = this.data.bill.montoMin;
      this.tasa = this.data.bill.tasa;
      this.print = this.data.bill.print;
      this.cupones = this.getCupones(this.data.bill);
      this.cliente = this.data.bill.cliente;
      this.local = this.data.bill.local;
      // Crear array para el *ngFor
      this.cuponesArray = Array(this.cupones).fill(0).map((x, i) => i);
    }
  }

  getCupones(row: BillQr){
    return Math.trunc(row.monto / row.montoMin);
  }

  generarQRData(index: number): string {
    // Concatenar tipoDocumentoIdentidad + nroDocumentoIdentidad
    const documento = `${this.cliente.tipoDocumentoIdentidad}${this.cliente.nroDocumentoIdentidad}`;
    
    // Crear ID único para cada cupón: local.id + numero + índice
    const cuponId = `${this.local.id}${this.numero}${index + 1}`;
    
    // agregar url de abajo al qr
    //https://platformsorteosstage.pafar.com.ve/ganador?clienteId=123&localId=456&billNumber=789

    // Datos para el QR (puedes modificar según lo que necesites codificar)
    const qrData = {
      cuponId: cuponId,
      cliente: this.cliente,
      fecha: this.fecha,
      monto: this.monto,
      local: this.local.nombre,
      cuponNumero: index + 1,
      totalCupones: this.cupones
    };

    return JSON.stringify(qrData);
  }

  // Método para obtener el ID para mostrar en el template
  getCuponId(index: number): string {
    return `${this.local.id}${this.numero}${index + 1}`;
  }

  onPrint() {
    Swal.fire({
      title:  `¿ Estás seguro que deseas imprimir?`,
      showDenyButton: true,
      confirmButtonText: `Imprimir`,
    }).then((result) => {
      if (result.isConfirmed){
        this.billService.editPrint(this.id, 1).subscribe();
      }
    })
  }

  onEmail() {
    // Lógica para enviar el cupón por email
    console.log('Enviar cupón por email');
  }

  closeModal() {
    this.dialogRef.close();
  }

}
