import { Component, inject, input, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatRipple } from '@angular/material/core';
import { MatTooltip } from '@angular/material/tooltip';
import { Dashboard, DASHBOARD, Widget } from '@elementar-ui/components/dashboard';
import { DashboardService } from '../../../dashboard/dashboard.service';

@Component({
  selector: 'emr-total-subscribers-widget',
  imports: [
    MatIcon,
    MatRipple,
    MatTooltip
  ],
  templateUrl: './total-subscribers-widget.component.html',
  styleUrl: './total-subscribers-widget.component.scss'
})
export class TotalSubscribersWidgetComponent implements OnInit {
  private _dashboard = inject<Dashboard>(DASHBOARD, { optional: true });
  private _dashboardService = inject(DashboardService);

  widget = input<Widget>();
  userCount = 0;

  ngOnInit() {
    if (this._dashboard && this.widget()) {
      this._dashboard.markWidgetAsLoaded(this.widget()?.id);
    }

    this._dashboardService.getStats().subscribe(stats => {
      this.userCount = stats.users;
    });
  }
}
