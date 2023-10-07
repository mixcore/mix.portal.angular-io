import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MixApiFacadeService } from '@mixcore/share/api';
import { BaseComponent } from '@mixcore/share/base';
import { FormHelper, MixFormErrorComponent } from '@mixcore/share/form';
import { MixButtonComponent } from '@mixcore/ui/button';
import { MixErrorAlertComponent } from '@mixcore/ui/error';
import { MixInputComponent } from '@mixcore/ui/input';
import { MixSelectComponent } from '@mixcore/ui/select';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { HotToastService } from '@ngneat/hot-toast';
import { UserInfoStore } from '../../../../../stores/user-info.store';
import { UserStore } from '../../../../../stores/user.store';

@Component({
  selector: 'mix-create-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MixInputComponent,
    MixSelectComponent,
    MixButtonComponent,
    MixErrorAlertComponent,
    MixFormErrorComponent,
  ],
  templateUrl: './create-user-dialog.component.html',
  styleUrls: ['./create-user-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateUserDialogComponent extends BaseComponent {
  public store = inject(UserStore);
  public infoStore = inject(UserInfoStore);

  public mixApi = inject(MixApiFacadeService);
  public dialog = inject(DialogService);
  public toast = inject(HotToastService);
  public dialogRef = inject(DialogRef);

  public serverError = signal('');
  public registerForm = new FormGroup({
    avatar: new FormControl('', { validators: [], nonNullable: true }),
    username: new FormControl('', {
      validators: [Validators.required, Validators.email],
      nonNullable: true,
    }),
    password: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    confirmPassword: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    firstName: new FormControl('', { validators: [], nonNullable: true }),
    lastName: new FormControl('', { validators: [], nonNullable: true }),
    email: new FormControl(),
  });

  public createUserClick(): void {
    if (!FormHelper.validateForm(this.registerForm)) return;

    const formValue = this.registerForm.getRawValue();
    const request = {
      ...formValue,
      email: formValue.username,
    };

    this.mixApi.accountApi
      .createUser(request)
      .pipe(this.observerLoadingStateSignal())
      .subscribe({
        next: () => {
          this.toast.success('Successfully create new user');
          this.store.reload();
          this.infoStore.reload();
          this.dialogRef.close();
        },
        error: (error: HttpErrorResponse) => {
          const commonMsg = 'Something error, please try again later!';

          if (error.error instanceof Array) {
            this.serverError.set(error.error[0] || commonMsg);
          } else {
            this.serverError.set(commonMsg);
          }
        },
      });
  }
}
