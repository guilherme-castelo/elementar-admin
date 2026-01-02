import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  AfterViewInit,
  TemplateRef,
  ContentChildren,
  QueryList,
  Directive,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule, SortDirection } from '@angular/material/sort';
import {
  MatPaginatorModule,
  MatPaginator,
  MatPaginatorIntl,
} from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { getPtBrPaginatorIntl } from '../../../shared/helpers/paginator-intl';

export interface TableColumn {
  def: string;
  header: string;
  type?: 'text' | 'template'; // default text
  content?: (row: any) => string; // used for rendering text cell
  template?: TemplateRef<any>; // used for rendering template cell
  sortable?: boolean; // default true
  sortAccessor?: (row: any) => string | number; // used for sorting (priority)
}

export interface FilterConfig {
  key: string;
  label: string;
  type?: 'text'; // default text
  widthClass?: string; // e.g. 'w-24', 'w-full'
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  providers: [{ provide: MatPaginatorIntl, useValue: getPtBrPaginatorIntl() }],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
})
export class DataTableComponent implements OnChanges, AfterViewInit, OnInit {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() filters: FilterConfig[] = [];
  @Input() pageSizeOptions: number[] = [10, 25, 50, 100];
  @Input() filterPredicate?: (data: any, filter: string) => boolean;
  @Input() defaultSortActive: string = '';
  @Input() defaultSortDirection: SortDirection = 'asc';
  @Input() showFilters: boolean = false;

  private fb = inject(FormBuilder);
  filterForm!: FormGroup;

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.dataSource.data = this.data || [];
    }

    if (changes['columns']) {
      this.displayedColumns = this.columns.map((c) => c.def);
    }

    if (changes['filterPredicate'] && this.filterPredicate) {
      this.dataSource.filterPredicate = this.filterPredicate;
    }

    // If filters definition changes, rebuild form
    if (changes['filters'] && !changes['filters'].firstChange) {
      this.initForm();
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.setupSortingAccessor();
  }

  private initForm() {
    const group: any = {};
    if (this.filters) {
      this.filters.forEach((f) => {
        group[f.key] = [''];
      });
    }
    this.filterForm = this.fb.group(group);

    this.filterForm.valueChanges.subscribe((values) => {
      this.applyFilters(values);
    });
  }

  private applyFilters(values: any) {
    const processedValues: any = {};
    Object.keys(values).forEach((key) => {
      processedValues[key] = (values[key] || '').toLowerCase();
    });

    const filterString = JSON.stringify(processedValues);
    this.dataSource.filter = filterString;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearFilters() {
    this.filterForm.reset();
  }

  private setupSortingAccessor() {
    this.dataSource.sortingDataAccessor = (item: any, property: string) => {
      const col = this.columns.find((c) => c.def === property);
      let value: any;

      if (col && col.sortAccessor) {
        value = col.sortAccessor(item);
      } else {
        value = property.split('.').reduce((o, i) => (o ? o[i] : null), item);
      }

      if (value === null || value === undefined) return '';

      if (typeof value === 'string') {
        const num = Number(value);
        if (!isNaN(num) && value.trim() !== '') {
          return num;
        }
        return value.toLowerCase();
      }

      return value;
    };
  }
}
