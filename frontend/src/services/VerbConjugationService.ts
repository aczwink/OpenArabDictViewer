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
import { Gender, Person, Numerus, Mood, VerbType, Tense, Voice, StemlessConjugationParams } from "openarabicconjugation/src/Definitions";
import { VerbRoot } from "openarabicconjugation/src/VerbRoot";
import { Stem1DataToStem1ContextOptional } from "../verbs/model";
import { ConjugationService } from "./ConjugationService";
import { DialectsService } from "./DialectsService";
import { OpenArabDictVerb } from "openarabdict-domain";
import { _TODO_CheckConjugation } from "../verbs/_ConjugationCheck";
import { RenderWithDiffHighlights } from "../shared/RenderWithDiffHighlights";
import { DisplayVocalized } from "openarabicconjugation/src/Vocalization";

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
    public GetType(rootRadicals: string, verb: VerbConjugationParams)
    {
        const root = new VerbRoot(rootRadicals);
        const scheme = (verb.soundOverride === true) ? VerbType.Sound : root.DeriveDeducedVerbType();
        return scheme;
    }

    public BuildStem1Context(rootRadicals: string, verb: VerbConjugationParams)
    {
        const dialectType = this.dialectsService.MapIdToType(verb.dialectId);

        const stem1ctx = Stem1DataToStem1ContextOptional(dialectType, this.GetType(rootRadicals, verb), verb.stemParameters);
        return stem1ctx;
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

    public RenderCheck(rootRadicals: string, verb: OpenArabDictVerb)
    {
        const stem1Context = this.BuildStem1Context(rootRadicals, verb);
        const check = _TODO_CheckConjugation(this.dialectsService.MapIdToType(verb.dialectId), new VerbRoot(rootRadicals), {
            gender: Gender.Male,
            voice: Voice.Active,
            tense: Tense.Perfect,
            numerus: Numerus.Singular,
            person: Person.Third,
            stem: verb.stem as any,
            stem1Context
        });
        return check;
    }

    //Private methods
    private ConjugateVerbContexts(rootRadicals: string, verb: VerbConjugationParams)
    {
        const dialectType = this.dialectsService.MapIdToType(verb.dialectId);
        const stem1Context = this.BuildStem1Context(rootRadicals, verb);

        const root = new VerbRoot(rootRadicals);
        const past = this.conjugationService.Conjugate(dialectType, root, {
            gender: Gender.Male,
            tense: Tense.Perfect,
            numerus: Numerus.Singular,
            person: Person.Third,
            stem: verb.stem as any,
            stem1Context,
            voice: Voice.Active
        });

        let requiredContext: StemlessConjugationParams[] = [];
        if(verb.stem === 1)
        {
            const choices = this.dialectsService.GetDialectMetaData(verb.dialectId).GetStem1ContextChoices(root);
            requiredContext = choices.requiredContext;
        }

        const result = [past];
        for (const context of requiredContext)
        {
            const conjugated = this.conjugationService.Conjugate(dialectType, root, {
                ...context,
                stem: verb.stem as any,
                stem1Context,
            });
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