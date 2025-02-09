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

import { Component, Injectable, JSX_CreateElement, ProgressSpinner, Router, RouterState } from "acfrontend";
import { FullWordData, RootOverviewData, VerbData } from "../../dist/api";
import { APIService } from "../services/APIService";
import { VerbPreviewComponent } from "../verbs/VerbPreviewComponent";
import { WordOverviewComponent } from "../words/WordOverviewComponent";
import { RootToString, RootTypeToPattern, RootTypeToString } from "./general";
import { ConjugationService } from "../services/ConjugationService";
import { Buckwalter } from "openarabicconjugation/dist/Transliteration";
import { Letter } from "openarabicconjugation/src/Definitions";
import { RootType, VerbRoot } from "openarabicconjugation/src/VerbRoot";

interface ShowRootData
{
    root: RootOverviewData;
    verbs: VerbData[];
}

@Injectable
export class ShowRootComponent extends Component
{
    constructor(routerState: RouterState, private apiService: APIService, private router: Router, private conjugationService: ConjugationService)
    {
        super();

        this.rootId = parseInt(routerState.routeParams.rootId!);
        this.data = null;
        this.derivedWords = null;
    }
    
    protected Render(): RenderValue
    {
        if(this.data === null)
            return <ProgressSpinner />;

        const root = new VerbRoot(this.data.root.radicals);
        return <fragment>
            <div className="row">
                <h2>Root: {RootToString(this.data.root)}</h2>
            </div>
            <table>
                <tbody>
                    <tr>
                        <th>Type:</th>
                        <td>
                            {RootTypeToString(root.type)}
                            {" "}
                            {RootTypeToPattern(root.type)}
                        </td>
                    </tr>
                </tbody>
            </table>
            <a href={"http://ejtaal.net/aa#bwq=" + this.ToEjtaalQuery()} target="_blank">See on Mawrid reader</a>

            <h4>Verbs</h4>
            {this.data.verbs.map(x => <VerbPreviewComponent root={this.data!.root} verbData={x} />)}
            <h4>Words</h4>
            {this.RenderDerivedWords()}
        </fragment>;
    }

    //Private state
    private rootId: number;
    private data: ShowRootData | null;
    private derivedWords: FullWordData[] | null;

    //Private methods
    private RenderDerivedWords()
    {
        if(this.derivedWords === null)
            return <ProgressSpinner />;

        return <table className="table table-striped table-hover table-sm">
            <thead>
                <tr>
                    <th>Word</th>
                    <th>Translation</th>
                </tr>
            </thead>
            <tbody>
                {this.derivedWords.map(x => <WordOverviewComponent word={x} />)}
            </tbody>
        </table>;
    }

    private ToEjtaalQuery()
    {
        const root = new VerbRoot(this.data!.root.radicals);
        const radicals = root.radicalsAsSeparateLetters;
        if(root.type === RootType.SecondConsonantDoubled)
            radicals.Remove(2);

        function ejtaal(letter: Letter)
        {
            switch(letter)
            {
                case Letter.Hamza:
                    return Buckwalter.CharToString(Letter.Alef);
            }
            return Buckwalter.CharToString(letter);
        }

        return radicals.map(ejtaal).join("");
    }

    //Event handlers
    override async OnInitiated(): Promise<void>
    {
        const response1 = await this.apiService.roots._any_.get(this.rootId);
        const response2 = await this.apiService.roots._any_.verbs.get(this.rootId);

        if(response1.statusCode != 200)
            throw new Error("TODO: implement me");

        this.data = {
            root: response1.data,
            verbs: response2.data
        };

        const response3 = await this.apiService.roots._any_.words.get(this.rootId);
        this.derivedWords = response3.data;
    }
}