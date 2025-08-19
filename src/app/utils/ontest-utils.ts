import { Component, OnInit } from '@angular/core';
import { ChartType } from 'chart.js';
import { format } from 'date-fns';
import { InvertorSummary } from '../models/invertor-summary';
import { WeatherInfoSummary } from '../models/weather-info-summary';
import { SemsService } from '../services/sems-service';
import { BarChartComponent } from '../ui-components/bar-chart/bar-chart.component';
import { ChartJsUtils } from './chartjs-utils';

export class OntestUtils {
  siteHardwares = [];
  facilities = [];

  constructor(private semsService: SemsService) {
    this.semsService.getSite().subscribe((resSite) => {
      this.siteHardwares = resSite.siteHardware;
    });

    this.semsService.getFacilities().subscribe((response) => {
      response.splice(0, 0, { id: 0, title: '전체' });
      this.facilities = response;
    });
  }

  // Utils
  syncGenerationGridData(
    chartLabels: string[],
    apiData: InvertorSummary[],
    field: string,
    chart: BarChartComponent,
    dateFormat: string,
    type?: string | undefined,
    chartType?: ChartType | 'bar',
    site?: any | undefined,
    yAxisID?: string | undefined,
    color?: string | undefined
  ): InvertorSummary[] {
    console.log('[OntestUtils] - syncGenerationGridData');
    const chartUtil: ChartJsUtils = new ChartJsUtils();
    // The server only retrieves existing data. Need to fill 0 for dates with no data
    let invertorData = [];
    let invertorList = [];
    for (let inv = 0; inv < apiData.length; inv++) {
      let data = apiData[inv];
      const hardware = this.siteHardwares.filter(
        (f) =>
          f.insName == data.insName &&
          f.insNum == data.insNum &&
          f.hardwareType != 'Hardware6'
      );

      invertorData[inv] = [];
      invertorList[inv] = {
        insName: data.insName,
        insNum: data.insNum,
        name: hardware.length == 1 ? hardware[0].name : '',
        data: [],
      };
      let index = 0;
      for (let i = 0; i < chartLabels.length; i++) {
        let invertorSummary = data.invertorSummary[index];
        let label = chartLabels[i];
        if (data.invertorSummary.length > index) {
          if (type != undefined && label == invertorSummary.dateTime) {
            invertorData[inv][i] = invertorSummary[field];
            index++;
          } else if (
            type == undefined &&
            label == format(new Date(invertorSummary.dateTime), dateFormat)
          ) {
            invertorData[inv][i] = invertorSummary[field];
            index++;
          } else {
            if (
              type == undefined &&
              label > format(new Date(invertorSummary.dateTime), dateFormat)
            ) {
              i--;
              index++;
            }

            invertorData[inv][i] = 0;
          }
        }
      }

      let invertorName = '';

      if (site && site.siteHardware && site?.siteHardware.length > 0) {
        for (let i = 0; i < site.siteHardware.length; i++) {
          if (
            site.siteHardware[i].insName == invertorList[inv].insName &&
            site.siteHardware[i].insNum == invertorList[inv].insNum
          ) {
            invertorName = site.siteHardware[i].name;
            break;
          }
        }
      }

      if (invertorName.length == 0) {
        if (invertorList[inv].insNum) {
          invertorName = `${invertorList[inv].insName}[${invertorList[inv].insNum}]`;
        } else {
          invertorName = invertorList[inv].insName;
        }
      }

      chart?.addDataset(
        `${invertorName}`,
        invertorData[inv],
        color ? color : chartUtil.getColorRandom(),
        chartType,
        yAxisID
      );
      invertorList[inv].data = invertorData[inv];
    }
    return invertorList;
  }

