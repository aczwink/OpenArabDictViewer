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

import { Injectable } from "acfrontend";
import { Gender, Person, Numerus, Tense, Voice, AdvancedStemNumber, ConjugationParams, VerbType } from "openarabicconjugation/src/Definitions";
import { VerbRoot } from "openarabicconjugation/src/VerbRoot";
import { ConjugationService } from "./ConjugationService";
import { DialectsService } from "./DialectsService";
import { OpenArabDictVerb, OpenArabDictVerbType } from "openarabdict-domain";
import { _TODO_CheckConjugation } from "./_ConjugationCheck";
import { RenderWithDiffHighlights } from "../shared/RenderWithDiffHighlights";
import { CreateVerb } from "openarabicconjugation/src/Verb";
import { GetDialectMetadata } from "openarabicconjugation/src/DialectsMetadata";
import { GlobalSettingsService } from "./GlobalSettingsService";

interface VerbConjugationParams
{
    dialectId: number;
    verbType?: OpenArabDictVerbType;
    stem: number;
    stemParameters?: string;
}

@Injectable
export class VerbConjugationService
{
    constructor(private dialectsService: DialectsService, private conjugationService: ConjugationService, private globalSettingsService: GlobalSettingsService)
    {
    }

    //Public methods
    public ConstructVerb(rootRadicals: string, verb: VerbConjugationParams)
    {
        verb = this.SelectForm(verb);

        const dialectType = this.dialectsService.MapIdToType(verb.dialectId);
        const root = new VerbRoot(rootRadicals);
        const type = this.GetType(rootRadicals, verb);
        return CreateVerb(dialectType, root, verb.stemParameters ?? (verb.stem as AdvancedStemNumber), type);
    }

    public CreateDefaultDisplayVersionOfVerb(rootRadicals: string, verb: VerbConjugationParams)
    {
        const result = this.ConjugateVerbContexts(rootRadicals, verb);
        const strings = result.map(x => this.conjugationService.VocalizedToString(x));

        return this.RenderContexts(strings);
    }

    public CreateDefaultDisplayVersionOfVerbWithDiff(rootRadicals: string, verb: VerbConjugationParams, reference: VerbConjugationParams)
    {
        const c1 = this.ConjugateVerbContexts(rootRadicals, verb);
        const c2 = this.ConjugateVerbContexts(rootRadicals, reference);
        const diffed = c1.map( (x, i) => RenderWithDiffHighlights(x, c2[i]));

        return this.RenderContexts(diffed);
    }

    public GetType(rootRadicals: string, verb: VerbConjugationParams)
    {
        const dialectType = this.dialectsService.MapIdToType(verb.dialectId);
        const root = new VerbRoot(rootRadicals);
        const scheme = this.MapVerbTypeToOpenArabicConjugation(verb.verbType) ?? GetDialectMetadata(dialectType).DeriveDeducedVerbTypeFromRootType(root);
        return scheme;
    }

    public RenderCheck(rootRadicals: string, verb: OpenArabDictVerb)
    {
        const check = _TODO_CheckConjugation(this.dialectsService.MapIdToType(verb.dialectId), new VerbRoot(rootRadicals), this.ConstructVerb(rootRadicals, verb));
        return check;
    }

    //Private methods
    private ConjugateVerbContexts(rootRadicals: string, verb: VerbConjugationParams)
    {
        const root = new VerbRoot(rootRadicals);
        const verbInstance = this.ConstructVerb(rootRadicals, verb);
        const past = this.conjugationService.Conjugate(verbInstance, {
            gender: Gender.Male,
            tense: Tense.Perfect,
            numerus: Numerus.Singular,
            person: Person.Third,
            voice: Voice.Active
        });

        let requiredContext: ConjugationParams[] = [];
        if(verb.stem === 1)
        {
            const choices = this.dialectsService.GetDialectMetaData(verb.dialectId).GetStem1ContextChoices(verbInstance.type, root);
            requiredContext = choices.requiredContext;
        }

        const result = [past];
        for (const context of requiredContext)
        {
            const conjugated = this.conjugationService.Conjugate(verbInstance, context);
            result.push(conjugated);
        }

        return result;
    }

    private MapVerbTypeToOpenArabicConjugation(verbType?: OpenArabDictVerbType): VerbType | undefined
    {
        switch(verbType)
        {
            case OpenArabDictVerbType.Defective:
                return VerbType.Defective;
            case OpenArabDictVerbType.Sound:
                return VerbType.Sound;
        }
        return undefined;
    }

    private RenderContexts(contexts: any[])
    {
        switch(contexts.length)
        {
            case 1:
                return contexts[0];
            case 2:
                return [
                    contexts[0],
                    " - ",
                    contexts[1]
                ];
            case 3:
                return [
                    contexts[0],
                    " - ",
                    contexts[1],
                    " (",
                    contexts[2],
                    ")"
                ];
            default:
                throw new Error("This should never happen!");
        }
    }

    private SelectForm(verb: VerbConjugationParams): VerbConjugationParams
    {
        const targetDialect = this.dialectsService.FindDialect(this.globalSettingsService.dialectType)!;
        if(targetDialect.id === verb.dialectId)
            return verb;
        if((verb.stemParameters === undefined) && (verb.verbType === undefined))
        {
            return {
                dialectId: targetDialect.id,
                stem: verb.stem,
            };
        }

        return verb;
    }
}