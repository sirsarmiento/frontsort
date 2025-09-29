import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Local } from 'src/app/core/models/Lotery/local';
import { LocalService } from 'src/app/core/services/Lotery/local.service';

@Component({
  selector: 'app-local',
  templateUrl: './local.component.html'
})
export class LocalComponent implements OnInit {

  loading = true;
  selectedRow;
  displayedColumns: string[] = [ 'nombre', 'monto', 'actions'];
  dataSource: MatTableDataSource<Local>;
  totalDepreciacionMensual: number = 0;

    
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;

  constructor(
    private localService: LocalService,
    private router: Router,
    public matDialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.getLocales();
  }

  getLocales(){
    this.localService.getAll().subscribe((resp: any) => {
      this.initTable(resp.data);
    });
  }

  initTable(local: Local[]){
    this.dataSource = new MatTableDataSource(local);
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

  onEdit(row: Local){
    this.router.navigate(['/locales/add-local']);
    this.localService.sharingData = row;
  }

  openAdd(){
    this.router.navigate(['/locales/add-local']);
  }

}
