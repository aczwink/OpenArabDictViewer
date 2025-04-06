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

import { Injectable, Component, JSX_CreateElement, JSX_Fragment } from "acfrontend";
import { Case, Gender } from "openarabicconjugation/src/Definitions";
import { DialectType } from "openarabicconjugation/src/Dialects";
import { ConjugationService } from "../services/ConjugationService";
import { OpenArabDictGenderedWord, OpenArabDictNonVerbDerivationType, OpenArabDictWordParentType } from "openarabdict-domain";
import { CachedAPIService } from "../services/CachedAPIService";

@Injectable
export class AdjectiveDeclensionTable extends Component<{ word: OpenArabDictGenderedWord; }>
{
    constructor(private conjugationService: ConjugationService, private cachedAPIService: CachedAPIService)
    {
        super();
        this.baseWord = "";
    }

    protected Render(): RenderValue
    {
        return <table className="table table-sm table-bordered text-center">
            <thead>
                <tr>
                    <th>Singular</th>
                    <th colSpan="2">Masculine</th>
                    <th colSpan="2">Feminine</th>
                </tr>
                <tr>
                    <th> </th>
                    <th>Indefinite</th>
                    <th>Definite</th>
                    <th>Indefinite</th>
                    <th>Definite</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Informal</td>
                    {this.RenderAdjectiveDeclensionTableForCase(Case.Informal)}
                </tr>
                <tr>
                    <td>Nominative</td>
                    {this.RenderAdjectiveDeclensionTableForCase(Case.Nominative)}
                </tr>
                <tr>
                    <td>Genitive</td>
                    {this.RenderAdjectiveDeclensionTableForCase(Case.Genitive)}
                </tr>
                <tr>
                    <td>Accusative</td>
                    {this.RenderAdjectiveDeclensionTableForCase(Case.Accusative)}
                </tr>
            </tbody>
        </table>;
    }

    //Private methods
    private RenderAdjectiveDeclensionTableForCase(casus: Case)
    {
        const render = (definite: boolean, gender: Gender, c: Case) => this.conjugationService.DeclineAdjective(DialectType.ModernStandardArabic, this.baseWord, {
            definite,
            gender,
            case: c
        });

        return <>
            <td>{render(false, Gender.Male, casus)}</td>
            <td>{render(true, Gender.Male, casus)}</td>
            <td>{render(false, Gender.Female, casus)}</td>
            <td>{render(true, Gender.Female, casus)}</td>
        </>;
    }

    //Event handlers
    override async OnInitiated(): Promise<void>
    {
        this.baseWord = this.input.word.text;
        if((this.input.word.parent?.type === OpenArabDictWordParentType.NonVerbWord) && (this.input.word.parent.relationType === OpenArabDictNonVerbDerivationType.Feminine))
        {
            const word = await this.cachedAPIService.QueryWord(this.input.word.parent.wordId);
            this.baseWord = word.text;
        }
    }

    //State
    private baseWord: string;
}