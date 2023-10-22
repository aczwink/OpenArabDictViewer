/**
 * ArabDict
 * Copyright (C) 2023 Amir Czwink (amir130@hotmail.de)
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

import { Component, Injectable, JSX_CreateElement, ProgressSpinner, Router, RouterState, Select } from "acfrontend";
import { RootCreationData, VerbData } from "../../dist/api";
import { APIService } from "../APIService";
import { VerbEditorComponent } from "./VerbEditorComponent";
import { ConjugationService } from "../ConjugationService";

@Injectable
export class EditVerbComponent extends Component
{
    constructor(private apiService: APIService, routerState: RouterState, private router: Router, private conjugationService: ConjugationService)
    {
        super();

        this.verbId = parseInt(routerState.routeParams.verbId!);
        this.root = { radicals: "" };
        this.data = null;
    }
    
    protected Render(): RenderValue
    {
        if(this.data === null)
            return <ProgressSpinner />;

        return <fragment>
            <VerbEditorComponent data={this.data} rootRadicals={this.root.radicals} onChanged={this.Update.bind(this)} />

            <button className="btn btn-primary" type="button" onclick={this.OnSave.bind(this)}>Save</button>
        </fragment>;
    }

    //Private state
    private verbId: number;
    private data: VerbData | null;
    private root: RootCreationData;

    //Event handlers
    override async OnInitiated(): Promise<void>
    {
        const response1 = await this.apiService.verbs.get({ verbId: this.verbId });
        if(response1.statusCode !== 200)
            throw new Error("TODO implement me");

        const response2 = await this.apiService.roots._any_.get(response1.data.rootId);
        if(response2.statusCode !== 200)
            throw new Error("TODO implement me");

        this.root = response2.data;
        this.data = response1.data;
    }

    private async OnSave()
    {
        const data = this.data!;
        this.data = null;

        await this.apiService.verbs.put({
            verbId: this.verbId,
            data: {
                stem: data.stem,
                translations: data.translations,
                stem1Context: data.stem1Context,
            }
        });
        
        this.router.RouteTo("/verbs/" + this.verbId);
    }
}