  syncInvertorGridData(
    chartLabels: string[],
    apiData: WeatherInfoSummary[],
    field: string,
    chart: BarChartComponent,
    dateFormat: string,
    type?: string | undefined,
    chartType?: ChartType | 'bar',
    site?: any | undefined,
    yAxisID?: string | undefined
  ): WeatherInfoSummary[] {
    const colorMap: Record<string, string> = {
      irradiance: '#ff6384', // 빨강 (IRRADIANCE1)
      irradiance2: '#36a2eb', // 파랑 (IRRADIANCE2)
      irradiance3: '#ffce56', // 노랑 (IRRADIANCE3)
    };

    const chartUtil: ChartJsUtils = new ChartJsUtils();
    // The server only retrieves existing data. Need to fill 0 for dates with no data
    let invertorData = [];
    let invertorDataList = [];
    for (let inv = 0; inv < apiData.length; inv++) {
      const hardware = this.siteHardwares.filter(
        (f) =>
          f.insName == apiData[inv].insName &&
          f.insNum == apiData[inv].insNum &&
          f.hardwareType != 'Hardware6'
      );

      invertorData[inv] = [];
      invertorDataList[inv] = {
        insName: apiData[inv].insName,
        insNum: apiData[inv].insNum,
        name: hardware.length == 1 ? hardware[0].name : '',
        data: [],
      };
      let index = 0;
      for (let i = 0; i < chartLabels.length; i++) {
        if (apiData[inv].invertorWeatherSummary.length > index) {
          if (
            type &&
            chartLabels[i] ==
              apiData[inv].invertorWeatherSummary[index].dateTime
          ) {
            invertorData[inv][i] =
              apiData[inv].invertorWeatherSummary[index][field];
            index++;
          } else if (
            !type &&
            chartLabels[i] ==
              format(
                new Date(apiData[inv].invertorWeatherSummary[index].dateTime),
                dateFormat
              )
          ) {
            invertorData[inv][i] =
              apiData[inv].invertorWeatherSummary[index][field];
            index++;
          } else {
            invertorData[inv][i] = 0;
          }
        }
      }

      let invertorName = '';

      if (site && site?.siteHardware.length > 0) {
        for (let i = 0; i < site.siteHardware.length; i++) {
          if (
            site.siteHardware[i].insName == invertorDataList[inv].insName &&
            site.siteHardware[i].insNum == invertorDataList[inv].insNum
          ) {
            invertorName = site.siteHardware[i].name;
            break;
          }
        }
      }

      if (invertorName.length == 0) {
        invertorName = `${invertorDataList[inv].insName}[${invertorDataList[inv].insNum}]`;
      }
      const fieldKey = field.toLowerCase(); // 'irradiance', 'irradiance2', ...
      const color = colorMap[fieldKey] || chartUtil.getColorNext();

      chart.addDataset(
        `${invertorName}`,
        invertorData[inv],
        color,
        chartType,
        yAxisID
      );
      invertorDataList[inv].data = invertorData[inv];
    }

    return invertorDataList;
  }

  syncWeatherGridData(
    chartLabels: string[],
    apiData: WeatherInfoSummary[],
    field: string,
    chart: BarChartComponent,
    dateFormat: string,
    type?: string | undefined,
    chartType?: ChartType | 'bar',
    site?: any | undefined,
    yAxisID?: string | undefined
  ): WeatherInfoSummary[] {
    const chartUtil: ChartJsUtils = new ChartJsUtils();
    // The server only retrieves existing data. Need to fill 0 for dates with no data
    let weatherData = [];
    let weatherDataList = [];
    for (let inv = 0; inv < apiData.length; inv++) {
      const hardware = this.siteHardwares.filter(
        (f) =>
          f.insName == apiData[inv].insName &&
          f.insNum == apiData[inv].insNum &&
          f.hardwareType != 'Hardware6'
      );

      weatherData[inv] = [];
      weatherDataList[inv] = {
        insName: apiData[inv].insName,
        insNum: apiData[inv].insNum,
        name: hardware.length == 1 ? hardware[0].name : '',
        data: [],
      };
      let index = 0;
      for (let i = 0; i < chartLabels.length; i++) {
        if (apiData[inv].invertorWeatherSummary.length > index) {
          if (
            type &&
            chartLabels[i] ==
              apiData[inv].invertorWeatherSummary[index].dateTime
          ) {
            weatherData[inv][i] =
              apiData[inv].invertorWeatherSummary[index][field];
            index++;
          } else if (
            !type &&
            chartLabels[i] ==
              format(
                new Date(apiData[inv].invertorWeatherSummary[index].dateTime),
                dateFormat
              )
          ) {
            weatherData[inv][i] =
              apiData[inv].invertorWeatherSummary[index][field];
            index++;
          } else {
            weatherData[inv][i] = 0;
          }
        }
      }

      let invertorName = '';

      if (site && site?.siteHardware.length > 0) {
        for (let i = 0; i < site.siteHardware.length; i++) {
          if (
            site.siteHardware[i].insName == weatherDataList[inv].insName &&
            site.siteHardware[i].insNum == weatherDataList[inv].insNum
          ) {
            invertorName = site.siteHardware[i].name;
            break;
          }
        }
      }

      if (invertorName.length == 0) {
        invertorName = `${weatherDataList[inv].insName}[${weatherDataList[inv].insNum}]`;
      }

      chart.addDataset(
        `${invertorName}`,
        weatherData[inv],
        chartUtil.getColorNext(),
        chartType,
        yAxisID
      );
      weatherDataList[inv].data = weatherData[inv];
    }

    return weatherDataList;
  }

