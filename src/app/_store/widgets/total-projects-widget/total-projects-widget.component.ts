import { Component, inject, input, OnInit } from '@angular/core';
import {
  MchartLineComponent, MchartTooltipBodyComponent,
  MchartTooltipComponent,
  MchartTooltipTitleComponent
} from '@elementar-ui/components/micro-chart';
import { Dashboard, DASHBOARD, Widget } from '@elementar-ui/components/dashboard';
import { DashboardService } from '../../../dashboard/dashboard.service';

@Component({
  selector: 'emr-total-projects-widget',
  imports: [
    MchartLineComponent,
    MchartTooltipComponent,
    MchartTooltipTitleComponent,
    MchartTooltipBodyComponent
  ],
  templateUrl: './total-projects-widget.component.html',
  styleUrl: './total-projects-widget.component.scss'
})
export class TotalProjectsWidgetComponent implements OnInit {
  private _dashboard = inject<Dashboard>(DASHBOARD, { optional: true });
  private _dashboardService = inject(DashboardService);

  companyCount = 0;
  data = [47, 54, 38, 24, 65, 37]; // Static chart for aesthetics
  labels = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

  widget = input<Widget>();

  ngOnInit() {
    if (this._dashboard && this.widget()) {
      this._dashboard.markWidgetAsLoaded(this.widget()?.id);
    }

    this._dashboardService.getStats().subscribe(stats => {
      this.companyCount = stats.companies;
    });
  }
}
