import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import { DataType, DataTypeColors } from '@mixcore/lib/model';
import {
  TuiButtonModule,
  TuiDataListModule,
  TuiHostedDropdownModule,
} from '@taiga-ui/core';
import { TUI_ARROW } from '@taiga-ui/kit';
import { IHeaderAngularComp } from 'ag-grid-angular';
import { IHeaderParams, SortDirection } from 'ag-grid-community';

export interface ICustomHeaderParams {
  displayName: string;
  dataType: DataType;
  columnType: 'check' | 'action' | 'value';
}

@Component({
  selector: 'mix-custom-header',
  standalone: true,
  imports: [
    CommonModule,
    TuiHostedDropdownModule,
    TuiDataListModule,
    TuiButtonModule,
  ],
  templateUrl: './custom-header.component.html',
  styleUrls: ['./custom-header.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomHeaderComponent implements IHeaderAngularComp {
  public params!: IHeaderParams & ICustomHeaderParams;
  public ascSort!: string;
  public descSort!: string;
  public noSort!: string;
  public isPinned = false;
  public parentComp: any;

  readonly drinks = ['Cola', 'Tea', 'Coffee', 'Slurm'];
  readonly arrow = TUI_ARROW;
  readonly dataTypeColors = DataTypeColors;

  public agInit(params: IHeaderParams & ICustomHeaderParams): void {
    this.params = params;
    this.isPinned = !!params.column.getPinned();
    this.parentComp = this.params.context.componentParent;

    params.column.addEventListener(
      'sortChanged',
      this.onSortChanged.bind(this)
    );
  }

  public onSortChanged() {
    this.ascSort = this.descSort = this.noSort = 'inactive';
    if (this.params.column.isSortAscending()) {
      this.ascSort = 'active';
    } else if (this.params.column.isSortDescending()) {
      this.descSort = 'active';
    } else {
      this.noSort = 'active';
    }
  }

  public onSortRequested(order: SortDirection, event: any) {
    this.params.setSort(order, event.shiftKey);
  }

  public pinColumn() {
    const pinned = this.isPinned ? false : 'left';
    this.params.columnApi.setColumnPinned(
      this.params.column.getColId(),
      pinned
    );
  }

  public refresh(params: IHeaderParams<any, any>): boolean {
    return false;
  }
}
