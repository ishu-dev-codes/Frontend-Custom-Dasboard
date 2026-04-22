import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';
import { AuthGuard } from './core/guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { LoginGuard } from './core/guards/login.guard';
import { ClientAccountsComponent } from './components/client-accounts/client-accounts.component';
import { ClientAccountsGuard } from './core/guards/client-accounts.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [LoginGuard] },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'client-accounts',
    component: ClientAccountsComponent,
    canActivate: [ClientAccountsGuard]
  },
  { path: 'auth/callback', component: AuthCallbackComponent }
];
