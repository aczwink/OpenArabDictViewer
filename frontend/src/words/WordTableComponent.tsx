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

import { BootstrapIcon, Component, Injectable, JSX_CreateElement, JSX_Fragment, ProgressSpinner } from "@aczwink/acfrontend";
import { WordFunctionComponent } from "./WordFunctionComponent";
import { CachedAPIService, WordWithConnections } from "../services/CachedAPIService";
import { WordReferenceComponent } from "./WordReferenceComponent";
import { FullWordData } from "../../dist/api";

interface WordWithLevel
{
    level: number;
    word: FullWordData;
}

@Injectable
export class WordTableComponent extends Component<{ collapse: boolean; words: WordWithConnections[] }>
{
    constructor(private cachedAPIService: CachedAPIService)
    {
        super();

        this.words = [];
        this.loading = true;
    }

    protected Render(): RenderValue
    {
        if(this.loading)
            return <ProgressSpinner />;
        if(this.words.length === 0)
            return <i>none</i>;
        
        return <table className="table table-striped table-hover table-sm">
            <thead>
                <tr>
                    <th>Word</th>
                    <th>Translation</th>
                </tr>
            </thead>
            <tbody>
                {this.words.map(x => <tr>
                    <td>
                        <span style="white-space: pre">{this.Indent(x.level)}</span>
                        <WordReferenceComponent word={x.word.word} />
                    </td>
                    <td><WordFunctionComponent word={x.word} /></td>
                </tr>)}
            </tbody>
        </table>;
    }

    //Private methods
    private Indent(level: number): RenderValue
    {
        let s = "";

        while(level--)
            s += "    ";

        if(s.length > 0)
        {
            return <>
                {s}
                <BootstrapIcon>chevron-right</BootstrapIcon>
            </>;
        }

        return s;
    }

    private async LoadChildren(level: number, wordIds: string[], destination: WordWithLevel[])
    {
        for (const wordId of wordIds)
        {
            const result = await this.cachedAPIService.QueryWordWithConnections(wordId);
            const word = result!;

            destination.push({
                word: word,
                level
            });

            await this.LoadChildren(level + 1, word.derived, destination);
        }
    }

    //Event handlers
    override async OnInitiated(): Promise<void>
    {
        if(!this.input.collapse)
        {
            this.words = this.input.words.map(x => ({
                level: 0,
                word: x
            }));
            this.loading = false;
            return;
        }

        const words: WordWithLevel[] = [];
        for (const rootWord of this.input.words)
        {
            words.push({
                level: 0,
                word: rootWord
            });

            await this.LoadChildren(1, rootWord.derived, words);
        }

        this.words = words;
        this.loading = false;
    }

    //State
    private loading: boolean;
    private words: WordWithLevel[];
}