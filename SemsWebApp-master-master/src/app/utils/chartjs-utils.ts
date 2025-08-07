import { RandomUtils } from "./random-utils";

export class ChartJsUtils {

    index : number = 0;

    CHART_COLORS = [
        'rgb(255, 99, 132)',  // Red
        'rgb(255, 159, 64)', // orange
        'rgb(255, 205, 86)', // yellow
        'rgb(75, 192, 192)', // green
        'rgb(54, 162, 235)', // blue
        'rgb(153, 102, 255)', // purple
        'rgb(201, 203, 207)' // grey
    ];
    
    constructor() {
    }

    getColorRandom() {
        return this.CHART_COLORS[RandomUtils.getRandomInt(0, this.CHART_COLORS.length)];
    }

    resetColorNext() {
        this.index = 0;
    }
    getColorNext() {
        var color = this.CHART_COLORS[this.index % this.CHART_COLORS.length];
        this.index++;
        return color; 
    }
    
    getColorFirst() {
        this.index = 0;
        return this.getColorNext();
    }
}