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

import { Anchor, Component, Injectable, JSX_CreateElement, JSX_Fragment, ProgressSpinner } from "@aczwink/acfrontend";
import { WordGenderToAbbreviation, WordMayHaveGender, WordTypeToAbbreviationText } from "../shared/words";
import { OpenArabDictRoot, OpenArabDictVerbDerivationType, OpenArabDictWord, OpenArabDictWordParentType, OpenArabDictWordType } from "@aczwink/openarabdict-domain";
import { CachedAPIService } from "../services/CachedAPIService";
import { DialectsService } from "../services/DialectsService";
import { VerbConjugationService } from "../services/VerbConjugationService";
import { ModernStandardArabicStem1ParametersType } from "@aczwink/openarabicconjugation/dist/dialects/msa/conjugation/r2tashkil";
import { VerbType } from "@aczwink/openarabicconjugation/dist/Definitions";
import { GlobalSettingsService } from "../services/GlobalSettingsService";
import { Verb } from "@aczwink/openarabicconjugation/dist/Verb";
import { DialectType } from "@aczwink/openarabicconjugation";

@Injectable
export class WordReferenceComponent extends Component<{ word: OpenArabDictWord; }>
{
    constructor(private dialectsService: DialectsService, private verbConjugationService: VerbConjugationService, private cachedAPIService: CachedAPIService, private globalSettingsService: GlobalSettingsService
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
    private GetComparisonStemParameters(verb: Verb<string>)
    {
        switch(verb.dialect)
        {
            case DialectType.ModernStandardArabic:
                switch(verb.type)
                {
                    case VerbType.AssimilatedAndDefective:
                    case VerbType.Defective:
                    case VerbType.Irregular:
                        return ModernStandardArabicStem1ParametersType.DefectiveType1;
                    case VerbType.Sound:
                        if(verb.stem === 1)
                        {
                            switch(verb.stemParameterization)
                            {
                                case ModernStandardArabicStem1ParametersType.PastA_PresentI:
                                case ModernStandardArabicStem1ParametersType.PastI_PresentA:
                                    return ModernStandardArabicStem1ParametersType.PastU_PresentU;
                            }
                        }
                        break;
                }
        }
        return ModernStandardArabicStem1ParametersType.PastI_PresentI;
    }

    private RenderDialectHint(dialectType: DialectType)
    {
        if(dialectType !== this.globalSettingsService.dialectType)
        {
            return <span className="badge rounded-pill text-bg-danger">!</span>;
        }
        return null;
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
            const dialectType = this.verbConjugationService.SelectDialect(this.root.radicals, word.form);
            if(dialectType === null)
                return word.text;

            const verb = this.verbConjugationService.ConstructVerb(dialectType, this.root.radicals, word.form);
            const dialect = this.dialectsService.FindDialect(verb.dialect)!;

            const verbPresentation = this.verbConjugationService.CreateDefaultDisplayVersionOfVerbWithDiff(dialectType, this.root.radicals, word.form, { ...word, stem: 1, variants: [{ stemParameters: this.GetComparisonStemParameters(verb), dialectId: dialect.id }] });

            return <>
                {this.verbConjugationService.RenderCheck(dialectType, this.root.radicals, word)}
                {this.dialectsService.FindDialect(verb.dialect)?.emojiCodes}
                {this.RenderDialectHint(dialectType)}
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