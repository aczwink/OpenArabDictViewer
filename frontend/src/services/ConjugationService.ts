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
import { Conjugator } from "openarabicconjugation/dist/Conjugator";
import { VerbRoot } from "openarabicconjugation/dist/VerbRoot";
import { DisplayVocalized, VocalizedToString } from "openarabicconjugation/src/Vocalization";
import { ConjugationParams, Person, Tense, Voice, Gender, Numerus, Mood, AdvancedStemNumber, VerbType } from "openarabicconjugation/src/Definitions";
import { DialectType } from "openarabicconjugation/src/Dialects";
import { CreateVerb, Verb } from "openarabicconjugation/dist/Verb";
import { AdjectiveOrNounInput, TargetAdjectiveNounDerivation } from "openarabicconjugation/dist/DialectConjugator";
import { AdjectiveOrNounDeclensionParams } from "openarabicconjugation/dist/Definitions";

@Injectable
export class ConjugationService
{
    constructor()
    {
        this.conjugator = new Conjugator;
    }

    //Public methods
    public Conjugate(verb: Verb<string>, params: ConjugationParams)
    {
        const vocalized = this.conjugator.Conjugate(verb, params);
        return vocalized;
    }

    public ConjugateArgs(dialect: DialectType, rootRadicals: string, stem: number, tense: Tense, voice: Voice, gender: Gender, person: Person, numerus: Numerus, mood: Mood, verbType: VerbType, stem1Context?: string)
    {
        const root = new VerbRoot(rootRadicals);
        const verb = CreateVerb(dialect, root, stem1Context ?? (stem as AdvancedStemNumber), verbType);

        return this.conjugator.Conjugate(verb, {
            tense,
            voice,
            gender,
            person,
            numerus,
            mood,
        });
    }

    public ConjugateActiveParticiple(verb: Verb<string>, isStative: boolean)
    {
        if(isStative)
            return this.conjugator.DeclineStativeActiveParticiple(verb);
        return this.conjugator.ConjugateParticiple(verb, Voice.Active);
    }

    public ConjugatePassiveParticiple(verb: Verb<string>)
    {
        return this.conjugator.ConjugateParticiple(verb, Voice.Passive);
    }

    public DeclineAdjectiveOrNoun(dialect: DialectType, input: AdjectiveOrNounInput, params: AdjectiveOrNounDeclensionParams)
    {
        return this.conjugator.DeclineAdjectiveOrNoun(input, params, dialect);
    }

    public DeriveSoundAdjectiveOrNoun(dialect: DialectType, singular: DisplayVocalized[], singularGender: Gender, target: TargetAdjectiveNounDerivation): DisplayVocalized[]
    {
        return this.conjugator.DeriveSoundAdjectiveOrNoun(singular, singularGender, target, dialect);
    }

    public GenerateAllPossibleVerbalNouns(verb: Verb<string>)
    {
        const nouns = this.conjugator.GenerateAllPossibleVerbalNouns(verb);
        return nouns.map(this.VocalizedToString.bind(this));
    }

    public HasPotentiallyMultipleVerbalNounForms(verb: Verb<string>)
    {
        return this.conjugator.HasPotentiallyMultipleVerbalNounForms(verb);
    }

    public VocalizedToString(vocalized: DisplayVocalized[]): string
    {
        return vocalized.Values().Map(VocalizedToString).Join("");
    }

    //State
    private conjugator: Conjugator;
}