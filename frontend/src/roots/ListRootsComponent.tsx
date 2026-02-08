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

import { Anchor, BootstrapIcon, Component, I18n, Injectable, JSX_CreateElement, ProgressSpinner, RouterState } from "@aczwink/acfrontend";
import { APIService } from "../services/APIService";
import { VerbRoot } from "@aczwink/openarabicconjugation/dist/VerbRoot";
import { AreValidRootCharacters, DoRootCharactersFormValidRoot, RootToString } from "./general";
import { RadicalsEditorComponent } from "./RadicalsEditorComponent";
import { OpenArabDictRoot } from "@aczwink/openarabdict-domain";

interface AlphabetRange
{
    first: number;
    count: number;
}

const alphabetChars: AlphabetRange[] = [
    { first: 0x0621, count: 1}, //hamza
    { first: 0x0628, count: 1}, //ba
    { first: 0x062A, count: 17}, //ta - ghain
    { first: 0x0641, count: 8}, //fa - waw
    { first: 0x064A, count: 1}, //ya
];

@Injectable
export class ListRootsComponent extends Component
{
    constructor(routerState: RouterState, private apiService: APIService)
    {
        super();

        this.searchText = routerState.queryParams.searchText || null;
        this.data = null;
    }

    protected Render(): RenderValue
    {
        return <fragment>
            <div className="row">
                <div className="col">
                    <ul className="nav nav-pills">
                        {alphabetChars.map(this.RenderRange.bind(this))}
                    </ul>
                </div>
                <div className="col-auto">
                    <div className="input-group input-group-sm">
                        <span className="input-group-text"><BootstrapIcon>search</BootstrapIcon></span>
                        <RadicalsEditorComponent radicals={this.searchText ?? ""} onDataChanged={this.OnSearchChanged.bind(this)} joinBeginning={true} />
                    </div>
                </div>
            </div>
            <div className="container">
                {this.RenderTable()}
            </div>
        </fragment>;
    }

    //Private state
    private searchText: string | null;
    private data: OpenArabDictRoot[] | null;

    //Private methods
    private RenderRange(range: AlphabetRange)
    {
        const elems = [];
        for(let i = 0; i < range.count; i++)
        {
            const char = String.fromCodePoint(range.first + i);
            elems.push(
                <li><a className={"nav-link" + (this.searchText?.startsWith(char) ? " active" : "")} onclick={this.OnSearchChanged.bind(this, char)} role="button">{char}</a></li>
            );
        }
        return elems;
    }

    private RenderRootRow(rootData: OpenArabDictRoot)
    {
        const root = new VerbRoot(rootData.radicals);
        return <tr>
            <td>{root.r4}</td>
            <td>{root.r3}</td>
            <td>{root.r2}</td>
            <td><Anchor route={"/roots/" + rootData.id}>{RootToString(rootData)}</Anchor></td>
        </tr>;
    }

    private RenderTable()
    {
        if(this.data === null)
            return <ProgressSpinner />;
        if(this.data.length === 0)
        {
            const len = this.searchText?.length ?? 0;
            if(len > 2)
            {
                const rootRadicals = this.searchText!;
                if(DoRootCharactersFormValidRoot(rootRadicals))
                {
                    const root = new VerbRoot(rootRadicals);
                    return "Root " + root.ToString() + " does not exist.";
                }
            }
            return I18n("search.empty");
        }

        return <table className="table table-striped table-hover table-sm text-center" style="margin-left: auto; margin-right: auto; width: auto;">
            <thead>
                <tr>
                    <th>r4</th>
                    <th>r3</th>
                    <th>r2</th>
                    <th>Radicals</th>
                </tr>
            </thead>
            <tbody>
                {this.data.map(this.RenderRootRow.bind(this))}
            </tbody>
        </table>;
    }

    //Event handlers
    override async OnInitiated(): Promise<void>
    {
        if(this.searchText !== null)
        {
            const response = await this.apiService.roots.get({ prefix: this.searchText });
            this.data = response.data;
        }
        else
            this.data = [];
    }

    private async OnSearchChanged(newValue: string)
    {
        if((newValue !== this.searchText) && AreValidRootCharacters(newValue) && (newValue.length > 0))
        {
            this.data = null;
            this.searchText = newValue;

            const response = await this.apiService.roots.get({ prefix: newValue });
            this.data = response.data;
        }
    }
}