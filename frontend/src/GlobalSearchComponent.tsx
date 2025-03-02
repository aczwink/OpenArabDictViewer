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

import { Component, FormField, Injectable, JSX_CreateElement, LineEdit, ProgressSpinner, Select, Switch } from "acfrontend";
import { allWordTypes, WordTypeToText } from "./shared/words";
import { APIService } from "./services/APIService";
import { WordFunctionComponent } from "./words/WordFunctionComponent";
import { OpenArabDictWord, OpenArabDictWordType } from "openarabdict-domain";
import { SearchResultEntry } from "../dist/api";
import { WordReferenceComponent } from "./words/WordReferenceComponent";

@Injectable
export class GlobalSearchComponent extends Component
{
    constructor(private apiService: APIService
    )
    {
        super();

        this.filter = "";

        this.extendedSearch = false;
        this.wordType = null;

        this.isSearching = false;
        this.offset = 0;
        this.limit = 25;
        this.data = [];
    }
    
    protected Render(): RenderValue
    {
        return <fragment>
            {this.RenderFilterForm()}
            {this.isSearching ? <ProgressSpinner /> : null}
            {this.RenderResults()}
        </fragment>;
    }

    //State
    private filter: string;

    private extendedSearch: boolean;
    private wordType: OpenArabDictWordType | null;

    private isSearching: boolean;
    private offset: number;
    private limit: number;
    private data: SearchResultEntry[];

    //Private methods
    private async PerformSearch()
    {
        this.isSearching = true;
        this.data = [];

        const response = await this.apiService.words.get({
            textFilter: this.filter,
            wordType: this.wordType,
            offset: this.offset,
            limit: this.limit
        });
        this.data = response.data;
        this.data.SortByDescending(x => x.score);

        this.isSearching = false;
    }

    private RenderExtendedFilterForm()
    {
        if(this.extendedSearch === false)
            return null;
        return <div className="row">
            <div className="col">
                <FormField title="Word type">
                    <Select onChanged={this.OnWordTypeChanged.bind(this)}>
                        <option selected={this.wordType === null} value={"null"}>Any</option>
                        {allWordTypes.map(x => <option selected={x === this.wordType} value={x}>{WordTypeToText(x)}</option>)}
                    </Select>
                </FormField>
            </div>
        </div>;
    }

    private RenderFilterForm()
    {
        return <form onsubmit={this.OnSubmit.bind(this)}>
            <div className="row">
                <div className="col">
                    <FormField title="Search..." description="Enter any conjugated verb, parts of a word, parts of a translation, etc.">
                        <LineEdit value={this.filter} onChanged={newValue => this.filter = newValue} />
                    </FormField>
                </div>
                <div className="col-auto">
                    <label className="small">Extended <Switch checked={this.extendedSearch} onChanged={newValue => this.extendedSearch = newValue} /></label>
                    <br />
                    <button className="btn btn-primary" type="submit">Search</button>                    
                </div>
            </div>
            {this.RenderExtendedFilterForm()}
        </form>;
    }

    private RenderResultEntry(entry: SearchResultEntry)
    {
        if(entry.conjugated === undefined)
        {
            return <tr>
                <td><WordReferenceComponent word={entry.word.word as OpenArabDictWord} /></td>
                <td><WordFunctionComponent word={entry.word.word as OpenArabDictWord} /></td>
            </tr>;
        }

        return <tr>
            <td>{entry.conjugated}</td>
            <td><i>conjugation of</i> <WordReferenceComponent word={entry.word.word as OpenArabDictWord} /></td>
        </tr>;
    }

    private RenderResults()
    {
        if(this.data.length === 0)
            return "nothing found";

        return <table className="table table-striped table-hover table-sm">
            <thead>
                <tr>
                    <th>Word</th>
                    <th>Translation</th>
                </tr>
            </thead>
            <tbody>
                {this.data.map(this.RenderResultEntry.bind(this))}
            </tbody>
        </table>;
    }

    //Event handlers
    private OnSubmit(event: Event)
    {
        event.preventDefault();
        this.PerformSearch();
    }

    private OnWordTypeChanged(newValue: string[])
    {
        const x = newValue[0];
        if(x === "null")
            this.wordType = null;
        else
            this.wordType = parseInt(newValue[0]);
    }
}