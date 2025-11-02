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
import { Gender, Person, Numerus, Tense, Voice, ConjugationParams } from "openarabicconjugation/dist/Definitions";
import { VerbRoot } from "openarabicconjugation/dist/VerbRoot";
import { ConjugationService } from "./ConjugationService";
import { OpenArabDictVerb, OpenArabDictVerbForm } from "openarabdict-domain";
import { _TODO_CheckConjugation } from "./_ConjugationCheck";
import { RenderWithDiffHighlights } from "../shared/RenderWithDiffHighlights";
import { VerbConjugationDialectResolver } from "./VerbConjugationDialectResolver";
import { CreateVerbFromOADVerbForm } from "openarabdict-openarabicconjugation-bridge";
import { DialectType } from "openarabicconjugation/dist/Dialects";
import { GetDialectMetadata } from "openarabicconjugation/dist/DialectsMetadata";

@Injectable
export class VerbConjugationService
{
    constructor(private conjugationService: ConjugationService, private verbConjugationDialectResolver: VerbConjugationDialectResolver)
    {
    }

    //Public methods
    public ConstructVerb(dialectType: DialectType, rootRadicals: string, verbForm: OpenArabDictVerbForm)
    {
        return CreateVerbFromOADVerbForm(dialectType, rootRadicals, verbForm);
    }

    public CreateDefaultDisplayVersionOfVerb(dialectType: DialectType, rootRadicals: string, verbForm: OpenArabDictVerbForm)
    {
        const result = this.ConjugateVerbContexts(dialectType, rootRadicals, verbForm);
        const strings = result.map(x => this.conjugationService.VocalizedToString(x));

        return this.RenderContexts(strings);
    }

    public CreateDefaultDisplayVersionOfVerbWithDiff(dialectType: DialectType, rootRadicals: string, verb: OpenArabDictVerbForm, reference: OpenArabDictVerbForm)
    {
        const c1 = this.ConjugateVerbContexts(dialectType, rootRadicals, verb);
        const c2 = this.ConjugateVerbContexts(dialectType, rootRadicals, reference);
        const diffed = c1.map( (x, i) => RenderWithDiffHighlights(x, c2[i]));

        return this.RenderContexts(diffed);
    }

    public RenderCheck(dialectType: DialectType, rootRadicals: string, verb: OpenArabDictVerb)
    {
        const check = _TODO_CheckConjugation(dialectType, new VerbRoot(rootRadicals), this.ConstructVerb(dialectType, rootRadicals, verb.form));
        return check;
    }

    public SelectDialect(rootRadicals: string, verbForm: OpenArabDictVerbForm)
    {
        return this.verbConjugationDialectResolver.SelectDialect(rootRadicals, verbForm);
    }

    //Private methods
    private ConjugateVerbContexts(dialectType: DialectType, rootRadicals: string, verbForm: OpenArabDictVerbForm)
    {
        const root = new VerbRoot(rootRadicals);
        const verbInstance = this.ConstructVerb(dialectType, rootRadicals, verbForm);
        const past = this.conjugationService.Conjugate(verbInstance, {
            gender: Gender.Male,
            tense: Tense.Perfect,
            numerus: Numerus.Singular,
            person: Person.Third,
            voice: Voice.Active
        });

        let requiredContext: ConjugationParams[] = [];
        if(verbForm.stem === 1)
        {
            const choices = GetDialectMetadata(dialectType).GetStem1ContextChoices(verbInstance.type, root);
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