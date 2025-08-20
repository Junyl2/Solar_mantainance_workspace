// Angular
import { NgxPaginationModule } from 'ngx-pagination';

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

// Angular Overlay
import { OverlayModule } from '@angular/cdk/overlay';

// Application
import { AppComponent } from './app.component';
import { HomeComponent } from './app-components/home/home.component';
import { SettingComponent } from './app-components/setting/setting.component';
import { GenerationQuantityComponent } from './app-components/generation-quantity/generation-quantity.component';

// UI Components
import { BarChartComponent } from './ui-components/bar-chart/bar-chart.component';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatStepperModule } from '@angular/material/stepper';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';

// Angular Material Datepicker
import { MAT_DATE_LOCALE } from '@angular/material/core';

// Font Awesome
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

// Components
import { WeatherInfoComponent } from './app-components/weather-info/weather-info.component';
import { SolarQuantityComponent } from './app-components/solar-quantity/solar-quantity.component';
import { TempHumiComponent } from './app-components/temp-humi/temp-humi.component';
import { WindComponent } from './app-components/wind/wind.component';
import { EfficiencyComponent } from './app-components/efficiency/efficiency.component';
import { InstallComponent } from './app-components/install/install.component';
import { ReferenceComponent } from './app-components/reference/reference.component';
import { SolarEfficiencyComponent } from './app-components/solar-efficiency/solar-efficiency.component';
import { CustomComponent } from './app-components/custom/custom.component';
import { GenerationBoardComponent } from './app-components/home/generation-board/generation-board.component';
import { TotalGenerationBoardComponent } from './app-components/home/total-generation-board/total-generation-board.component';
import { WeatherBoardComponent } from './app-components/home/weather-board/weather-board.component';
import { TotalWeatherBoardComponent } from './app-components/home/total-weather-board/total-weather-board.component';
import { TransferBoardComponent } from './app-components/home/transfer-board/transfer-board.component';
import { QuestionComponent } from './app-components/question/question.component';
import { NotificationComponent } from './app-components/notification/notification.component';
import { QuestionDetailComponent } from './app-components/question/question-detail/question-detail.component';
import { QuestionRegisterComponent } from './app-components/question/question-register/question-register.component';
import { NotificationDetailComponent } from './app-components/notification/notification-detail/notification-detail.component';
import { SemsHttpInterceptor } from './services/sems-http-interceptor';
import { LoginComponent } from './login/login.component';
import { AuthServiceModule } from './auth-service.module';
import { AuthGuard } from './services/auth.guard';
import { InvertorAlarmComponent } from './app-components/invertor-alarm/invertor-alarm.component';
import { NoticeBoardComponent } from './app-components/home/notice-board/notice-board.component';
import { MyInfoComponent } from './my-info/my-info.component';
import { DownloadInvertorComponent } from './download-invertor/download-invertor.component';
import { DownloadWeatherComponent } from './download-weather/download-weather.component';
import { SunlightArrayMapComponent } from './app-components/sunlight-array-map/sunlight-array-map.component';
import { ModuleGenerationComponent } from './app-components/module-generation/module-generation.component';
import { ModuleGenerationDetailComponent } from './app-components/module-generation/module-generation-detail/module-generation-detail.component';
import { EnvironmentComponent } from './app-components/analyze/environment/environment.component';
import { PrComponent } from './app-components/analyze/pr/pr.component';
import { TemperatureComponent } from './app-components/analyze/temperature/temperature.component';
import { UseRateComponent } from './app-components/analyze/use-rate/use-rate.component';
import { SolarEnergyGenerationBoardComponent } from './app-components/home/solar-energy-generation-board/solar-energy-generation-board.component';
import { DownloadOptimizerComponent } from './download-optimizer/download-optimizer.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: HomeComponent, canActivate: [AuthGuard] },
  {
    path: 'generationquantity',
    component: GenerationQuantityComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'weather',
    component: WeatherInfoComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'solar',
    component: SolarQuantityComponent,
    canActivate: [AuthGuard],
  },
  { path: 'temphumi', component: TempHumiComponent, canActivate: [AuthGuard] },
  { path: 'wnd', component: WindComponent, canActivate: [AuthGuard] },
  {
    path: 'efficiency',
    component: EfficiencyComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'invertor/alarm',
    component: InvertorAlarmComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'module-generation',
    component: ModuleGenerationComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'module-generation/:id',
    component: ModuleGenerationDetailComponent,
    canActivate: [AuthGuard],
  },
  { path: 'install', component: InstallComponent, canActivate: [AuthGuard] },
  { path: 'ref', component: ReferenceComponent, canActivate: [AuthGuard] },
  {
    path: 'solareffici',
    component: SolarEfficiencyComponent,
    canActivate: [AuthGuard],
  },
  { path: 'custom', component: CustomComponent, canActivate: [AuthGuard] },
  { path: 'question', component: QuestionComponent, canActivate: [AuthGuard] },
  {
    path: 'question/register',
    component: QuestionRegisterComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'question/:id',
    component: QuestionDetailComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'notification',
    component: NotificationComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'notification/:id',
    component: NotificationDetailComponent,
    canActivate: [AuthGuard],
  },
  { path: 'my', component: MyInfoComponent, canActivate: [AuthGuard] },
  { path: 'setting', component: SettingComponent, canActivate: [AuthGuard] },
  {
    path: 'download/invertor',
    component: DownloadInvertorComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'download/optimizer',
    component: DownloadOptimizerComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'download/weather',
    component: DownloadWeatherComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'invertor/sunlight-array',
    component: SunlightArrayMapComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'analyze/environment',
    component: EnvironmentComponent,
    canActivate: [AuthGuard],
  },
  { path: 'analyze/pr', component: PrComponent, canActivate: [AuthGuard] },
  {
    path: 'analyze/temperature',
    component: TemperatureComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'analyze/use-rate',
    component: UseRateComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    SettingComponent,
    GenerationQuantityComponent,
    BarChartComponent,
    WeatherInfoComponent,
    SolarQuantityComponent,
    TempHumiComponent,
    WindComponent,
    EfficiencyComponent,
    InstallComponent,
    ReferenceComponent,
    SolarEfficiencyComponent,
    CustomComponent,
    GenerationBoardComponent,
    TotalGenerationBoardComponent,
    WeatherBoardComponent,
    TotalWeatherBoardComponent,
    TransferBoardComponent,
    NoticeBoardComponent,
    QuestionComponent,
    NotificationComponent,
    InvertorAlarmComponent,
    QuestionDetailComponent,
    QuestionRegisterComponent,
    NotificationDetailComponent,
    LoginComponent,
    MyInfoComponent,
    DownloadInvertorComponent,
    DownloadOptimizerComponent,
    DownloadWeatherComponent,
    SunlightArrayMapComponent,
    ModuleGenerationComponent,
    ModuleGenerationDetailComponent,
    EnvironmentComponent,
    PrComponent,
    TemperatureComponent,
    UseRateComponent,
    SolarEnergyGenerationBoardComponent,
  ],
  imports: [
    // Angular Core Modules
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes),

    // Angular CDK
    OverlayModule,

    // Font Awesome
    FontAwesomeModule,

    // Angular Material Modules (필수만 선택)
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatTabsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatFormFieldModule,
    MatGridListModule,
    MatCardModule,
    MatDividerModule,
    MatExpansionModule,
    MatSelectModule,
    MatProgressBarModule,
    MatDialogModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatMenuModule,
    MatPaginatorModule,
    MatRadioModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,

    // Auth Service Module
    AuthServiceModule,

    NgxPaginationModule,
  ],
  providers: [
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'ko-KR',
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: SemsHttpInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
