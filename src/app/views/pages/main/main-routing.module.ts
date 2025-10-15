import { GetMenuOptions } from './../../../core/resolvers/user.resolver';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './../../../core/guard/auth.guard';
import { BaseComponent } from '../../layout/base/base.component';
import { RoleGuard } from 'src/app/core/guard/role.guard';
//import { NotificationResolver } from '../../../core/resolvers/notification.resolver';

const routes: Routes = [
  { path: '',
    component: BaseComponent,
    canActivate: [AuthGuard],
    resolve:{
      options: GetMenuOptions,
      //notifications: NotificationResolver
    },
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('../dashboard/dashboard.module').then(m => m.DashboardModule),
        canActivate: [RoleGuard],
        data: { roles: ['ADMINISTRADOR', 'PROMOTOR'] }
      },
      {
        path: 'users',
        loadChildren: () => import('../users/users.module').then(m => m.UsersModule),
        canActivate: [RoleGuard],
        data: { roles: ['ADMINISTRADOR'] }
      },
      {
        path: 'password',
        loadChildren: () => import('../password/password.module').then(m => m.PasswordModule),
      },
      {
        path: 'tasas',
        loadChildren: () => import('../lotery/tasas/tasas.module').then(m => m.TasasModule),
        canActivate: [RoleGuard],
        data: { roles: ['ADMINISTRADOR'] }
      },
      {
        path: 'locales',
        loadChildren: () => import('../lotery/locales/locales.module').then(m => m.LocalesModule),
        canActivate: [RoleGuard],
        data: { roles: ['ADMINISTRADOR'] }
      },
      {
        path: 'bills',
        loadChildren: () => import('../lotery/bills/bills.module').then(m => m.BillsModule),
        canActivate: [RoleGuard],
        data: { roles: ['ADMINISTRADOR', 'PROMOTOR'] }
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainRoutingModule { }
