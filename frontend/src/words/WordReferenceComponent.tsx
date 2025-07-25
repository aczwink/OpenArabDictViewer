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

import { Anchor, Component, Injectable, JSX_CreateElement, JSX_Fragment, ProgressSpinner } from "acfrontend";
import { WordGenderToAbbreviation, WordMayHaveGender, WordTypeToAbbreviationText } from "../shared/words";
import { OpenArabDictRoot, OpenArabDictVerbDerivationType, OpenArabDictWord, OpenArabDictWordParentType, OpenArabDictWordType } from "openarabdict-domain";
import { CachedAPIService } from "../services/CachedAPIService";
import { DialectsService } from "../services/DialectsService";
import { StemNumberComponent } from "../shared/RomanNumberComponent";
import { VerbConjugationService } from "../services/VerbConjugationService";
import { ModernStandardArabicStem1ParametersType } from "openarabicconjugation/src/dialects/msa/conjugation/r2tashkil";
import { VerbType } from "openarabicconjugation/src/Definitions";
import { DialectType } from "openarabicconjugation/src/Dialects";

@Injectable
export class WordReferenceComponent extends Component<{ word: OpenArabDictWord; }>
{
    constructor(private dialectsService: DialectsService, private verbConjugationService: VerbConjugationService, private cachedAPIService: CachedAPIService,
    )
    {
        super();

        this.root = null;
    }

    protected Render(): RenderValue
    {
        return <fragment>
            <Anchor route={"/words/" + this.input.word.id}>{this.RenderText()}</Anchor>
            {" "}
            {this.TypeToString()}
            {this.RenderGender()}
        </fragment>;
    }

    //Private methods
    private GetComparisonStemParameters(dialect: DialectType, verbType: VerbType)
    {
        switch(dialect)
        {
            case DialectType.ModernStandardArabic:
                switch(verbType)
                {
                    case VerbType.Defective:
                    case VerbType.Irregular:
                        return ModernStandardArabicStem1ParametersType.DefectiveType1;
                }
        }
        return ModernStandardArabicStem1ParametersType.PastI_PresentI;
    }

    private RenderGender()
    {
        if(!WordMayHaveGender(this.input.word))
            return "";
        
        return <i>{WordGenderToAbbreviation(this.input.word.isMale)}</i>;
    }

    private RenderText()
    {
        const word = this.input.word;
        if((word.type === OpenArabDictWordType.Verb) && (this.root !== null))
        {
            const verb = this.verbConjugationService.ConstructVerb(this.root.radicals, word.form);

            const verbPresentation = this.verbConjugationService.CreateDefaultDisplayVersionOfVerbWithDiff(this.root.radicals, word.form, { ...word, stem: 1, variants: [{ stemParameters: this.GetComparisonStemParameters(verb.dialect, verb.type), dialectId: word.form.variants[0].dialectId }] });

            return <>
                {this.verbConjugationService.RenderCheck(this.root.radicals, word)}
                {this.dialectsService.FindDialect(verb.dialect)?.emojiCodes}
                <StemNumberComponent verbType={verb.type} stem={word.form.stem} />:
                {verbPresentation}
            </>;
        }
        return word.text;
    }

    private TypeToString()
    {
        const word = this.input.word;
        if( (word.parent !== undefined) && (word.parent.type === OpenArabDictWordParentType.Verb) )
        {
            switch(word.parent.derivation)
            {
                case OpenArabDictVerbDerivationType.ActiveParticiple:
                    return "(active participle)";
                case OpenArabDictVerbDerivationType.PassiveParticiple:
                    return "(passive participle)";
                case OpenArabDictVerbDerivationType.VerbalNoun:
                    return "(verbal noun)";
            }
        }
        return WordTypeToAbbreviationText(word.type);
    }

    //Event handlers
    override async OnInitiated(): Promise<void>
    {
        if(this.input.word.type === OpenArabDictWordType.Verb)
            this.root = await this.cachedAPIService.QueryRootData(this.input.word.rootId);
    }

    //State
    private root: OpenArabDictRoot | null;
}

@Injectable
export class WordIdReferenceComponent extends Component<{ wordId: string }>
{
    constructor(private cachedAPIService: CachedAPIService)
    {
        super();

        this.word = null;
    }
    
    protected Render(): RenderValue
    {
        if(this.word === null)
            return <ProgressSpinner />;

        return <WordReferenceComponent word={this.word} />;
    }

    //Private state
    private word: OpenArabDictWord | null;

    //Event handlers
    override async OnInitiated(): Promise<void>
    {
        const word = await this.cachedAPIService.QueryWord(this.input.wordId);
        this.word = word;
    }
}