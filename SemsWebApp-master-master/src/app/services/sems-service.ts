import {Injectable} from '@angular/core'
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders
} from '@angular/common/http'

import {Observable, of, tap, throwError} from 'rxjs'
import {retry, catchError} from 'rxjs'

// Date formatter
import {format} from 'date-fns'

import {SolorSystem} from '../models/solar-system'

// Utils
import {InvertorSummary} from '../models/invertor-summary'
import {WeatherInfoSummary} from '../models/weather-info-summary'
import {QnAEntity} from '../models/qna-entity'
import {environment} from 'src/environments/environment'
import moment from 'moment'
import {AuthServiceModule} from '../auth-service.module'
import {Invertor} from '../models/invertor'
import {InvertorPower} from '../models/invertor-power'
import {UserEntity} from '../models/user-entity'
import {InvertorSelect} from '../models/invertor-select'
import {WeatherSelect} from '../models/weather-select'
import {Config} from "../app-components/home/home.component";
import {OptimizerSelect} from "../models/optimizer-select";
import {Optimizers} from "../models/optimizers";
import {Facility} from "../models/facility";

@Injectable({
  providedIn: 'root'
})
export class SemsService {
  installedDateTime!: Date

  public solarSystem!: SolorSystem
  private REST_API_SERVER = `${environment.baseUserUrl}/public/api/v1`
  private REST_AUTH_API_SERVER = `${environment.baseUserUrl}`
  private SEMS_REST_API_SERVER = `${environment.baseAdminUrl}/admin/api/v1`

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': `application/json`
    })
  }

  constructor(private http: HttpClient, private authService: AuthServiceModule) {
    this.initSample()
    this.solarSystem = new SolorSystem()
  }

  private handle401Error() {
    this.authService.logout();
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error) // log to console instead

      // TODO: if status == 401, logout user and redirect to /login
      if (error.status == 401) {
        this.handle401Error();
      }

      return of(result as T)
    }
  }

  initService() {
  }

  initSample() {
    this.installedDateTime = new Date('2021-01-01')
  }

  // 태양광모니터링 시스템 설치일 가지고 오기
  getInstalledDate(): Date {
    return this.installedDateTime
  }

  // 인버터 카운트 가져오기
  getInverterCount(): number {
    return 10
  }

  // 일사량계 카운트 가져오기
  getSolarCheckerCount(): number {
    return 1
  }

  getTempCheckerCount(): number {
    return 1
  }

  getHumiCheckerCount(): number {
    return 1
  }

  getSite(): any {
    const api = `/site/`;

    const result = this.http
      .get<Invertor[]>(this.SEMS_REST_API_SERVER + api)
      .pipe(
        catchError(this.handleError('getSite', []))
      )

    return result;
  }

  getFacilities(): any {
    const api = `/site/get-facility`;
    const result = this.http
      .get<Invertor[]>(this.SEMS_REST_API_SERVER + api)
      .pipe(
        catchError(this.handleError('get-facility', []))
      )

    return result;
  }

  getSiteMapImage(): any {
    const api = `/site/image`;

    const result = this.http
      .get<Invertor[]>(this.SEMS_REST_API_SERVER + api)
      .pipe(
        catchError(this.handleError('getSiteMapImage', []))
      )

    return result;
  }

  getWeatherInvertorList(startDate?: Date, endDate?: Date): Observable<Facility[]> {
    const api = `/weather/history/instances`;

    const result = this.http
      .get<Facility[]>(this.REST_API_SERVER + api)
      .pipe(
        catchError(this.handleError('getWeatherInvertorList', []))
      )

    return result;
  }

  downloadWeatherData(startDate: Date, endDate: Date, facilities: Facility[], weatherSelect: WeatherSelect) {
    endDate = moment(endDate).add(1, 'days').toDate();
    let api = `/weather/history/data/download?filter=dateTime=ge='${startDate.toISOString().split('.')[0]}';dateTime=le='${endDate.toISOString().split('.')[0]}'`;
    weatherSelect.startDate = startDate.toISOString().split('.')[0];
    weatherSelect.endDate = endDate.toISOString().split('.')[0];
    weatherSelect.facilityIds = facilities.map(value => String(value.id));
    let query = null;

    // for (let i = 0; i < invertors.length; i++) {
    //   if (invertors[i].selected) {
    //     if (query == null) {
    //       query = `insName==${invertors[i].insName};insNum==${invertors[i].insNum}`;
    //     } else {
    //       query = `${query},insName==${invertors[i].insName};insNum==${invertors[i].insNum}`;
    //     }
    //   }
    // }

    if (query != null && query.length > 0) {
      api = `${api};(${query})`;
    }

    const result = this.http
      .post(`${this.REST_API_SERVER}${api}`, weatherSelect, {
        responseType: 'blob'
      })
      .pipe(
        tap(res => console.log(res)),
        catchError(this.handleError(`downloadWeatherData`, []))
      )

    return result;
  }

  downloadInvertorData(startDate: Date, endDate: Date, invertors: Invertor[], invertorSelect: InvertorSelect) {
    endDate = moment(endDate).add(1, 'days').toDate();
    let api = `/invertor/data/download?filter=dateTime=ge='${startDate.toISOString().split('.')[0]}';dateTime=le='${endDate.toISOString().split('.')[0]}'`;
    let query = null;

    for (let i = 0; i < invertors.length; i++) {
      if (invertors[i].selected) {
        if (query == null) {
          query = `insName==${invertors[i].insName};insNum==${invertors[i].insNum}`;
        } else {
          query = `${query},insName==${invertors[i].insName};insNum==${invertors[i].insNum}`;
        }
      }
    }

    if (query !== null && query.length > 0) {
      api = `${api};(${query})`;
    }

    const result = this.http
      .post(`${this.REST_API_SERVER}${api}`, invertorSelect, {
        responseType: 'blob'
      })
      .pipe(
        tap(res => console.log(res)),
        catchError(this.handleError(`downloadInvertorData`, []))
      )

    return result;
  }


  downloadPvData(startDate: Date, endDate: Date, optimizers: Optimizers[], optimizerSelect: OptimizerSelect) {
    endDate = moment(endDate).add(1, 'days').toDate();
    let api = `/pv/history/data/download?filter=dateTime=ge='${startDate.toISOString().split('.')[0]}';dateTime=le='${endDate.toISOString().split('.')[0]}'`;
    let query = null;

    for (let i = 0; i < optimizers.length; i++) {
      if (optimizers[i].selected) {
        if (query == null) {
          query = `insName==${optimizers[i].insName};insNum==${optimizers[i].insNum}`;
        } else {
          query = `${query},insName==${optimizers[i].insName};insNum==${optimizers[i].insNum}`;
        }
      }
    }

    if (query !== null && query.length > 0) {
      // api = `${api};(${query})`;
    }

    const result = this.http
      .post(`${this.REST_API_SERVER}${api}`, optimizerSelect, {
        responseType: 'blob'
      })
      .pipe(
        tap(res => console.log(res)),
        catchError(this.handleError(`downloadInvertorData`, []))
      )

    return result;
  }


  getAccount(account: string): Observable<any> {
    let api = `/account/${account}`;

    const result = this.http
      .get(`${this.REST_API_SERVER}${api}`)
      .pipe(
        catchError(this.handleError(`getAccount`, []))
      )

    return result;
  }

  changePassword(user: UserEntity): Observable<any> {
    let api = `/user/account/${user.account}/password`;

    const result = this.http
      .put(`${this.REST_API_SERVER}${api}`, user)
      .pipe(
        catchError(this.handleError(`changePassword`, []))
      )

    return result;
  }

  authLogin(account: string, password: string): Observable<any> {
    let postLoginApi = `/auth/user/login`

    let params = {
      account: account,
      password: password
    }

    const result = this.http
      .post<any>(`${this.REST_AUTH_API_SERVER}${postLoginApi}`, params)
      .pipe(
        tap(res => console.log(`login: ${res}`)),
        catchError(this.handleError(`login`, []))
      )

    return result
  }

  // getGenerationQuantityMonthly
  // 1 Description
  //
  // 2 Arguments
  // inverter : index of inverter
  //
  // 3 Return values
  postQnA(qna: QnAEntity): Observable<any> {
    let postQnaApi = `/question/create`

    const result = this.http
      .post<any>(`${this.SEMS_REST_API_SERVER}${postQnaApi}`, qna)
      .pipe(
        tap(res => console.log(`post QnA: ${res}`)),
        catchError(this.handleError('postQnA', []))
      )

    return result
  }

  getQnAListByUserId(userId: number, offset: number = 0, pageSize: number = 10): Observable<any> {
    let qnaListApi = `/question/user/${userId}`

    const result = this.http
      .get<any>(
        `${this.SEMS_REST_API_SERVER}${qnaListApi}?offset=${offset}&pageSize=${pageSize}`
      )
      .pipe(
        tap(res => console.log(`get QnA List: ${res}`)),
        catchError(this.handleError('getQnAListByUserId', []))
      )

    return result
  }

  getQnAList(offset: number = 0, pageSize: number = 10): Observable<any> {
    let qnaListApi = `/question/`

    const result = this.http
      .get<any>(
        `${this.SEMS_REST_API_SERVER}${qnaListApi}?offset=${offset}&pageSize=${pageSize}`
      )
      .pipe(
        tap(res => console.log(`get QnA List: ${res}`)),
        catchError(this.handleError('getQnAList', []))
      )

    return result
  }

  getQnADetail(id: number): Observable<any> {
    let qnaListApi = `/question/${id}`

    const result = this.http
      .get<any>(`${this.SEMS_REST_API_SERVER}${qnaListApi}`)
      .pipe(
        tap(res => console.log(`get QnA Detail: ${res}`)),
        catchError(this.handleError('getQnADetail', []))
      )

    return result
  }

  deleteQnA(id: number): Observable<any> {
    let qnaDeleteApi = `/question/${id}`;

    const result = this.http
      .delete<any>(`${this.SEMS_REST_API_SERVER}${qnaDeleteApi}`)
      .pipe(
        tap(res => console.log(`Delete QnA: ${res}`)),
        catchError(this.handleError('deleteQnA', []))
      )

    return result;
  }

  getNotificationList(
    offset: number = 0,
    pageSize: number = 10
  ): Observable<any> {
    let notificationListApi = `/notification/`

    const result = this.http
      .get<any>(
        `${this.SEMS_REST_API_SERVER}${notificationListApi}?offset=${offset}&pageSize=${pageSize}`
      )
      .pipe(
        tap(res => console.log(`get notification List: ${res}`)),
        catchError(this.handleError('getNotificationList', []))
      )

    return result
  }

  getNotificationDetail(id: number): Observable<any> {
    let notificationListApi = `/notification/${id}`

    const result = this.http
      .get<any>(`${this.SEMS_REST_API_SERVER}${notificationListApi}`)
      .pipe(
        tap(res => console.log(`get notification Detail: ${res}`)),
        catchError(this.handleError('getNotificationDetail', []))
      )

    return result
  }

  getInvertorDataByDatetime(datetime: string) {
    let api = `/invertor/datetime/${datetime}`;

    const result = this.http
      .get<any>(`${this.REST_API_SERVER}${api}`)
      .pipe(
        tap(res => console.log(`get invertor datetime: ${res}`)),
        catchError(this.handleError('getInvertorDataByDatetime'))
      )

    return result;
  }

  getInvertorStatGeneration(today?: Date, api?: any) {
    if (today != null) {
      let value = format(today, 'yyyy-MM-dd HH:mm:ss');
      console.log(value);
      api = `${api}?date=${value}`
    }

    const result = this.http
      .get<any>(`${this.REST_API_SERVER}${api}`)
      .pipe(
        catchError(this.handleError('getInvertorStatGeneration'))
      )

    return result;
  }

  getInvertorErrorList(startDate?: Date, endDate?: Date, offset: Number = 0, pageSize: Number = 10) {
    let api = `/invertor/?offset=${offset}&pageSize=${pageSize}`;

    if (startDate != null && endDate != null) {
      api = `${api}&filter=message.id!=0;dateTime=ge='${startDate.toISOString().split('.')[0]}';dateTime=le='${endDate.toISOString().split('.')[0]}'`;
    } else {
      api = `${api}&filter=message.id!=0`;
    }

    console.log(api);

    const result = this.http
      .get<any>(`${this.REST_API_SERVER}${api}`)
      .pipe(
        tap(res => console.log(`invertor list`)),
        catchError(this.handleError('getInvertorList'))
      )

    return result;
  }

  getEfficiencyMonthly(
    startDate: Date,
    endDate: Date
  ): Observable<InvertorSummary[]> {
    return this.getEfficiencySummary(
      'MONTHLY',
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd')
    )
  }

  getEfficiencyDaily(
    startDate: Date,
    endDate: Date
  ): Observable<InvertorSummary[]> {
    endDate = moment().add(1, 'd').toDate();
    return this.getEfficiencySummary(
      'DAILY',
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd')
    )
  }

  getEfficiencyHourly(today: Date): Observable<InvertorSummary[]> {
    let dateParam = new Date(today)
    return this.getEfficiencySummary(
      'HOURLY',
      format(dateParam, 'yyyy-MM-dd'),
      format(dateParam.setDate(dateParam.getDate() + 1), 'yyyy-MM-dd')
    )
  }

  getEfficiencySummary(
    type: string,
    startDate: string,
    endDate: string
  ): Observable<InvertorSummary[]> {
    var efficiencyApi = `/invertor/summary/efficiency?summaryType=${type}&startDate=${startDate}&endDate=${endDate}`

    var result = this.http
      .get<InvertorSummary[]>(this.REST_API_SERVER + efficiencyApi)
      .pipe(
        tap(res => {
          // console.log(`get efficiency: ${res}`)
        }),
        catchError(this.handleError('getEfficiencySummary', []))
      )

    return result
  }

  getPowerIrradianceMonthly(
    startDate: Date,
    endDate: Date
  ): Observable<InvertorSummary[]> {
    return this.getPowerIrradianceSummary(
      'MONTHLY',
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd')
    )
  }

  getPowerIrradianceDaily(
    startDate: Date,
    endDate: Date
  ): Observable<InvertorSummary[]> {
    return this.getPowerIrradianceSummary(
      'DAILY',
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd')
    )
  }

  getPowerIrradianceHourly(today: Date): Observable<InvertorSummary[]> {
    let dateParam = new Date(today)
    return this.getPowerIrradianceSummary(
      'HOURLY',
      format(dateParam, 'yyyy-MM-dd'),
      format(dateParam.setDate(dateParam.getDate() + 1), 'yyyy-MM-dd')
    )
  }

  getPowerIrradianceSummary(
    type: string,
    startDate: string,
    endDate: string
  ): Observable<InvertorSummary[]> {
    var generationApi = `/invertor/summary/irradiance?summaryType=${type}&startDate=${startDate}&endDate=${endDate}`

    var result = this.http
      .get<InvertorSummary[]>(this.REST_API_SERVER + generationApi)
      .pipe(
        tap(res => {
          // console.log(`get power irradiance: ${res}`)
        }),
        catchError(this.handleError('getPowerIrradiance', []))
      )

    return result
  }

  getInvertorList(startDate?: Date, endDate?: Date): Observable<Invertor[]> {
    const api = `/invertor/instances`;

    const result = this.http
      .get<Invertor[]>(this.REST_API_SERVER + api)
      .pipe(
        catchError(this.handleError('getInvertorList', []))
      )

    return result;
  }

  getOptimizerList(startDate?: Date, endDate?: Date): Observable<Invertor[]> {
    const api = `/invertor/optimizer-instances`;

    const result = this.http
      .get<Invertor[]>(this.REST_API_SERVER + api)
      .pipe(
        catchError(this.handleError('getOptimizerList', []))
      )

    return result;
  }

  getInvertorLastData(): Observable<InvertorPower[]> {
    const api = `/invertor/last`;

    const result = this.http
      .get<InvertorPower[]>(this.REST_API_SERVER + api)
      .pipe(
        tap(res => {
        }),
        catchError(this.handleError('getInvertorLastData', []))
      )

    return result;
  }

  getGenerationQuantityMonthly(
    startDate: Date,
    endDate: Date
  ): Observable<InvertorSummary[]> {
    return this.getGenerationQuantitySummary(
      'MONTHLY',
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd')
    )
  }

  getGenerationQuantityDaily(
    startDate: Date,
    endDate: Date
  ): Observable<InvertorSummary[]> {
    return this.getGenerationQuantitySummary(
      'DAILY',
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd')
    )
  }


  /* 최근 1주일 데이터 조회 */
  getGenerationQuantityWeek(today: Date, siteIndex: string, config: Config): Observable<InvertorSummary[]> {
    let start = new Date(today);
    let end = new Date(today);
    return this.getGenerationQuantitySummary2(
      'DAILY',
      format(start.setDate(today.getDate() - 6), 'yyyy-MM-dd'),
      format(end.setDate(today.getDate()), 'yyyy-MM-dd'),
      siteIndex,
      config.api1
    )
  }


  getGenerationQuantityHourly(today: Date): Observable<InvertorSummary[]> {
    let dateParam = new Date(today)
    return this.getGenerationQuantitySummary(
      'HOURLY',
      format(dateParam, 'yyyy-MM-dd'),
      format(dateParam.setDate(today.getDate() + 1), 'yyyy-MM-dd')
    )
  }

  getGenerationQuantitySummary(
    type: string,
    startDate: string,
    endDate: string
  ): Observable<InvertorSummary[]> {
    var generationApi = `/invertor/summary?summaryType=${type}&startDate=${startDate}&endDate=${endDate}`

    var result = this.http
      .get<InvertorSummary[]>(this.REST_API_SERVER + generationApi)
      .pipe(
        tap(res => console.log(`get generation quantity: ${JSON.stringify(res)}`)),
        catchError(this.handleError('getGenerationQuantityDaily', []))
      )

    return result
  }


  getGenerationQuantitySummary2(
    type: string,
    startDate: string,
    endDate: string,
    siteIndex: string,
    api: string
  ): Observable<InvertorSummary[]> {
    var generationApi = `${api}?summaryType=${type}&startDate=${startDate}&endDate=${endDate}&siteIndex=${siteIndex}`

    var result = this.http
      .get<InvertorSummary[]>(this.REST_API_SERVER + generationApi)
      .pipe(
        tap(res => console.log(`get generation quantity: ${JSON.stringify(res)}`)),
        catchError(this.handleError('getGenerationQuantityDaily', []))
      )

    return result
  }


  getGenerationQuantityInstanceSummary(insName: string, insNum: string, startDate: Date, endDate: Date): Observable<InvertorSummary[]> {
    startDate = moment('2021-10-01').toDate();
    endDate = moment('2021-10-03').toDate();
    var generationApi = `/invertor/summary/${insName}/${insNum}?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`

    var result = this.http
      .get<InvertorSummary[]>(this.REST_API_SERVER + generationApi)
      .pipe(
        tap(res => console.log(`get generation quantity: ${res}`)),
        catchError(this.handleError('getGenerationQuantityDaily', []))
      )

    return result
  }

  getWeatherStatRadiation(today?: Date) {
    let api = `/weather/daily/stat/radiation`;

    if (today != null) {
      api = `${api}?date=${format(today, 'yyyy-MM-dd')}`
    }

    const result = this.http
      .get<any>(`${this.REST_API_SERVER}${api}`)
      .pipe(
        catchError(this.handleError('getWeatherStatRadiation'))
      )

    return result;
  }

  getWeatherSummary(
    type: string,
    startDate: string,
    endDate: string
  ): Observable<WeatherInfoSummary[]> {
    var generationDailyApi = `/weather/history/summary?summaryType=${type}&startDate=${startDate}&endDate=${endDate}`

    var result = this.http
      .get<WeatherInfoSummary[]>(this.REST_API_SERVER + generationDailyApi)
      .pipe(
        tap(res => console.log(`fetched weather: ${res}`)),
        catchError(this.handleError('getWeatherSummary', []))
      )

    return result
  }

  getWeatherLastInformation(): Observable<any> {
    var weatherLastApi = `/weather/history/last`

    let result = this.http.get(this.REST_API_SERVER + weatherLastApi).pipe(
      tap(res => console.log(`fetch weather history last: ${res}`)),
      catchError(this.handleError('getWeatherLastAPI', []))
    )

    return result
  }

  onTestTimer(tick: any) { }

  getHardwareCount(id: string): Observable<any> {
    const api = `/hardware/hardwareCount/${id}`;

    const result = this.http
      .get<Invertor[]>(this.SEMS_REST_API_SERVER + api)
      .pipe(
        catchError(this.handleError('getSiteMapImage', []))
      )

    return result;
  }

  getModuleGenerationInvInfo(insNum: number): any {
    const api = `/hardware/moduleGenerationInvInfo/${insNum}`;

    const result = this.http
      .get<Invertor[]>(this.SEMS_REST_API_SERVER + api)
      .pipe(
        catchError(this.handleError('moduleGenerationInvInfo', []))
      )

    return result;
  }

  getModuleGenerationPvInfo(): any {
    const api = `/hardware/moduleGenerationPvInfo`;

    const result = this.http
      .get<Invertor[]>(this.SEMS_REST_API_SERVER + api)
      .pipe(
        catchError(this.handleError('moduleGenerationPvInfo', []))
      )

    return result;
  }

  getModuleGenerationOptInfo(insNum: number): any {
    const api = `/hardware/moduleGenerationOptInfo/${insNum}`;

    const result = this.http
      .get<Invertor[]>(this.SEMS_REST_API_SERVER + api)
      .pipe(
        catchError(this.handleError('moduleGenerationOptInfo', []))
      )

    return result;
  }

  getModuleGenerationDetailInfo(gbn: string, insNum: number, startDate: string, endDate: string): any {
    let api = '';

    if (gbn === 'time') {
      api = `/hardware/moduleGenerationDetailTimeInfo/${insNum}&${startDate}&${endDate}`;
    } else if (gbn === 'day' ) {
      api = `/hardware/moduleGenerationDetailDayInfo/${insNum}&${startDate}&${endDate}`;
    } else if (gbn === 'month' ) {
      api = `/hardware/moduleGenerationDetailMonthInfo/${insNum}&${startDate}&${endDate}`;
    }

    const result = this.http
      .get<Invertor[]>(this.SEMS_REST_API_SERVER + api)
      .pipe(
        catchError(this.handleError('moduleGenerationOptInfo', []))
      )

    return result;
  }

  getAnalyzeEnvironmentInfo(gbn: string, startDate: string, endDate: string): any {
    let api = '';

    if (gbn === 'time') {
      api = `/hardware/analyzeEnvironmentTimeInfo/${startDate}&${endDate}`;
    } else if (gbn === 'day' ) {
      api = `/hardware/analyzeEnvironmentDayInfo/${startDate}&${endDate}`;
    } else if (gbn === 'month' ) {
      api = `/hardware/analyzeEnvironmentMonthInfo/${startDate}&${endDate}`;
    }

    const result = this.http
      .get<Invertor[]>(this.SEMS_REST_API_SERVER + api)
      .pipe(
        catchError(this.handleError('analyzeEnvironmentInfo', []))
      )

    return result;
  }

  getAnalyzeTemperatureInvList(): any {
    const api = `/hardware/analyzeTemperatureInvList`;

    const result = this.http
      .get<Invertor[]>(this.SEMS_REST_API_SERVER + api)
      .pipe(
        catchError(this.handleError('analyzeTemperatureInvList', []))
      )

    return result;
  }

  getAnalyzeTemperatureInfo(gbn: string, insNum: string, startDate: string, endDate: string): any {
    let api = '';

    if (gbn === 'time') {
      api = `/hardware/analyzeTemperatureTimeInfo/${insNum}&${startDate}&${endDate}`;
    } else if (gbn === 'day' ) {
      api = `/hardware/analyzeTemperatureDayInfo/${insNum}&${startDate}&${endDate}`;
    } else if (gbn === 'month' ) {
      api = `/hardware/analyzeTemperatureMonthInfo/${insNum}&${startDate}&${endDate}`;
    }

    const result = this.http
      .get<Invertor[]>(this.SEMS_REST_API_SERVER + api)
      .pipe(
        catchError(this.handleError('analyzeTemperatureInfo', []))
      )

    return result;
  }

  getAnalyzePrInfo(gbn: string, startDate: string, endDate: string): any {
    let api = '';

    if (gbn === 'time') {
      api = `/hardware/analyzePrTimeInfo/${startDate}&${endDate}`;
    } else if (gbn === 'day' ) {
      api = `/hardware/analyzePrDayInfo/${startDate}&${endDate}`;
    } else if (gbn === 'month' ) {
      api = `/hardware/analyzePrMonthInfo/${startDate}&${endDate}`;
    }

    const result = this.http
      .get<Invertor[]>(this.SEMS_REST_API_SERVER + api)
      .pipe(
        catchError(this.handleError('analyzePrInfo', []))
      )

    return result;
  }

  getAnalyzeUseRateInfo(gbn: string, startDate: string, endDate: string): any {
    let api = '';

    if (gbn === 'time') {
      api = `/hardware/analyzeUseRateTimeInfo/${startDate}&${endDate}`;
    } else if (gbn === 'day' ) {
      api = `/hardware/analyzeUseRateDayInfo/${startDate}&${endDate}`;
    } else if (gbn === 'month' ) {
      api = `/hardware/analyzeUseRateMonthInfo/${startDate}&${endDate}`;
    }

    const result = this.http
      .get<Invertor[]>(this.SEMS_REST_API_SERVER + api)
      .pipe(
        catchError(this.handleError('analyzeUseRateInfo', []))
      )

    return result;
  }
}
