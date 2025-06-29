/**
 * OpenArabDictViewer
 * Copyright (C) 2023-2025 Amir Czwink (amir130@hotmail.de)
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * */

import { BootstrapIcon, Component, I18n, Injectable, JSX_CreateElement, Navigation, NavItem, ProgressSpinner, RouterComponent } from "acfrontend";
import { DialectsService } from "./services/DialectsService";
import { GlobalSettingsService } from "./services/GlobalSettingsService";
import { PageLanguageSelectionComponent } from "./PageLanguageSelectionComponent";
import { DialectSelectionComponent } from "./DialectSelectionComponent";

@Injectable
export class RootComponent extends Component
{
    constructor(private dialectsService: DialectsService, private pageLanguageService: GlobalSettingsService)
    {
        super();

        this.loading = true;
    }
    
    protected Render()
    {
        if(this.loading)
            return <ProgressSpinner />;

        return <fragment>
            <Navigation>
                <div className="row m-auto">
                    <div className="col-auto p-1">
                        <h4>OpenArabDict</h4>
                    </div>
                    <div className="col">
                        <ul className="nav nav-pills">
                            <NavItem route="/search"><BootstrapIcon>search</BootstrapIcon></NavItem>
                            <NavItem route="/roots"><I18n key="nav.roots" /></NavItem>
                            <NavItem route="/learn"><I18n key="nav.learn" /></NavItem>
                            <NavItem route="/statistics"><I18n key="nav.statistics" /></NavItem>
                        </ul>
                    </div>
                    <div className="col-auto">
                        <DialectSelectionComponent onDialectChanged={this.OnLanguageChanged.bind(this)} />
                    </div>
                    <div className="col-auto">
                        <PageLanguageSelectionComponent onLanguageChanged={this.OnLanguageChanged.bind(this)} />
                    </div>
                </div>
            </Navigation>
            <div className="container-fluid">
                <RouterComponent />
            </div>
        </fragment>;
    }

    //Event handlers
    override async OnInitiated(): Promise<void>
    {
        await this.pageLanguageService.LoadLanguages();

        await this.dialectsService.CacheDialects(); //dialects are required to be loaded and cached
        this.loading = false;
    }

    private OnLanguageChanged()
    {
        //force a redraw of the whole site
        this.loading = true;
        this.UpdateSync();
        this.loading = false;
    }

    //State
    private loading: boolean;
}