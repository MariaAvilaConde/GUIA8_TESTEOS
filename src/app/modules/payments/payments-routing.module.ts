import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaymentListComponent } from './components/payment-list/payment-list.component';
import { PaymentFormComponent } from './components/payment-form/payment-form.component';
import { PaymentDetailComponent } from './components/payment-detail/payment-detail.component';
import { ReceiptGeneratorComponent } from './components/receipt-generator/receipt-generator.component';

const routes: Routes = [
  {
        path: '',
        component: PaymentListComponent
  },
  {
        path: 'new',
        component: PaymentFormComponent
  },
  {
        path: 'edit/:id',
        component: PaymentFormComponent
  },
  {
        path: 'detail/:id',
        component: PaymentDetailComponent
  }
  ,
  {
        path: 'receipt',
        component: ReceiptGeneratorComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PaymentsRoutingModule { }
