import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import {
  faTh,
  faSolarPanel,
  faCloudSunRain,
  faSun,
  faTemperatureHigh,
  faWind,
  faChargingStation,
  faMapMarkedAlt,
  faSign,
  faBolt,
  faChartBar,
  faSlidersH,
  faCommentDots,
  faClipboard,
  faTable, faClone, faUser, faInbox, faRadiation, faEthernet, faSitemap
} from '@fortawesome/free-solid-svg-icons';
import { HomeComponent } from './app-components/home/home.component';
import { AuthServiceModule } from './auth-service.module';
import { UserEntity } from './models/user-entity';

// Service
import { ThemeService } from './services/theme-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('homeComponent') homeComponent!: HomeComponent;

  // Login
  login = false;
  user: UserEntity | undefined;

  // Theme
  theme = "original";

  // Layout
  layout = "original";

  // Font awesome --------------------
  faTh = faTh;
  faSolarPanel = faSolarPanel;
  faSitemap = faSitemap;
  faCloudSunRain = faCloudSunRain;
  faSun = faSun;
  faUser = faUser;
  faTemperatureHigh = faTemperatureHigh;
  faWind = faWind;
  faChargingStation = faChargingStation;
  faClone = faClone;
  faMapMarkedAlt = faMapMarkedAlt;
  faSign = faSign;
  faBolt = faBolt;
  faChartBar = faChartBar;
  faSlidersH = faSlidersH;
  faCommentDots = faCommentDots;
  faClipboard = faClipboard;
  faTable = faTable;

  // 기상정보 ----------------------------
  panelOpenState = false;

  // 기타 --------------------------------
  title = 'CaptureStarWebApp';
  showFiller = true;
  sidenavOpened = true;


  constructor(public themeService: ThemeService, public authService: AuthServiceModule, private router: Router) {
    const today = new Date();
    const expirationDate = authService.getExpiration().toDate();

    if (authService.isAuth() && today > expirationDate) {
      this.login = true;
      this.user = JSON.parse(localStorage.getItem('account'));
    } else {
      this.login = false;
    }

    authService.changeEmitted$.subscribe((data) => {
      this.login = data;
      this.user = JSON.parse(localStorage.getItem('account'));
    })
  }

  ngAfterViewInit() {
  }

  logout() {
    console.log('logout');
    this.authService.logout();
    this.login = false;
    this.router.navigate(['/login']);
  }

  onMenuToggle() {
    if (this.sidenavOpened)
      this.sidenavOpened = false;
    else
      this.sidenavOpened = true;
  }

  onThemeChange(event: any) {
    switch (event.value) {
      case 'original':
        this.themeService.theme = 'original';
        break;
      case 'light':
        this.themeService.theme = 'light';
        break;
      case 'dark':
        this.themeService.theme = 'dark';
    }
  }

  onLayoutChange(event: any) {
    switch (event.value) {
      case 'original':
        this.themeService.layout = 'original';
        break;
      case 'layout1':
        this.themeService.layout = 'layout1';
        break;
      case 'layout2':
        this.themeService.layout = 'layout2';
        break;
      case 'layout3':
        this.themeService.layout = 'layout3';
        break;
    }
  }

  onRouterOutletActivate(component: any) {
    // component.theme = this.theme;
  }
}
