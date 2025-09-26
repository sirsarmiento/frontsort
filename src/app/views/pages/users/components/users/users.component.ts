import { MatTableDataSource } from '@angular/material/table';
import { User } from './../../../../../core/models/user';
import { UserService } from './../../../../../core/services/user.service';
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UsersComponent implements OnInit {
  users: User[];
  loading = true;
  selectedRow;
  displayedColumns: string[] = ['username', 'fullName', 'position', 'actions'];
  dataSource: MatTableDataSource<User>;
  
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;

  constructor(
    private userService: UserService,
    private router: Router,
    public _MatPaginatorIntl: MatPaginatorIntl
  ) {
        this.userService.userObservableData = null;
   }

  async ngOnInit() {
    this.users = await this.userService.getUsers({ page: 1, rowByPage: 9999, word: null });
    this.initTable(this.users);

    this._MatPaginatorIntl.itemsPerPageLabel="Usuarios por página";
  }

  initTable(user: User[]){
    this.dataSource = new MatTableDataSource(user);
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


  onEdit(row: User){
    this.router.navigate(['/users/add-user']);
    this.userService.userObservableData = row;
  }

  openAdd(){
    this.router.navigate(['/users/add-user']);
  }

  onDelele(id:number, name: string){
    Swal.fire({
      title:  `¿ Estás seguro que deseas desactivar a ${ name }?`,
      showDenyButton: true,
      confirmButtonText: `Eliminar`,
    }).then((result) => {
      if (result.isConfirmed){
        console.log(id);
        //this.userService.delete(id).subscribe(() => {
          //Swal.fire('Eliminada!', '', 'success')
        //})
      }
    })
  }
}
