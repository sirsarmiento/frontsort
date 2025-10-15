import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Tasa } from 'src/app/core/models/Lotery/tasa';
import { TasaService } from 'src/app/core/services/Lotery/tasa.service';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-tasa',
  templateUrl: './tasa.component.html'
})
export class TasaComponent implements OnInit {

  loading = true;
  selectedRow;
  displayedColumns: string[] = ['monto','fecha'];
  dataSource: MatTableDataSource<Tasa>;
    
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;

  constructor(
    private authService:AuthService,
    private tasaService: TasaService,
    private router: Router,
    public matDialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.getTasas();
  }

  getTasas(){
    this.tasaService.getAll().subscribe((resp: any) => {
      this.initTable(resp.data);
    });
  }

  initTable(tasa: Tasa[]){
    this.dataSource = new MatTableDataSource(tasa);
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }

    this.loading = false;
    this.paginator._intl.itemsPerPageLabel = 'Filas';
  }


  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onEdit(row: Tasa){
    this.router.navigate(['/tasas/add-tasa']);
    this.tasaService.sharingData = row;
  }

  openAdd(){
    this.router.navigate(['/tasas/add-tasa']);
  }

}
