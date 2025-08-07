
import { Injectable } from '@angular/core';

@Injectable({
  providedIn : 'root',
})
export class ThemeService {
    theme:string = "original";
    layout:string = "original";
    setTheme(theme:string) : void{
        this.theme = theme;
    }
    setLayout(layout:string) : void {
      this.layout = layout;
    }
}