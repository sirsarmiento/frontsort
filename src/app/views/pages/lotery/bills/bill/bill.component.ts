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
      this.initTable(resp.data);
    });
  }

  initTable(bill: Bill[]){
    this.dataSource = new MatTableDataSource(bill);
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
      width: '38%',
      disableClose: true,
      id: 'modal-params'
    });
  }

  getCupones(row: BillQr){
    return Math.trunc(row.monto / row.montoMin);
  }

  onViewDocument(row: ClientBill){
    this.matDialog.open(ModalGenericComponent, {
      data: { urlPhoto:  row.fotoCedula },
      width: '38%',
      disableClose: true,
      id: 'modal-params'
    });
  }

}
