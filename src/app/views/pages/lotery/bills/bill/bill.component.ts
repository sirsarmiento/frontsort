import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Bill, BillQr, ClientBill } from 'src/app/core/models/Lotery/bill';
import { BillService } from 'src/app/core/services/Lotery/bill.service';
import { ModalGenericComponent } from 'src/app/views/shared/components/modal-generic/modal-generic.component';
import { ModalCuponComponent } from 'src/app/views/shared/components/modal-cupon/modal-cupon.component';
import { ModalImageBillComponent } from 'src/app/views/shared/components/modal-image-bill/modal-image-bill.component';
import { ModalPhoneComponent } from 'src/app/views/shared/components/modal-phone/modal-phone.component';

@Component({
  selector: 'app-bill',
  templateUrl: './bill.component.html'
})
export class BillComponent implements OnInit {

  loading = true;
  selectedRow;
  displayedColumns: string[] = ['cedula','cliente', 'local', 'numero', 'fecha', 'monto', 'cupones' , 'actions'];
  dataSource: MatTableDataSource<Bill>;
  totalDepreciacionMensual: number = 0;

  bills: Bill[] = [];
    
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;

  constructor(
    private billService: BillService,
    private router: Router,
    public matDialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.getBills();
  }

  getBills(){
    this.billService.getAll().subscribe((resp: any) => {
      this.bills = resp.data;
      this.initTable(this.bills);
    });
  }
  

  initTable(bill: Bill[]){
    this.dataSource = new MatTableDataSource(bill);
    // Definir el filterPredicate para buscar en campos anidados
    this.dataSource.filterPredicate = (data: Bill, filter: string): boolean => {
      // Concatenamos los valores de los campos que queremos filtrar
      const dataStr = 
        data.cliente.nroDocumentoIdentidad.toLowerCase() + 
        data.cliente.nombreCompleto.toLowerCase() + 
        data.local['nombre'].toLowerCase() + 
        data.numero + 
        data.fecha + 
        data.monto + 
        data.tickets;
      // Transformamos el filter a minúsculas
      const transformedFilter = filter.trim().toLowerCase();
      return dataStr.indexOf(transformedFilter) !== -1;
    };

    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
    this.loading = false;
  }


  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onEdit(row: Bill){
    this.router.navigate(['/bills/add-bill']);

    this.billService.sharingData = row;
  }

  openAdd(){
    this.router.navigate(['/bills/add-bill']);
  }

  onCupon(row: BillQr){
    this.matDialog.open(ModalCuponComponent, {
      data: { bill:  row },
      width: '80%',
      disableClose: true,
      id: 'modal-params'
    });
  }

  onViewDocument(id: number, fotoCedula: string){
    this.matDialog.open(ModalGenericComponent, {
      data: { id: id, urlPhoto:  fotoCedula },
      width: '80%',
      disableClose: true,
      id: 'modal-params'
    });
  }

  addBill(id: number){
    this.matDialog.open(ModalImageBillComponent, {
      data: { id:  id },
      width: '80%',
      disableClose: true,
      id: 'modal-add-image-bill'
    });
  }

  onPhone(row: Bill){
    const dialogRef = this.matDialog.open(ModalPhoneComponent, {
      data: { phoneId: row.cliente.telefonoId, phone: row.cliente.telefono },
      width: '400px',
      disableClose: true,
      id: 'modal-phone'
    });

    dialogRef.afterClosed().subscribe((data) => {
      if (data != undefined) {
        this.bills = this.bills.filter((value) => {
          if (value.cliente.telefonoId === data.phoneId.value) {
            value.cliente.telefono = data.nroTelefono.value;
          }

          return true;
        });
      }
    });
  }
}
