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

            const root = this.rootsIndexService.GetRoot(word.rootId)!;
            const rootInstance = new VerbRoot(root.radicals);
            const scheme = rootInstance.DeriveDeducedVerbType();
            
            counts[scheme] = (counts[scheme] ?? 0) + 1;
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
            
            counts[word.stem] = (counts[word.stem] ?? 0) + 1;
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
            if(word.stem !== 1)
                continue;

            const rootData = this.rootsIndexService.GetRoot(word.rootId);
            const root = new VerbRoot(rootData!.radicals);
            const scheme = MapVerbTypeToOpenArabicConjugation(word.verbType) ?? root.DeriveDeducedVerbType();
            const params = word.stemParameters!;

            const key = [word.dialectId, scheme, params].join("_");
            const obj = dict[key];
            if(obj === undefined)
            {
                dict[key] = {
                    dialectId: word.dialectId,
                    count: 1,
                    scheme,
                    stemParameters: params
                };
            }
            else
                obj.count++;
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

            const dialectType = this.dialectsService.MapDialectId(verb.dialectId)!;
            const scheme = MapVerbTypeToOpenArabicConjugation(verb.verbType) ?? root.DeriveDeducedVerbType();
            const verbInstance = CreateVerb(dialectType, root, verb.stemParameters ?? (verb.stem as AdvancedStemNumber), scheme);

            const generated = conjugator.GenerateAllPossibleVerbalNouns(root, (verbInstance.stem === 1) ? verbInstance : verbInstance.stem);
            const verbalNounPossibilities = generated.map(VocalizedArrayToString);

            const verbalNounIndex = verbalNounPossibilities.indexOf(word.text);
            const key = [scheme, verb.stem, verb.stemParameters ?? "", verbalNounIndex].join("_");
            const obj = dict[key];
            if(obj === undefined)
            {
                dict[key] = {
                    count: 1,
                    scheme,
                    stem: verb.stem,
                    stemParameters: verb.stemParameters,
                    verbalNounIndex,
                };
            }
            else
                obj.count++;
        }

        return ObjectExtensions.Values(dict).NotUndefined().ToArray();
    }
}