import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  NgZone,
  OnInit,
  QueryList,
  ViewChildren,
  inject,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  DbContextFixId,
  MixColumn,
  MixDatabase,
  MixRelationShip,
} from '@mixcore/lib/model';
import { DatabaseSelectComponent } from '@mixcore/share/components';
import { FormHelper, MixFormErrorComponent } from '@mixcore/share/form';
import { toastObserverProcessing } from '@mixcore/share/helper';
import { MixButtonComponent } from '@mixcore/ui/button';
import { MixInlineInputComponent } from '@mixcore/ui/inline-input';
import { MixInputComponent } from '@mixcore/ui/input';
import { ModalService } from '@mixcore/ui/modal';
import { MixSelectComponent } from '@mixcore/ui/select';
import { HotToastService } from '@ngneat/hot-toast';
import { TuiLoaderModule } from '@taiga-ui/core';
import { TuiTabsModule } from '@taiga-ui/kit';
import { takeUntil } from 'rxjs';
import { CMS_ROUTES } from '../../../../app.routes';
import { EntityFormComponent } from '../../../../components/entity-form/entity-form.component';
import { DetailPageKit } from '../../../../shares/kits/page-detail-base-kit.component';
import { DatabaseStore } from '../../../../stores/database.store';
import { DatabaseEntityComponent } from '../components/database-entity/database-entity.component';
import { DatabaseInfoComponent } from '../components/database-info/database-info.component';
import { DatabaseMigrationComponent } from '../components/database-migration/database-migration.component';
import { DatabasePermissionComponent } from '../components/database-permission/database-permission.component';
import { DatabaseRelationshipComponent } from '../components/database-relationship/database-relationship.component';
import { DbContextSelectComponent } from '../components/db-context-select/db-context-select.component';

@Component({
  selector: 'mix-database-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TuiTabsModule,
    TuiLoaderModule,
    MixInputComponent,
    MixButtonComponent,
    MixSelectComponent,
    MixFormErrorComponent,
    MixInlineInputComponent,
    DatabaseSelectComponent,
    EntityFormComponent,
    DatabaseRelationshipComponent,
    DatabaseEntityComponent,
    DatabaseInfoComponent,
    DatabasePermissionComponent,
    DatabaseMigrationComponent,
    DbContextSelectComponent,
  ],
  templateUrl: './database-detail.component.html',
  styleUrls: ['./database-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatabaseDetailComponent extends DetailPageKit implements OnInit {
  @ViewChildren(EntityFormComponent)
  entityForms!: QueryList<EntityFormComponent>;

  public toast = inject(HotToastService);
  public router = inject(Router);
  public databaseStore = inject(DatabaseStore);
  public modal = inject(ModalService);
  public zone = inject(NgZone);

  public data: MixDatabase | undefined = undefined;
  public form = new FormGroup({
    displayName: new FormControl('', Validators.required),
    systemName: new FormControl('', Validators.required),
    description: new FormControl(''),
    updatePermissions: new FormControl<string[]>([]),
    deletePermissions: new FormControl<string[]>([]),
    createPermissions: new FormControl<string[]>([]),
    readPermissions: new FormControl<string[]>([]),
    mixDatabaseContextId: new FormControl(),
  });

  ngOnInit() {
    this.activeRoute.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.id = params['id'];
        this.data = undefined;
        this.form.reset();

        if (!this.id || this.id === 'create') {
          this.mode = 'create';
          this.data = {
            columns: [],
          } as any;

          const contextId =
            this.activeRoute.snapshot.queryParams['mixDatabaseContextId'];
          this.updateDbContext(contextId ? parseInt(contextId) : undefined);
          return;
        }

        this.mode = 'update';
        this.mixApi.databaseApi
          .getById(this.id)
          .pipe(takeUntil(this.destroy$), this.observerLoadingState())
          .subscribe((v) => {
            this.data = new MixDatabase(v);
            this.form.patchValue(this.data, { emitEvent: false });
            this.cdr.detectChanges();
          });
      });
  }

  public updateDbContext(id: number | undefined) {
    this.form.controls.mixDatabaseContextId.patchValue(id);
  }

  public submit(): void {
    if (this.entityForms.some((v) => !v.validate())) {
      this.activeTabIndex = 1;
      return;
    }

    if (!FormHelper.validateForm(this.form)) {
      this.activeTabIndex = 0;
      return;
    }

    const formValue = this.form.value as MixDatabase;
    this.mixApi.databaseApi
      .save({
        ...this.data,
        ...formValue,
        mixDatabaseContextId:
          formValue.mixDatabaseContextId === DbContextFixId.MasterDb
            ? undefined
            : formValue.mixDatabaseContextId,
        readPermissions: JSON.stringify(formValue.readPermissions || []) as any,
        createPermissions: JSON.stringify(
          formValue.createPermissions || []
        ) as any,
        updatePermissions: JSON.stringify(
          formValue.updatePermissions || []
        ) as any,
        deletePermissions: JSON.stringify(
          formValue.deletePermissions || []
        ) as any,
      })
      .pipe(
        this.toast.observe({
          loading: `${this.mode === 'create' ? 'Creating' : 'Saving'} table`,
          success: 'Successfully applied change',
          error: 'Something error, please try again later.',
        })
      )
      .subscribe({
        next: (value) => {
          if (this.mode === 'create') {
            this.mode = 'update';
          }

          this.databaseStore.reload();
          this.data = new MixDatabase(value);
          this.cdr.detectChanges();
        },
      });
  }

  public selectedTableChange(ev: MixDatabase) {
    if (ev.id == this.id) return;

    this.router.navigateByUrl(
      `${CMS_ROUTES.portal.database.fullPath}/${ev.id}`
    );
  }

  public onColumnsChange(columns: MixColumn[]) {
    if (!this.data) return;

    this.data.columns = columns;
  }

  public onRelationshipChange(value: Partial<MixRelationShip>[]) {
    if (this.data) this.data.relationships = value as MixRelationShip[];
  }

  public onDeleteRelationship(value: Partial<MixRelationShip>) {
    this.modal.asKForAction('Are you sure to delete this referrence?', () => {
      this.mixApi.databaseRelation
        .deleteById(value.id as number)
        .pipe(toastObserverProcessing(this.toast))
        .subscribe({
          next: () => {
            this.data!.relationships = this.data!.relationships.filter(
              (x) => x.id !== value.id
            );
            this.cdr.detectChanges();
          },
        });
    });
  }

  async goDatabaseData(sysName: string) {
    await this.router.navigateByUrl(
      `${CMS_ROUTES.portal.databaseQuery.fullPath}/${sysName}`
    );
  }
}
