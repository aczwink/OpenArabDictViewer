/**
 * OpenArabDictViewer
 * Copyright (C) 2024-2026 Amir Czwink (amir130@hotmail.de)
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

import { Component, Injectable, JSX_CreateElement, JSX_Fragment, ProgressSpinner } from "@aczwink/acfrontend";
import { CachedAPIService } from "../services/CachedAPIService";
import { Case, Gender, Numerus } from "@aczwink/openarabicconjugation/dist/Definitions";
import { OpenArabDictNonVerbDerivationType } from "../../dist/api";
import { DisplayVocalized, ParseVocalizedText } from "@aczwink/openarabicconjugation/dist/Vocalization";
import { RenderWithDiffHighlights } from "../shared/RenderWithDiffHighlights";
import { ConjugationService } from "../services/ConjugationService";
import { OpenArabDictGenderedWord, OpenArabDictWord, OpenArabDictWordParentType, OpenArabDictWordType } from "@aczwink/openarabdict-domain";
import { AdjectiveOrNounInput, TargetAdjectiveNounDerivation } from "@aczwink/openarabicconjugation/dist/DialectConjugator";
import { AdjectiveOrNounState } from "@aczwink/openarabicconjugation/dist/Definitions";
import { DialectType } from "@aczwink/openarabicconjugation";

@Injectable
export class AdjectiveOrNounDeclensionTable extends Component<{ word: OpenArabDictGenderedWord; derivedWordIds: string[]; }>
{
    constructor(private cachedAPIService: CachedAPIService, private conjugationService: ConjugationService)
    {
        super();

        this.definite = null;
        this.feminine = null;
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
    private definite: OpenArabDictWord | null;
    private feminine: OpenArabDictWord | null;
    private plurals: OpenArabDictWord[] | null;

    //Private methods
    private DeriveBase(targetGender: Gender, targetNumerus: Numerus)
    {
        const sourceState = this.GetSourceState();

        if(sourceState.gender !== targetGender)
        {
            if(sourceState.gender === Gender.Female)
                throw new Error("TODO1");
            if(sourceState.numerus !== Numerus.Singular)
                throw new Error("TODO2");

            const feminine = (this.feminine === null)
                ? this.conjugationService.DeriveSoundAdjectiveOrNoun(DialectType.ModernStandardArabic, sourceState.vocalized, sourceState.gender, TargetAdjectiveNounDerivation.DeriveFeminineSingular)
                : ParseVocalizedText(this.feminine.text);
                
            return this.DeriveNumerus({
                gender: targetGender,
                numerus: sourceState.numerus,
                vocalized: feminine
            }, targetNumerus);
        }
        return this.DeriveNumerus(sourceState, targetNumerus);
    }

    private DeriveNumerus(sourceState: AdjectiveOrNounInput, targetNumerus: Numerus)
    {
        switch(targetNumerus)
        {
            case Numerus.Dual:
                return this.conjugationService.DeriveSoundAdjectiveOrNoun(DialectType.ModernStandardArabic, sourceState.vocalized, sourceState.gender, TargetAdjectiveNounDerivation.DeriveDualSameGender);
            case Numerus.Plural:
                return sourceState.vocalized;
            case Numerus.Singular:
                return sourceState.vocalized;
        }
    }

    private GetSourceState(): AdjectiveOrNounInput
    {
        const w = this.input.word;
        return {
            gender: w.isMale ? Gender.Male : Gender.Female,
            numerus: this.IsSingular() ? Numerus.Singular : Numerus.Plural,
            vocalized: ParseVocalizedText(w.text)
        };
    }

    private HasPlural()
    {
        return this.plurals!.length > 0;
    }

    private HasTwoGenders()
    {
        return this.IsAdjective() && this.IsSingular() && this.input.word.isMale;
    }

    private IsAdjective()
    {
        return this.input.word.type === OpenArabDictWordType.Adjective;
    }

    private IsSingular() //TODO: migrate to some openarabdict logic
    {
        if(this.input.word.parent !== undefined)
        {
            if(this.input.word.parent.type === OpenArabDictWordParentType.NonVerbWord)
                return this.input.word.parent.relationType !== OpenArabDictNonVerbDerivationType.Plural;
        }
        return true;
    }

    private async LoadRelatedWords()
    {
        const derived = await this.input.derivedWordIds.Values().Map(x => this.cachedAPIService.QueryWord(x)).PromiseAll();

        this.definite = derived.find(x => (x.parent?.type === OpenArabDictWordParentType.NonVerbWord) && (x.parent.relationType === OpenArabDictNonVerbDerivationType.DefinitiveState)) ?? null;
        this.feminine = derived.find(x => (x.parent?.type === OpenArabDictWordParentType.NonVerbWord) && (x.parent.relationType === OpenArabDictNonVerbDerivationType.Feminine)) ?? null;
        this.plurals = derived.filter(x => (x.parent?.type === OpenArabDictWordParentType.NonVerbWord) && (x.parent.relationType === OpenArabDictNonVerbDerivationType.Plural));
    }

    private RenderCell(targetNumerus: Numerus, c: Case, targetGender: Gender, parsed: DisplayVocalized[], state: AdjectiveOrNounState)
    {
        const base = this.DeriveBase(targetGender, targetNumerus);

        const declined = this.conjugationService.DeclineAdjectiveOrNoun(DialectType.ModernStandardArabic, {
            gender: targetGender,
            numerus: targetNumerus,
            vocalized: base
        }, {
            state,
            case: c,
        });
        return RenderWithDiffHighlights(declined, parsed);
    }

    private RenderHeader(numerus: Numerus)
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

        if(this.HasTwoGenders())
        {
            return <>
                <tr>
                    <th>{headline()}</th>
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
            </>;
        }

        return <tr>
            <th>{headline()}</th>
            <th>Indefinite</th>
            <th>Definite</th>
            {this.input.word.type === OpenArabDictWordType.Noun ? <th>Construct</th> : null}
        </tr>;
    }
    
    private RenderNumerus(numerus: Numerus)
    {
        return <fragment>
            {this.RenderHeader(numerus)}

            <tr>
                <td>Informal</td>
                {this.RenderNumerusCase(numerus, Case.Informal)}
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
        return <fragment>
            {this.RenderNumerusCaseGender(numerus, c)}
        </fragment>;
    }

    private RenderNumerusCaseGender(numerus: Numerus, c: Case)
    {
        const inputWord = this.input.word.text;
        const parsed = ParseVocalizedText(inputWord);

        const gender = this.GetSourceState().gender;
        const hasSecondGender = this.HasTwoGenders();
        return <fragment>
            <td>{this.RenderCell(numerus, c, gender, parsed, AdjectiveOrNounState.Indefinite)}</td>
            <td>{this.RenderCell(numerus, c, gender, parsed, AdjectiveOrNounState.Definite)}</td>
            {(this.input.word.type === OpenArabDictWordType.Noun) ? <td>{this.RenderCell(numerus, c, gender, parsed, AdjectiveOrNounState.Construct)}</td> : null}
            {hasSecondGender ? <td>{this.RenderCell(numerus, c, Gender.Female, parsed, AdjectiveOrNounState.Indefinite)}</td> : null}
            {hasSecondGender ? <td>{this.RenderCell(numerus, c, Gender.Female, parsed, AdjectiveOrNounState.Definite)}</td> : null}
        </fragment>;
    }
    
    //Event handlers
    override OnInitiated(): void
    {
        this.LoadRelatedWords();
    }
}