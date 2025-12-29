import { Component } from '@angular/core';
import { AnnouncementGlobalComponent } from '@elementar-ui/components/announcement';
import { HeaderComponent } from '../../_app/header/header.component';
import { IncidentsContainerComponent } from '@elementar-ui/components/incidents';
import {
  LayoutBodyComponent,
  LayoutComponent,
  LayoutHeaderComponent,
  LayoutSidebarComponent, LayoutTopbarComponent
} from '@elementar-ui/components/layout';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../_app/sidebar/sidebar.component';

@Component({
  selector: 'app-admin-layout',
  imports: [
    AnnouncementGlobalComponent,
    HeaderComponent,
    IncidentsContainerComponent,
    LayoutBodyComponent,
    LayoutComponent,
    LayoutHeaderComponent,
    LayoutSidebarComponent,
    LayoutTopbarComponent,
    RouterOutlet,
    SidebarComponent
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {

}
