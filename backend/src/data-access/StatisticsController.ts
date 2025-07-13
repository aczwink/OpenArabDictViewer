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

import { Injectable } from "acts-util-node";
import { DatabaseController } from "./DatabaseController";
import { VerbRoot } from "openarabicconjugation/src/VerbRoot";
import { Dictionary, ObjectExtensions } from "acts-util-core";
import { Conjugator } from "openarabicconjugation/src/Conjugator";
import { DisplayVocalized, VocalizedToString } from "openarabicconjugation/src/Vocalization";
import { AdvancedStemNumber, VerbType } from "openarabicconjugation/src/Definitions";
import { DialectsService } from "../services/DialectsService";
import { OpenArabDictVerbDerivationType, OpenArabDictWordParentType, OpenArabDictWordType } from "openarabdict-domain";
import { RootsIndexService } from "../services/RootsIndexService";
import { CreateVerb } from "openarabicconjugation/src/Verb";
import { MapVerbTypeToOpenArabicConjugation } from "../shared";
import { DialectType } from "openarabicconjugation/src/Dialects";

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
    constructor(private dbController: DatabaseController, private dialectsService: DialectsService,
        private rootsIndexService: RootsIndexService
    )
    {
    }

    public async QueryStatistics(): Promise<DictionaryStatistics>
    {
        const document = await this.dbController.GetDocumentDB();

        return {
            rootsCount: document.roots.length,
            wordsCount: document.words.length,
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

        const document = await this.dbController.GetDocumentDB();

        for (const word of document.words)
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
        for (const word of document.words)
        {
            if(word.type !== OpenArabDictWordType.Verb)
                continue;

            const types = new Set<VerbType>();
            for (const variant of word.form.variants)
            {
                const dialectType = this.dialectsService.MapDialectId(variant.dialectId)!;
                const root = this.rootsIndexService.GetRoot(word.rootId)!;
                const rootInstance = new VerbRoot(root.radicals);
                const verbType = MapVerbTypeToOpenArabicConjugation(word.form.verbType);

                const verb = CreateVerb(dialectType, rootInstance, variant.stemParameters ?? (word.form.stem as AdvancedStemNumber), verbType);
                types.add(verb.type);
            }

            for (const type of types)
                counts[type] = (counts[type] ?? 0) + 1;   
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
        for (const word of document.words)
        {
            if(word.type !== OpenArabDictWordType.Verb)
                continue;
            
            counts[word.form.stem] = (counts[word.form.stem] ?? 0) + 1;
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
        for (const word of document.words)
        {
            if(word.type !== OpenArabDictWordType.Verb)
                continue;
            if(word.form.stem !== 1)
                continue;

            const rootData = this.rootsIndexService.GetRoot(word.rootId);
            const root = new VerbRoot(rootData!.radicals);

            for (const variant of word.form.variants)
            {
                const params = variant.stemParameters!;

                const dialectType = this.dialectsService.MapDialectId(variant.dialectId)!;
                const verb = CreateVerb(dialectType, root, variant.stemParameters ?? (word.form.stem as AdvancedStemNumber), MapVerbTypeToOpenArabicConjugation(word.form.verbType));

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

        return ObjectExtensions.Values(dict).NotUndefined().ToArray();
    }

    private async QueryVerbalNounFrequencies()
    {
        function VocalizedArrayToString(vocalized: DisplayVocalized[]): string
        {
            return vocalized.Values().Map(VocalizedToString).Join("");
        }

        const document = await this.dbController.GetDocumentDB();

        const conjugator = new Conjugator();

        const dict: Dictionary<VerbalNounFrequencies> = {};
        for (const word of document.words)
        {
            if(word.type === OpenArabDictWordType.Verb)
                continue;
            if(word.parent?.type !== OpenArabDictWordParentType.Verb)
                continue;
            if(word.parent.derivation !== OpenArabDictVerbDerivationType.VerbalNoun)
                continue;

            const verbId = word.parent.verbId;
            const verb = document.words.find(x => x.id === verbId)!;
            if(verb.type !== OpenArabDictWordType.Verb)
                throw new Error("Should never happen");

            const rootData = this.rootsIndexService.GetRoot(verb.rootId);
            const root = new VerbRoot(rootData!.radicals);

            for (const variant of verb.form.variants)
            {
                const dialectType = this.dialectsService.MapDialectId(variant.dialectId)!;
                if(dialectType !== DialectType.ModernStandardArabic)
                    continue;
                
                const verbInstance = CreateVerb(dialectType, root, variant.stemParameters ?? (verb.form.stem as AdvancedStemNumber), MapVerbTypeToOpenArabicConjugation(verb.form.verbType));

                const generated = conjugator.GenerateAllPossibleVerbalNouns(root, (verbInstance.stem === 1) ? verbInstance : verbInstance.stem);
                const verbalNounPossibilities = generated.map(VocalizedArrayToString);

                const verbalNounIndex = verbalNounPossibilities.indexOf(word.text);
                const key = [verbInstance.type, verb.form.stem, variant.stemParameters ?? "", verbalNounIndex].join("_");
                const obj = dict[key];
                if(obj === undefined)
                {
                    dict[key] = {
                        count: 1,
                        scheme: verbInstance.type,
                        stem: verb.form.stem,
                        stemParameters: variant.stemParameters,
                        verbalNounIndex,
                    };
                }
                else
                    obj.count++;   
            }
        }

        return ObjectExtensions.Values(dict).NotUndefined().ToArray();
    }
}