  // Utils
  syncGenerationGridDataByFacility(
    chartLabels: string[],
    apiData: InvertorSummary[],
    field: string,
    chart: BarChartComponent,
    dateFormat: string,
    type?: string | undefined,
    chartType?: ChartType | 'bar',
    site?: any | undefined,
    yAxisID?: string | undefined,
    color?: string | undefined
  ): InvertorSummary[] {
    console.log('[OntestUtils] - syncGenerationGridDataByFacility');
    const chartUtil: ChartJsUtils = new ChartJsUtils();
    // The server only retrieves existing data. Need to fill 0 for dates with no data
    let invertorData = [];
    let invertorList = [];
    for (let inv = 0; inv < apiData.length; inv++) {
      let data = apiData[inv];
      const hardware = this.siteHardwares.filter(
        (f) =>
          f.insName == data.insName &&
          f.insNum == data.insNum &&
          f.hardwareType != 'Hardware6'
      );

      invertorData[inv] = [];
      invertorList[inv] = {
        insName: data.insName,
        insNum: data.insNum,
        name: hardware.length == 1 ? hardware[0].name : '',
        data: [],
      };
      let index = 0;
      for (let i = 0; i < chartLabels.length; i++) {
        let invertorSummary = data.invertorSummary[index];
        let label = chartLabels[i];
        if (data.invertorSummary.length > index) {
          if (type != undefined && label == invertorSummary.dateTime) {
            invertorData[inv][i] = invertorSummary[field];
            index++;
          } else if (
            type == undefined &&
            label == format(new Date(invertorSummary.dateTime), dateFormat)
          ) {
            invertorData[inv][i] = invertorSummary[field];
            index++;
          } else {
            if (
              type == undefined &&
              label > format(new Date(invertorSummary.dateTime), dateFormat)
            ) {
              i--;
              index++;
            }

            invertorData[inv][i] = 0;
          }
        }
      }

      let invertorName = '';

      if (site && site.siteHardware && site?.siteHardware.length > 0) {
        for (let i = 0; i < site.siteHardware.length; i++) {
          if (
            site.siteHardware[i].insName == invertorList[inv].insName &&
            site.siteHardware[i].insNum == invertorList[inv].insNum
          ) {
            invertorName = site.siteHardware[i].name;
            break;
          }
        }
      }

      if (invertorName.length == 0) {
        if (invertorList[inv].insNum) {
          invertorName = `${invertorList[inv].insName}[${invertorList[inv].insNum}]`;
        } else {
          invertorName = invertorList[inv].insName;
        }
      }

      chart?.addDataset(
        ``,
        invertorData[inv],
        color ? color : chartUtil.getColorRandom(),
        chartType,
        yAxisID
      );
      invertorList[inv].data = invertorData[inv];
    }
    return invertorList;
  }
}
