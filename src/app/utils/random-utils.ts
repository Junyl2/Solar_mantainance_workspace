
export class RandomUtils {
    static getRandom(min : number, max : number) : number{
        return Math.random() * (max - min) + min;
    }

    static getRandomInt(min : number, max : number) : number{
        return Math.trunc(Math.random() * (max - min) + min);
    }
}