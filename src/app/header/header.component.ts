import { Component, OnInit, Input } from "@angular/core";
import { NavService } from "../service/nav.service";
import { NavItem } from '../service/nav-item';
import navigationItems from '../../assets/data/navigation-items.json';

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"]
})
export class HeaderComponent implements OnInit {
  
  @Input()
  menuItems: NavItem[];

  @Input()
  isMobileMediaMatches: boolean;

  @Input()
  includeKLMLogo: boolean;

  constructor(
    public navService: NavService
  ) {}

  ngOnInit() {
    this.menuItems = navigationItems.headerMenuItems;
  }

  openShellApp() {
    window.open('https://post-covid-shell-app.herokuapp.com/?airline=KL', "_blank");
  }
}
