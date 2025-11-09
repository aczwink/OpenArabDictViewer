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

import { Component, Injectable, JSX_CreateElement } from "acfrontend";
import { DialectsService } from "../services/DialectsService";
import { DialectType } from "openarabicconjugation/src/Dialects";
import { OpenArabDictDialect } from "../../dist/api";

@Injectable
export class DialectSelectionComponent extends Component<{ dialectId: number; onValueChanged: (dialectId: number) => void; }>
{
    constructor(private dialectsService: DialectsService)
    {
        super();

        this.dialects = [];
    }
    
    protected Render(): RenderValue
    {
        const dialect = this.dialects.find(x => x.id === this.input.dialectId);
        if(dialect === undefined)
            return "";

        return <div className="flex-shrink-0">
            <a href="#" className="text-decoration-none dropdown-toggle" data-bs-toggle="dropdown">
                {dialect.emojiCodes} {dialect.name}
            </a>
            <ul className="dropdown-menu shadow">
                {this.RenderDialectChildrenOf(null, 0)}
            </ul>
        </div>;
    }

    //State
    private dialects: OpenArabDictDialect[];

    //Private methods
    private RenderDialectChildrenOf(parent: number | null, level: number)
    {
        //const filtered = this.dialects.filter(x => x.parent === parent);
        const filtered = this.dialects;
        return filtered.map(x => <fragment>
            {this.RenderDialect(x, level)}
        </fragment>);
        //{this.RenderDialectChildrenOf(x.id, level + 1)}
    }

    private RenderDialect(x: OpenArabDictDialect, level: number)
    {        
        const indention = "  ".repeat(level);
        return <li>
            <a className={(x.id === this.input.dialectId) ? "dropdown-item active" : "dropdown-item"} onclick={this.OnChangeDialect.bind(this, x)} href="#" style="white-space: pre;">{indention}{x.emojiCodes} {x.name}</a>
        </li>;
    }

    //Event handlers
    private OnChangeDialect(dialect: OpenArabDictDialect, event: Event)
    {
        event.preventDefault();
        this.input.onValueChanged(dialect.id);
        this.Update();
    }

    override OnInitiated(): void
    {
        const dialects = this.dialectsService.QueryConjugatableDialects();
        this.dialects = dialects.Values().OrderBy(x => x.name).ToArray();

        if(this.dialects.find(x => x.id === this.input.dialectId) === undefined)
            this.input.onValueChanged(this.dialectsService.FindDialect(DialectType.ModernStandardArabic)!.id);
    }
}