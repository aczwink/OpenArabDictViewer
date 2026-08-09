/**
 * OpenArabDictViewer
 * Copyright (C) 2023-2026 Amir Czwink (amir130@hotmail.de)
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

import { BootstrapIcon, Component, I18n, Injectable, JSX_CreateElement, JSX_Fragment, Navigation, NavItem, ProgressSpinner, RouterComponent, ThemingService } from "@aczwink/acfrontend";
import { DialectsService } from "./services/DialectsService";
import { GlobalSettingsService } from "./services/GlobalSettingsService";
import { PageLanguageSelectionComponent } from "./PageLanguageSelectionComponent";
import { DialectSelectionComponent } from "./DialectSelectionComponent";

@Injectable
export class RootComponent extends Component
{
    constructor(private dialectsService: DialectsService, private pageLanguageService: GlobalSettingsService, private themingService: ThemingService)
    {
        super();

        this.loading = true;
        this.cachingFailed = false;
    }
    
    protected Render()
    {
        return <fragment>
            {this.RenderNav()}
            {this.RenderContent()}
            {this.RenderFooter()}
        </fragment>;
    }

    //Private methods
    private RenderBanner()
    {
        const logo = this.themingService.IsDarkModeEnabled() ? "/openarabdict_logo_dark.svg" : "/openarabdict_logo.svg";

        return <div className="col-auto p-1" style="display: inline">
            <div className="row align-items-start">
                <div className="col-auto align-self-center pe-0">
                    <img src={logo} style="height: 2.5rem; margin:auto;" />
                </div>
                <div className="col-auto ps-0">
                    <h4>OpenArabDict</h4>
                </div>
            </div>
        </div>;
    }

    private RenderContent()
    {
        if(this.cachingFailed)
            return <h1 className="text-center">Error contacting backend</h1>;
        if(this.loading)
            return <ProgressSpinner />;

        return <div className="container-fluid">
            <RouterComponent />
        </div>;
    }

    private RenderFooter()
    {
        const d = new Date();
        return <ul className="list-unstyled text-body-secondary d-flex justify-content-center">
            <li>© 2023-{d.getUTCFullYear()} Amir Czwink</li>
            <li className="ms-3">
                <a className="text-body-secondary" href="https://www.gnu.org/licenses/agpl-3.0.en.html" target="_blank">AGPL-3.0 Licensed</a>
            </li>
            <li className="ms-3">Source code:</li>
            <li className="ms-3">
                <a className="text-body-secondary" href="https://github.com/aczwink/OpenArabDictViewer" target="_blank" title="Web app"><BootstrapIcon>github</BootstrapIcon> Web app</a>
            </li>
            <li className="ms-3">
                <a className="text-body-secondary" href="https://github.com/aczwink/OpenArabDict" target="_blank" title="Dictionary"><BootstrapIcon>github</BootstrapIcon> Dictionary</a>
            </li>
            <li className="ms-3">
                <a className="text-body-secondary" href="https://github.com/aczwink/OpenArabicConjugation" target="_blank" title="Conjugation engine"><BootstrapIcon>github</BootstrapIcon> Conjugation engine</a>
            </li>
        </ul>;
    }

    private RenderNav()
    {
        return <Navigation>
            <div className="row m-auto">
                {this.RenderBanner()}
                {this.RenderNavItems()}
            </div>
        </Navigation>;
    }

    private RenderNavItems()
    {
        if(this.cachingFailed || this.loading)
            return null;

        return <>
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
        </>;
    }

    //Event handlers
    override async OnInitiated(): Promise<void>
    {
        await this.pageLanguageService.LoadLanguages();

        try
        {
            await this.dialectsService.CacheDialects(); //dialects are required to be loaded and cached
        }
        catch(_)
        {
            this.cachingFailed = true;
        }
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
    private cachingFailed: boolean;
}