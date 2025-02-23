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

import { Component, Injectable, JSX_CreateElement, ProgressSpinner } from "acfrontend";
import { APIService } from "./services/APIService";
import { RenderTranslations } from "./shared/translations";
import { WordTypeToText } from "./shared/words";
import { DialectsService } from "./services/DialectsService";
import { VerbRoot } from "openarabicconjugation/src/VerbRoot";
import { CachedAPIService } from "./services/CachedAPIService";
import { OpenArabDictWord } from "openarabdict-domain";
import { VerbConjugationService } from "./services/VerbConjugationService";

@Injectable
export class LearnComponent extends Component
{
    constructor(private apiService: APIService, private cachedAPIService: CachedAPIService, private verbConjugationService: VerbConjugationService, private dialectsService: DialectsService)
    {
        super();

        this.data = null;
        this.rootRadicals = "";
        this.showTashkil = false;
        this.resolve = false;
    }
    
    protected Render()
    {
        if(this.data === null)
            return <ProgressSpinner />;

        const root = new VerbRoot(this.rootRadicals);
        /*const title = ("rootId" in this.data) ? this.conjugationService.ConjugateToString(this.dialectsService.MapIdToType(this.data.dialectId), root, {
            gender: Gender.Male,
            tense: Tense.Perfect,
            numerus: Numerus.Singular,
            person: Person.Third,
            stem: this.data.stem as any,
            stem1Context: Stem1DataToStem1ContextOptional(DialectType.ModernStandardArabic, root.DeriveDeducedVerbType(), this.data.stem1Context),
            voice: Voice.Active
        }) : this.data.word;

        if(this.resolve)
        {
            return <div className="row justify-content-center text-center">
                <div className="col-auto">
                    <h1>{title}</h1>
                    <div className="row">
                        <div className="col">
                            { "translations" in this.data ? RenderTranslations(this.data.translations) : this.RenderFunctions(this.data.functions)}
                        </div>
                    </div>
                    <button type="button" className="btn btn-primary" onclick={this.LoadNextWord.bind(this)}>Next</button>
                </div>
            </div>;
        }

        const tashkilTitle = this.showTashkil ? title : RemoveTashkilButKeepShadda(title);

        return <div className="row justify-content-center text-center">
            <div className="col-auto">
                <h1>{tashkilTitle}</h1>
                <FormField title="Show tashkil">
                    <CheckBox value={this.showTashkil} onChanged={newValue => this.showTashkil = newValue} />
                </FormField>
                <button type="button" className="btn btn-primary" onclick={() => this.resolve = true}>Resolve</button>
            </div>
        </div>;*/
    }

    //Private state
    private data: OpenArabDictWord | null;
    private rootRadicals: string;
    private showTashkil: boolean;
    private resolve: boolean;

    //Private methods
    private async LoadNextWord()
    {
        this.data = null;
        this.showTashkil = false;
        this.resolve = false;

        const response = await this.apiService.randomword.get();
        const wordId = response.data;

        const word = await this.cachedAPIService.QueryWord(wordId);

        /*const response3 = await this.apiService.roots._any_.get(response2.data.rootId);
        if(response3.statusCode !== 200)
            throw new Error("TODO: implement me");
        this.rootRadicals = response3.data.radicals;*/


        this.data = word;
        throw new Error("TODO: need root first, i.e. fix diff between verbs and words");
    }

    private RenderFunction(func: OpenArabDictWord)
    {
        return <fragment>
            <h4>{WordTypeToText(func.type)}</h4>
            {RenderTranslations(func.translations)}
        </fragment>;
    }

    //Event handlers
    override OnInitiated(): void
    {
        this.LoadNextWord();
    }
}