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
import { Conjugator } from "openarabicconjugation/src/Conjugator";
import { VerbRoot } from "openarabicconjugation/src/VerbRoot";
import { DisplayVocalized, VocalizedToString } from "openarabicconjugation/src/Vocalization";
import { ConjugationParams, Person, Tense, Voice, Gender, Numerus, Mood, AdjectiveDeclensionParams, NounDeclensionParams, AdvancedStemNumber } from "openarabicconjugation/src/Definitions";
import { NounInput, TargetNounDerivation } from "openarabicconjugation/src/DialectConjugator";
import { DialectType } from "openarabicconjugation/src/Dialects";
import { CreateVerb, Verb } from "openarabicconjugation/src/Verb";

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

    public ConjugateArgs(dialect: DialectType, rootRadicals: string, stem: number, tense: Tense, voice: Voice, gender: Gender, person: Person, numerus: Numerus, mood: Mood, stem1Context?: string)
    {
        const root = new VerbRoot(rootRadicals);
        const verb = CreateVerb(dialect, root, stem1Context ?? (stem as AdvancedStemNumber));

        return this.conjugator.Conjugate(verb, {
            tense,
            voice,
            gender,
            person,
            numerus,
            mood,
        });
    }

    public ConjugateToStringArgs(dialect: DialectType, rootRadicals: string, stem: number, tense: Tense, voice: Voice, gender: Gender, person: Person, numerus: Numerus, mood: Mood, stem1Context?: string)
    {
        const vocalized = this.ConjugateArgs(dialect, rootRadicals, stem, tense, voice, gender, person, numerus, mood, stem1Context);
        return this.VocalizedToString(vocalized);
    }

    public ConjugateParticiple(verb: Verb<string>, voice: Voice)
    {
        return this.conjugator.ConjugateParticiple(verb, voice);
    }

    public DeclineAdjective(dialect: DialectType, word: string, params: AdjectiveDeclensionParams)
    {
        const declined = this.conjugator.DeclineAdjective(word, params, dialect);
        return this.VocalizedToString(declined);
    }

    public DeclineNoun(dialect: DialectType, inputNoun: NounInput, params: NounDeclensionParams)
    {
        return this.conjugator.DeclineNoun(inputNoun, params, dialect);
    }

    public DeriveSoundNoun(dialect: DialectType, singular: DisplayVocalized[], singularGender: Gender, target: TargetNounDerivation): DisplayVocalized[]
    {
        return this.conjugator.DeriveSoundNoun(singular, singularGender, target, dialect);
    }

    public GenerateAllPossibleVerbalNouns(rootRadicals: string, stem: AdvancedStemNumber | string)
    {
        const root = new VerbRoot(rootRadicals);
        const nouns = this.conjugator.GenerateAllPossibleVerbalNouns(root, this.CreateLegacyStem(rootRadicals, stem));
        return nouns.map(this.VocalizedToString.bind(this));
    }

    public HasPotentiallyMultipleVerbalNounForms(rootRadicals: string, stem: AdvancedStemNumber | string)
    {
        const root = new VerbRoot(rootRadicals);
        return this.conjugator.HasPotentiallyMultipleVerbalNounForms(root, this.CreateLegacyStem(rootRadicals, stem));
    }

    public VocalizedToString(vocalized: DisplayVocalized[]): string
    {
        return vocalized.Values().Map(VocalizedToString).Join("");
    }

    //Private methods
    private CreateLegacyStem(rootRadicals: string, stem: AdvancedStemNumber | string)
    {
        const root = new VerbRoot(rootRadicals);
        const verb = CreateVerb(DialectType.ModernStandardArabic, root, stem);
        if(verb.stem === 1)
            return verb;
        return verb.stem;
    }

    //State
    private conjugator: Conjugator;
}