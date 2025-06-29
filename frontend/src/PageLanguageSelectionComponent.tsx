/**
 * OpenArabDictViewer
 * Copyright (C) 2025 Amir Czwink (amir130@hotmail.de)
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

import { Component, Injectable, JSX_CreateElement } from "acfrontend";
import { GlobalSettingsService } from "./services/GlobalSettingsService";
import { TargetTranslationLanguage } from "../dist/api";

@Injectable
export class PageLanguageSelectionComponent extends Component<{ onLanguageChanged: () => void }>
{
    constructor(private pageLanguageService: GlobalSettingsService)
    {
        super();
    }

    protected Render(): RenderValue
    {
        const languages: TargetTranslationLanguage[] = ["en", "de"];

        const activeLang = this.pageLanguageService.activeLanguage;
        return <div className="flex-shrink-0 py-2">
            <a href="#" className="text-decoration-none dropdown-toggle" data-bs-toggle="dropdown">
                {this.RenderFlag(activeLang)}
            </a>
            <ul className="dropdown-menu shadow">
                {languages.map(this.RenderSelection.bind(this))}
            </ul>
        </div>;
    }

    //Private methods
    private RenderFlag(pageLanguage: TargetTranslationLanguage)
    {
        switch(pageLanguage)
        {
            case "de":
                return "🇩🇪";
            case "en":
                return "🇬🇧";
        }
    }

    private RenderName(pageLanguage: TargetTranslationLanguage)
    {
        switch(pageLanguage)
        {
            case "de":
                return "Deutsch";
            case "en":
                return "English";
        }
    }
    
    private RenderSelection(pageLanguage: TargetTranslationLanguage)
    {
        const className = (pageLanguage === this.pageLanguageService.activeLanguage) ? "dropdown-item active" : "dropdown-item";
        return <li>
            <a className={className} href="#" onclick={this.OnChangeLanguage.bind(this, pageLanguage)}>{this.RenderFlag(pageLanguage)} {this.RenderName(pageLanguage)}</a>
        </li>;
    }

    //Event handlers
    private OnChangeLanguage(pageLanguage: TargetTranslationLanguage, event: Event)
    {
        event.preventDefault();
        this.pageLanguageService.activeLanguage = pageLanguage;

        this.input.onLanguageChanged();
    }
}