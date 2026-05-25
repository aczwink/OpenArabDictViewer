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

import { Injectable } from "@aczwink/acts-util-node";
import { DatabaseController } from "./DatabaseController";
import { Dictionary, ObjectExtensions } from "@aczwink/acts-util-core";
import { Conjugator, TargetVerbBasedDerivationPatterns } from "@aczwink/openarabicconjugation/dist/Conjugator";
import { DisplayVocalized, VocalizedToString } from "@aczwink/openarabicconjugation/dist/Vocalization";
import { VerbType } from "@aczwink/openarabicconjugation/dist/Definitions";
import { DialectsService } from "../services/DialectsService";
import { OpenArabDictParentType, OpenArabDictPOSType } from "@aczwink/openarabdict-domain";
import { RootsIndexService } from "../services/RootsIndexService";
import { DialectType } from "@aczwink/openarabicconjugation/dist/Dialects";
import { CreateVerbFromOADVerb, FindHighestConjugatableDialectOf } from "@aczwink/openarabdict-openarabicconjugation-bridge";
import { Verb } from "@aczwink/openarabicconjugation/dist/Verb";
import { LexemesIndexService } from "../services/LexemesIndexService";
import { TranslationIndexService } from "../services/TranslationIndexService";

interface DialectStatistics
{
    dialectId: number;
    wordsCount: number;
}

interface VerbTypeStatistics
{
    scheme: VerbType;
    count: number;
}

interface VerbalNounFrequencies
{
    count: number;
    scheme: VerbType;
    stem: number;
    stemParameters?: string;
    verbalNounIndex: number;
}

interface VerbStemStatistics
{
    stem: number;
    count: number;
}

interface VerbStem1Frequencies
{
    dialectId: number;
    scheme: VerbType;
    stemParameters: string;
    count: number;
}

interface DictionaryStatistics
{
    rootsCount: number;
    wordsCount: number;

    dialectCounts: DialectStatistics[];
    verbTypeCounts: VerbTypeStatistics[];
    stemCounts: VerbStemStatistics[];
    stem1Freq: VerbStem1Frequencies[];
    verbalNounFreq: VerbalNounFrequencies[];
}

@Injectable
export class StatisticsController
{
    constructor(private dbController: DatabaseController, private dialectsService: DialectsService, private rootsIndexService: RootsIndexService, private wordsIndexService: LexemesIndexService,
        private translationIndexService: TranslationIndexService)
    {
    }

    public async QueryStatistics(): Promise<DictionaryStatistics>
    {
        const document = await this.dbController.GetDocumentDB();

        return {
            rootsCount: document.roots.length,
            wordsCount: document.lexemes.length,
            dialectCounts: await this.QueryDialectCounts(),
            verbTypeCounts: await this.QueryVerbTypeCounts(),
            stemCounts: await this.QueryStemCounts(),
            stem1Freq: await this.QueryStem1Frequencies(),
            verbalNounFreq: await this.QueryVerbalNounFrequencies()
        };
    }

    //Private methods
    private async QueryDialectCounts()
    {
        const dialectCounts: DialectStatistics[] = [];

        const document = await this.dbController.GetTranslationsDocumentDB("en");

        for (const word of document.entries)
        {
            for (const t of word.translations)
            {
                const entry = dialectCounts.find(x => x.dialectId === t.dialectId);
                if(entry === undefined)
                    dialectCounts.push({ dialectId: t.dialectId, wordsCount: 1 });
                else
                    entry.wordsCount++;
            }
        }

        return dialectCounts;
    }

    private async QueryVerbTypeCounts()
    {
        const document = await this.dbController.GetDocumentDB();

        const counts: Dictionary<number> = {};
        for (const word of document.lexemes)
        {
            for (const sense of word.senses)
            {
                for (const unit of sense.units)
                {
                    if(unit.pos.type !== OpenArabDictPOSType.Verb)
                        continue;

                    const root = this.rootsIndexService.GetRoot(unit.pos.rootId)!;

                    const types = new Set<VerbType>();

                    if(unit.pos.form.variants === undefined)
                    {
                        const verb = CreateVerbFromOADVerb(FindHighestConjugatableDialectOf(root.radicals, unit.pos.form, this.translationIndexService.GetTranslationsOf(word.id, "en")), root, unit.pos);
                        types.add(verb.type);
                    }
                    else
                    {
                        for (const variant of unit.pos.form.variants)
                        {
                            const dialectType = this.dialectsService.MapDialectId(variant.dialectId)!;

                            const verb = CreateVerbFromOADVerb(dialectType, root, unit.pos);
                            types.add(verb.type);
                        }
                    }

                    for (const type of types)
                        counts[type] = (counts[type] ?? 0) + 1;
                }
            }
        }

        return ObjectExtensions.Entries(counts).Map<VerbTypeStatistics>(kv => ({
            count: kv.value!,
            scheme: parseInt(kv.key as any) as VerbType
        })).ToArray();
    }

