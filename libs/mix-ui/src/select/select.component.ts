import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { ControlValueAccessor, ReactiveFormsModule } from '@angular/forms';
import { BaseTextControl } from '@mixcore/ui/base-control';
import { TuiDestroyService, tuiPure } from '@taiga-ui/cdk';
import {
  TuiDataListModule,
  TuiDropdownModule,
  TuiTextfieldControllerModule,
} from '@taiga-ui/core';
import {
  TuiComboBoxModule,
  TuiDataListWrapperModule,
  TuiStringifyContentPipeModule,
} from '@taiga-ui/kit';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'mix-select',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TuiComboBoxModule,
    TuiDataListWrapperModule,
    TuiDataListModule,
    TuiStringifyContentPipeModule,
    TuiTextfieldControllerModule,
    TuiDropdownModule,
  ],
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  providers: [TuiDestroyService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MixSelectComponent
  extends BaseTextControl
  implements ControlValueAccessor, OnInit
{
  destroy$ = inject(TuiDestroyService);

  @Input() public items: any = [];
  @Input() public labelKey = '';
  @Input() public override placeHolder = 'Type';
  @Input() public size: 'm' | 's' | 'l' = 'm';
  @Input() public labelProcess?: (item: any) => string = undefined;

  @tuiPure
  stringify(item: any) {
    if (!this.labelProcess)
      return `${this.labelKey ? item[this.labelKey] || '' : item}`;

    return this.labelProcess(item);
  }

  @Input() selfControl = false;
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  ngOnInit() {
    if (this.selfControl) this.defaultControl.setValue(this.value);
    this.control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((v) => {
      this.valueChange.emit(v);
    });
  }
}
