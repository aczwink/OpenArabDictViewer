/**
 * OpenArabDictViewer
 * Copyright (C) 2025-2026 Amir Czwink (amir130@hotmail.de)
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

import { Component, Injectable, JSX_CreateElement } from "@aczwink/acfrontend";
import { GlobalSettingsService } from "./services/GlobalSettingsService";
import { DialectsService } from "./services/DialectsService";
import { DialectType } from "@aczwink/openarabicconjugation";

@Injectable
export class DialectSelectionComponent extends Component<{ onDialectChanged: () => void }>
{
    constructor(private globalSettingsService: GlobalSettingsService, private dialectsService: DialectsService)
    {
        super();
    }

    protected Render(): RenderValue
    {
        const dialects: DialectType[] = [DialectType.ModernStandardArabic, DialectType.Lebanese, DialectType.SouthLevantine];

        const activeDialect = this.globalSettingsService.dialectType;
        return <div className="flex-shrink-0 py-2">
            <a href="#" className="text-decoration-none dropdown-toggle" data-bs-toggle="dropdown">
                {this.RenderFlag(activeDialect)}
            </a>
            <ul className="dropdown-menu shadow">
                {dialects.map(this.RenderSelection.bind(this))}
            </ul>
        </div>;
    }

    //Private methods
    private RenderFlag(dialectType: DialectType)
    {
        return this.dialectsService.FindDialect(dialectType)?.emojiCodes;
    }

    private RenderName(dialectType: DialectType)
    {
        return this.dialectsService.FindDialect(dialectType)?.name;
    }
    
    private RenderSelection(dialectType: DialectType)
    {
        const className = (dialectType === this.globalSettingsService.dialectType) ? "dropdown-item active" : "dropdown-item";
        return <li>
            <a className={className} href="#" onclick={this.OnChangeDialect.bind(this, dialectType)}>{this.RenderFlag(dialectType)} {this.RenderName(dialectType)}</a>
        </li>;
    }

    //Event handlers
    private OnChangeDialect(dialectType: DialectType, event: Event)
    {
        event.preventDefault();
        this.globalSettingsService.dialectType = dialectType;

        this.input.onDialectChanged();
    }
}