    private async QueryStemCounts()
    {
        const document = await this.dbController.GetDocumentDB();

        const counts: Dictionary<number> = {};
        for (const word of document.lexemes)
        {
            for (const sense of word.senses)
            {
                for (const unit of sense.units)
                {
                    if(unit.pos.type !== OpenArabDictPOSType.Verb)
                        continue;

                    counts[unit.pos.form.stem] = (counts[unit.pos.form.stem] ?? 0) + 1;
                }
            }
        }
        return ObjectExtensions.Entries(counts).Map<VerbStemStatistics>(kv => ({
            count: kv.value!,
            stem: parseInt(kv.key as any)
        })).ToArray();
    }

    private async QueryStem1Frequencies()
    {
        const document = await this.dbController.GetDocumentDB();

        const dict: Dictionary<VerbStem1Frequencies> = {};
        for (const word of document.lexemes)
        {
            for (const sense of word.senses)
            {
                for (const unit of sense.units)
                {
                    if(unit.pos.type !== OpenArabDictPOSType.Verb)
                        continue;

                    if(unit.pos.form.stem !== 1)
                        continue;

                    const root = this.rootsIndexService.GetRoot(unit.pos.rootId)!;

                    for (const variant of unit.pos.form.variants!)
                    {
                        const params = variant.stemParameters!;

                        const dialectType = this.dialectsService.MapDialectId(variant.dialectId)!;
                        const verb = CreateVerbFromOADVerb(dialectType, root, unit.pos);

                        const key = [variant.dialectId, verb.type, params].join("_");
                        const obj = dict[key];
                        if(obj === undefined)
                        {
                            dict[key] = {
                                dialectId: variant.dialectId,
                                count: 1,
                                scheme: verb.type,
                                stemParameters: params
                            };
                        }
                        else
                            obj.count++;
                    }
                }
            }
        }

        return ObjectExtensions.Values(dict).NotUndefined().ToArray();
    }

    private async QueryVerbalNounFrequencies()
    {
        function ProcessVerbInstance(wordText: string, verbInstance: Verb<string>)
        {            
            const generated = conjugator.DeriveFromVerb(verbInstance, TargetVerbBasedDerivationPatterns.VerbalNouns);
            const verbalNounPossibilities = generated.map(VocalizedArrayToString);

            const verbalNounIndex = verbalNounPossibilities.indexOf(wordText);
            const key = [verbInstance.type, verbInstance.stem, (verbInstance.stem === 1) ? verbInstance.stemParameterization : "", verbalNounIndex].join("_");
            const obj = dict[key];
            if(obj === undefined)
            {
                dict[key] = {
                    count: 1,
                    scheme: verbInstance.type,
                    stem: verbInstance.stem,
                    stemParameters: (verbInstance.stem === 1) ? verbInstance.stemParameterization : undefined,
                    verbalNounIndex,
                };
            }
            else
                obj.count++;
        }

        function VocalizedArrayToString(vocalized: DisplayVocalized[]): string
        {
            return vocalized.Values().Map(VocalizedToString).Join("");
        }

        const document = await this.dbController.GetDocumentDB();

        const conjugator = new Conjugator();

        const dict: Dictionary<VerbalNounFrequencies> = {};
        for (const word of document.lexemes)
        {
            for (const parent of word.parent)
            {
                if(parent.type !== OpenArabDictParentType.VerbalNoun)
                    continue;

                const lexicalUnitId = parent.id;
                const verb = this.wordsIndexService.GetLexemeFromLexicalUnitId(lexicalUnitId)!;
                const vUnit = verb.senses[0].units[0].pos;
                if(vUnit.type !== OpenArabDictPOSType.Verb)
                    throw new Error("Should never happen");

                const rootData = this.rootsIndexService.GetRoot(vUnit.rootId)!;

                if(vUnit.form.variants === undefined)
                {
                    const verbInstance = CreateVerbFromOADVerb(DialectType.ModernStandardArabic, rootData, vUnit);
                    ProcessVerbInstance(word.text, verbInstance);
                }
                else
                {
                    for (const variant of vUnit.form.variants)
                    {
                        const dialectType = this.dialectsService.MapDialectId(variant.dialectId)!;
                        if(dialectType !== DialectType.ModernStandardArabic)
                            continue;

                        const verbInstance = CreateVerbFromOADVerb(dialectType, rootData, vUnit);
                        ProcessVerbInstance(word.text, verbInstance);
                    }
                }
            }
        }

        return ObjectExtensions.Values(dict).NotUndefined().ToArray();
    }
}