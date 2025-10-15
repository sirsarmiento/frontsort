import { User } from './../../../core/models/user';
import { AuthService } from './../../../core/services/auth.service';
import { Component, OnInit } from '@angular/core';

import { BaseComponent } from '../../shared/components/base/base.component';
import { BillService } from 'src/app/core/services/Lotery/bill.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  preserveWhitespaces: true
})
export class DashboardComponent extends BaseComponent implements OnInit {

  user:User;
  tickets: number = 0;
  bills: number = 0;
  clients: number = 0;

  constructor(
    private authService: AuthService,
    private billService: BillService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.user = this.authService.currentUser;
    this.getResumen();
  }

 
  getResumen(){
    this.billService.getTotalTickets().subscribe(( resp => {
      this.bills = resp.data.totalFacturas;
      this.tickets = resp.data.totalTickets;
    }))
  }
}