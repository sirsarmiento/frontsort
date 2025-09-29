import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Bill } from 'src/app/core/models/Lotery/bill';
import { BillService } from 'src/app/core/services/Lotery/bill.service';

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

  bills: any[] = [
    {cedula: '13.044.519', cliente: 'Sir Sarmiento', local: 'Farmatodo', numero: '09081290', monto: 1500.20, montoMin: 1200.20, fecha: '2025-09-28', print: 0},
    {cedula: '13.033.501', cliente: 'Ernesto Perez', local: 'Locatel', numero: '09081211', monto: 2700.10,  montoMin: 1200.20, fecha: '2025-09-27', print: 1},
  ];

    
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;

  constructor(
    private billService: BillService,
    private router: Router,
    public matDialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.initTable(this.bills);
    //this.getBills();
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

  onPrint(row: Bill){
    console.log('Imprimir', row);
  }

  onEmail(row: Bill){
    console.log('Email', row);
  }

  getCupones(row: Bill){
    return row.monto / row.montoMin;
  }

}
