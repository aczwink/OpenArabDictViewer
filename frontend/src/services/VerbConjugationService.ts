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
import { Gender, Person, Numerus, VerbType, Tense, Voice, AdvancedStemNumber, ConjugationParams } from "openarabicconjugation/src/Definitions";
import { VerbRoot } from "openarabicconjugation/src/VerbRoot";
import { ConjugationService } from "./ConjugationService";
import { DialectsService } from "./DialectsService";
import { OpenArabDictVerb } from "openarabdict-domain";
import { _TODO_CheckConjugation } from "./_ConjugationCheck";
import { RenderWithDiffHighlights } from "../shared/RenderWithDiffHighlights";
import { CreateVerb } from "openarabicconjugation/src/Verb";

interface VerbConjugationParams
{
    dialectId: number;
    soundOverride?: boolean;
    stem: number;
    stemParameters?: string;
}

@Injectable
export class VerbConjugationService
{
    constructor(private dialectsService: DialectsService, private conjugationService: ConjugationService)
    {
    }

    //Public methods
    public ConstructVerb(rootRadicals: string, verb: VerbConjugationParams)
    {
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
        const root = new VerbRoot(rootRadicals);
        const scheme = (verb.soundOverride === true) ? VerbType.Sound : root.DeriveDeducedVerbType();
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
            const choices = this.dialectsService.GetDialectMetaData(verb.dialectId).GetStem1ContextChoices(root);
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
}