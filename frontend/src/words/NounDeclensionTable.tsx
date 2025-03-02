/**
 * OpenArabDictViewer
 * Copyright (C) 2024-2025 Amir Czwink (amir130@hotmail.de)
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
import { CachedAPIService } from "../services/CachedAPIService";
import { Case, Gender, NounState, Numerus } from "openarabicconjugation/src/Definitions";
import { OpenArabDictNonVerbDerivationType } from "../../dist/api";
import { DisplayVocalized, ParseVocalizedText } from "openarabicconjugation/src/Vocalization";
import { RenderWithDiffHighlights } from "../shared/RenderWithDiffHighlights";
import { TargetNounDerivation } from "openarabicconjugation/src/DialectConjugator";
import { ConjugationService } from "../services/ConjugationService";
import { DialectType } from "openarabicconjugation/src/Dialects";
import { OpenArabDictGenderedWord, OpenArabDictWord, OpenArabDictWordParentType } from "openarabdict-domain";

@Injectable
export class NounDeclensionTable extends Component<{ word: OpenArabDictGenderedWord; derivedWordIds: string[]; }>
{
    constructor(private cachedAPIService: CachedAPIService, private conjugationService: ConjugationService)
    {
        super();

        this.plurals = null;
    }

    protected Render(): RenderValue
    {
        if(this.plurals === null)
            return <ProgressSpinner />;

        const isSingular = this.IsSingular();
        const hasPlural = this.HasPlural();

        return <table className="table table-sm table-bordered text-center">
            <tbody>
                {this.RenderNumerus(isSingular ? Numerus.Singular : Numerus.Plural)}
                {hasPlural ? this.RenderNumerus(Numerus.Dual) : null}
            </tbody>
        </table>;
    }

    //State
    private plurals: OpenArabDictWord[] | null;

    //Private methods
    private BuildBaseNoun(referenceWord: DisplayVocalized[], targetGender: Gender, targetNumerus: Numerus)
    {
        switch(targetNumerus)
        {
            case Numerus.Dual:
                return this.conjugationService.DeriveSoundNoun(DialectType.ModernStandardArabic, referenceWord, targetGender, TargetNounDerivation.DeriveDualSameGender);
            case Numerus.Plural:
            case Numerus.Singular:
                return referenceWord;
        }
    }

    private HasPlural()
    {
        return this.plurals!.length > 0;
    }

    private IsSingular()
    {
        if(this.input.word.parent !== undefined)
        {
            if(this.input.word.parent.type === OpenArabDictWordParentType.NonVerbWord)
                this.input.word.parent.relationType !== OpenArabDictNonVerbDerivationType.Plural;
        }
        return true;
    }

    private async LoadPlurals()
    {
        const derived = await this.input.derivedWordIds.Values().Map(x => this.cachedAPIService.QueryWord(x)).PromiseAll();

        this.plurals = derived.filter(x => (x.parent?.type === OpenArabDictWordParentType.NonVerbWord) && (x.parent.relationType === OpenArabDictNonVerbDerivationType.Plural));
    }
    
    private RenderNumerus(numerus: Numerus)
    {
        function headline()
        {
            switch(numerus)
            {
                case Numerus.Dual:
                    return "Dual";
                case Numerus.Plural:
                    return "Plural";
                case Numerus.Singular:
                    return "Singular";
            }
        }

        return <fragment>
            <tr>
                <th>{headline()}</th>
                <th>Indefinite</th>
                <th>Definite</th>
                <th>Construct</th>
            </tr>
            
            <tr>
                <td>Nominative</td>
                {this.RenderNumerusCase(numerus, Case.Nominative)}
            </tr>
            <tr>
                <td>Accusative</td>
                {this.RenderNumerusCase(numerus, Case.Accusative)}
            </tr>
            <tr>
                <td>Genitive</td>
                {this.RenderNumerusCase(numerus, Case.Genitive)}
            </tr>
        </fragment>;
    }

    private RenderNumerusCase(numerus: Numerus, c: Case)
    {
        const hasMale = this.input.word.isMale;
        const gender = hasMale ? Gender.Male : Gender.Female;
        return <fragment>
            {this.RenderNumerusCaseGender(numerus, c, gender)}
        </fragment>;
    }

    private RenderNumerusCaseGender(numerus: Numerus, c: Case, gender: Gender)
    {
        const inputWord = this.input.word.text;
        const parsed = ParseVocalizedText(inputWord);

        return <fragment>
            <td>{this.RenderCell(numerus, c, gender, parsed, NounState.Indefinite)}</td>
            <td>{this.RenderCell(numerus, c, gender, parsed, NounState.Definite)}</td>
            <td>{this.RenderCell(numerus, c, gender, parsed, NounState.Construct)}</td>
        </fragment>;
    }

    private RenderCell(numerus: Numerus, c: Case, gender: Gender, parsed: DisplayVocalized[], state: NounState)
    {
        const base = this.BuildBaseNoun(parsed, gender, numerus);

        const declined = this.conjugationService.DeclineNoun(DialectType.ModernStandardArabic, {
            gender,
            numerus,
            vocalized: base.DeepClone() //TODO: why is the clone necessary?
        }, {
            state,
            case: c,
        });
        return RenderWithDiffHighlights(declined, parsed);
    }
    
    //Event handlers
    override OnInitiated(): void
    {
        this.LoadPlurals();
    }
}