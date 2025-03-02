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

import { Component, Injectable, JSX_CreateElement, ProgressSpinner, RouterState } from "acfrontend";
import { RootToString, RootTypeToPattern, RootTypeToString } from "./general";
import { Buckwalter } from "openarabicconjugation/dist/Transliteration";
import { Letter } from "openarabicconjugation/src/Definitions";
import { RootType, VerbRoot } from "openarabicconjugation/src/VerbRoot";
import { CachedAPIService, WordWithConnections } from "../services/CachedAPIService";
import { OpenArabDictRoot, OpenArabDictWord } from "openarabdict-domain";
import { WordTableComponent } from "../words/WordTableComponent";

interface ShowRootData
{
    root: OpenArabDictRoot;
    words: WordWithConnections[];
}

@Injectable
export class ShowRootComponent extends Component
{
    constructor(routerState: RouterState, private cachedAPIService: CachedAPIService)
    {
        super();

        this.rootId = routerState.routeParams.rootId!;
        this.data = null;
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

            <WordTableComponent collapse words={this.data.words} />
        </fragment>;
    }

    //Private state
    private rootId: string;
    private data: ShowRootData | null;

    //Private methods
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
        const root = await this.cachedAPIService.QueryRootData(this.rootId);
        const words = await this.cachedAPIService.QueryRootWords(this.rootId);

        this.data = {
            root,
            words,
        };
    }
}