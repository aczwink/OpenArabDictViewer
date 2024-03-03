/**
 * ArabDict
 * Copyright (C) 2023-2024 Amir Czwink (amir130@hotmail.de)
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

import { Stem1Context } from "./rule_sets/msa/_legacy/CreateVerb";
import { Hamzate } from "./Hamza";
import { VerbRoot } from "./VerbRoot";
import { Gender, Mood, Numerus, Person, Voice } from "./rule_sets/msa/_legacy/VerbStem";
import { ConjugationParams } from "./DialectConjugator";
import { MSAConjugator } from "./rule_sets/msa/MSAConjugator";
import { CompareVocalized, FullyVocalized, ParseVocalizedText, PartiallyVocalized } from "./Vocalization";
import { ALEF, ALEF_MAKSURA, DHAMMA, FATHA, KASRA, SUKUN, WAW, YA } from "./Definitions";
import { APCConjugator } from "./rule_sets/apc/APCConjugator";
import { LebaneseConjugator } from "./rule_sets/lebanese/LebaneseConjugator";

export enum DialectType
{
    ModernStandardArabic,
    NorthLevantineArabic,
    Lebanese
}

export interface VerbReverseConjugationResult
{
    root: VerbRoot;
    params: ConjugationParams;
    score: number;
}

export class Conjugator
{
    //Public methods
    public AnalyzeConjugation(dialect: DialectType, toAnalyze: PartiallyVocalized[])
    {
        const dialectConjugator = this.CreateDialectConjugator(dialect);
        const analysisResults = dialectConjugator.AnalyzeConjugation(toAnalyze);

        const numeruses: Numerus[] = ["singular", "dual", "plural"];
        const persons: Person[] = ["first", "second", "third"];
        const genders: Gender[] = ["male", "female"];
        const voices: Voice[] = ["active", "passive"];
        const stems = [2, 3, 4, 5, 6, 7, 8, 10];

        const matches: VerbReverseConjugationResult[] = [];
        for (const result of analysisResults)
        {
            const moods: Mood[] = (result.tense === "perfect") ? ["indicative"] : ["indicative", "subjunctive", "jussive"];
            for (const voice of voices)
            {
                for (const mood of moods)
                {
                    for (const numerus of numeruses)
                    {
                        for (const person of persons)
                        {
                            for (const gender of genders)
                            {
                                const context = this;
                                function CompareAndAdd(stem: number, stem1Context?: Stem1Context)
                                {
                                    const params: ConjugationParams = {
                                        gender,
                                        mood: mood,
                                        numerus,
                                        person,
                                        stem,
                                        tense: result.tense,
                                        voice,
                                        stem1Context,
                                    };
                                    const conjugated = context.Conjugate(result.root, params, dialect);

                                    const match = CompareVocalized(toAnalyze, ParseVocalizedText(conjugated));
                                    if(match > 0)
                                    {
                                        matches.push({
                                            root: result.root,
                                            params,
                                            score: match
                                        })
                                    }
                                }
                                
                                for (const t1 of [DHAMMA, FATHA, KASRA])
                                {
                                    for (const t2 of [DHAMMA, FATHA, KASRA])
                                    {
                                        const stem1ctx: Stem1Context = {
                                            middleRadicalTashkil: t1,
                                            middleRadicalTashkilPresent: t2,
                                            soundOverride: false
                                        };
                                        CompareAndAdd(1, stem1ctx);
                                    }
                                }

                                for (const stem of stems)
                                    CompareAndAdd(stem);
                            }
                        }
                    }
                }
            }
        }
        return matches;
    }

    public Conjugate(root: VerbRoot, params: ConjugationParams, dialect: DialectType)
    {
        if( (params.mood === "imperative") && (params.voice === "passive") )
            throw new Error("imperative and passive does not exist");
        if( (params.mood === "imperative") && (params.person !== "second") )
            return "";
        if( (params.stem === 1) && (params.stem1Context === undefined) )
            throw new Error("missing context for stem 1 conjugation");

        const dialectConjugator = this.CreateDialectConjugator(dialect);
        const pattern = dialectConjugator.Conjugate(root, params);
        this.CheckShaddaPattern(pattern);
        this.RemoveRedundantTashkil(pattern);
        return Hamzate(pattern);
    }

    public ConjugateParticiple(dialect: DialectType, root: VerbRoot, stem: number, voice: Voice, stem1Context?: Stem1Context): string
    {
        const dialectConjugator = this.CreateDialectConjugator(dialect);
        const pattern = dialectConjugator.ConjugateParticiple(root, stem, voice, stem1Context);

        return this.FormatPattern(pattern);
    }

    public GenerateAllPossibleVerbalNouns(dialect: DialectType, root: VerbRoot, stem: number): string[]
    {
        const dialectConjugator = this.CreateDialectConjugator(dialect);
        const patterns = dialectConjugator.GenerateAllPossibleVerbalNouns(root, stem);

        return patterns.map(x => {
            if(typeof x === "string")
                return x;
            return this.FormatPattern(x);
        });
    }

    //Private methods
    private CheckShaddaPattern(vocalized: PartiallyVocalized[])
    {
        for(let i = 0; i < vocalized.length - 1; i++)
        {
            const current = vocalized[i];
            const next = vocalized[i + 1];

            if((current.letter === next.letter) && (current.shadda === next.shadda) && (current.shadda === false) && (current.tashkil === SUKUN))
            {
                next.shadda = true;
                vocalized.Remove(i);
                i--;
            }
        }
    }

    private CreateDialectConjugator(dialect: DialectType)
    {
        switch(dialect)
        {
            case DialectType.ModernStandardArabic:
                return new MSAConjugator;
            case DialectType.NorthLevantineArabic:
                return new APCConjugator;
            case DialectType.Lebanese:
                return new LebaneseConjugator;
        }
    }

    private FormatPattern(pattern: (FullyVocalized | PartiallyVocalized)[]): string
    {
        this.RemoveRedundantTashkil(pattern as any[]);
        this.RemoveTrailingSukun(pattern as any);
        return Hamzate(pattern as any);
    }

    private RemoveRedundantTashkil(vocalized: PartiallyVocalized[])
    {
        for(let i = 1; i < vocalized.length; i++)
        {
            const p = vocalized[i - 1];
            const v = vocalized[i];

            if( (v.letter === ALEF) && (v.tashkil === FATHA) )
                v.tashkil = undefined;
            else if( (v.letter === WAW) && (v.tashkil === DHAMMA) )
                v.tashkil = undefined;
            else if( (v.letter === YA) && (v.tashkil === KASRA) && (p.tashkil === KASRA) )
                v.tashkil = undefined;
            else if( (v.letter === ALEF_MAKSURA) && (v.tashkil === FATHA) )
                v.tashkil = undefined;
        }
    }

    private RemoveTrailingSukun(pattern: PartiallyVocalized[])
    {
        const last = pattern[pattern.length - 1];
        if(last.tashkil === SUKUN)
            last.tashkil = undefined;
    }
}