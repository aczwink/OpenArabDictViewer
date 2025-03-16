/**
 * OpenArabDictViewer
 * Copyright (C) 2025 Amir Czwink (amir130@hotmail.de)
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
import { DatabaseController } from "../data-access/DatabaseController";
import { OpenArabDictVerb, OpenArabDictWord, OpenArabDictWordType } from "openarabdict-domain";
import { Conjugator } from "openarabicconjugation/src/Conjugator";
import { RootsIndexService } from "./RootsIndexService";
import { VerbRoot } from "openarabicconjugation/src/VerbRoot";
import { AdvancedStemNumber, Gender, Mood, Numerus, Person, Tense, VerbType, Voice } from "openarabicconjugation/src/Definitions";
import { DialectsService } from "./DialectsService";
import { CompareVocalized, DisplayVocalized, MapLetterToComparisonEquivalenceClass, ParseVocalizedText, VocalizedWordTostring } from "openarabicconjugation/src/Vocalization";
import { PrefixTree } from "../indexes/PrefixTree";
import { Of } from "acts-util-core";
import { CreateVerb } from "openarabicconjugation/src/Verb";

interface IndexEntry
{
    conjugated?: string;
    vocalized: DisplayVocalized[];
    word: OpenArabDictWord;
}

export interface SearchResultEntry
{
    conjugated?: string;
    score: number;
    word: OpenArabDictWord;
}

@Injectable
export class ArabicTextIndexService
{
    constructor(private databaseController: DatabaseController, private rootsIndexService: RootsIndexService, private dialectsService: DialectsService)
    {
        this.trie = new PrefixTree;
    }

    //Public methods
    public Find(textFilter: string)
    {
        const parsed = ParseVocalizedText(textFilter);
        const key = this.MapToKey(parsed);

        const indexEntries = this.trie.Find(key);
        return indexEntries.Map(x => Of<SearchResultEntry>({
            conjugated: x.conjugated,
            score: CompareVocalized(parsed, x.vocalized.slice(0, key.length)),
            word: x.word
        }));
    }

    public async RebuildIndex()
    {
        const trie = new PrefixTree<IndexEntry>;

        const document = await this.databaseController.GetDocumentDB();

        for (const word of document.words)
            this.AddWordToIndex(word, trie);

        this.trie = trie;
    }

    //Private methods
    private AddToIndex(vocalized: DisplayVocalized[], indexEntry: IndexEntry, trie: PrefixTree<IndexEntry>)
    {
        const key = this.MapToKey(vocalized);
        trie.Add(key, indexEntry);
    }

    private AddVerbToIndex(verb: OpenArabDictVerb, trie: PrefixTree<IndexEntry>)
    {
        const rootData = this.rootsIndexService.GetRoot(verb.rootId)!;
        const root = new VerbRoot(rootData.radicals);

        const dialectType = this.dialectsService.MapDialectId(verb.dialectId)!;
        const dialectMeta = this.dialectsService.GetDialectMetaData(verb.dialectId);

        const verbType = (verb.soundOverride === true) ? VerbType.Sound : root.DeriveDeducedVerbType();
        const verbInstance = CreateVerb(dialectType, root, verb.stemParameters ?? (verb.stem as AdvancedStemNumber), verbType);

        const numeruses: Numerus[] = dialectMeta.hasDual ? [Numerus.Singular, Numerus.Dual, Numerus.Plural] : [Numerus.Singular, Numerus.Plural];
        const genders: Gender[] = [Gender.Male, Gender.Female];
        const tenses = [Tense.Perfect, Tense.Present];
        const presentMoods = dialectMeta.hasJussive ? [Mood.Indicative, Mood.Subjunctive, Mood.Jussive, Mood.Imperative] : [Mood.Indicative, Mood.Subjunctive, Mood.Imperative];

        const conjugator = new Conjugator();
        for (const tense of tenses)
        {
            const moods = (tense === Tense.Perfect) ? [undefined] : presentMoods;
            for (const mood of moods)
            {
                const voices = ((mood === Mood.Imperative) || !dialectMeta.hasPassive) ? [Voice.Active] : [Voice.Active, Voice.Passive];
                const persons = (mood === Mood.Imperative) ? [Person.Second] : [Person.First, Person.Second, Person.Third];

                for (const voice of voices)
                {
                    for (const numerus of numeruses)
                    {
                        for (const person of persons)
                        {
                            for (const gender of genders)
                            {
                                if(!dialectMeta.hasFemalePlural && (numerus === Numerus.Plural) && (gender === Gender.Female))
                                    continue;
                                if(person === Person.First)
                                {
                                    if(numerus === Numerus.Dual)
                                        continue;
                                    if(gender === Gender.Female)
                                        continue;
                                }
                                if((numerus === Numerus.Dual) && (person === Person.Second) && (gender === Gender.Female))
                                    continue;

                                const conjugated = conjugator.Conjugate(verbInstance, {
                                    gender,
                                    tense,
                                    numerus,
                                    person,
                                    voice,
                                    mood: mood as any
                                });

                                this.AddToIndex(conjugated, {
                                    conjugated: VocalizedWordTostring(conjugated),
                                    vocalized: conjugated,
                                    word: verb
                                }, trie);
                            }
                        }
                    }
                }
            }
        }
    }

    private AddWordToIndex(word: OpenArabDictWord, trie: PrefixTree<IndexEntry>)
    {
        switch(word.type)
        {
            case OpenArabDictWordType.Verb:
                this.AddVerbToIndex(word, trie);
                break;
            default:
            {
                const vocalized = ParseVocalizedText(word.text);
                this.AddToIndex(vocalized, {
                    vocalized,
                    word,
                }, trie);
            }
        }
    }

    private MapToKey(vocalized: DisplayVocalized[])
    {
        return vocalized.map(x => MapLetterToComparisonEquivalenceClass(x.letter));
    }

    //State
    private trie: PrefixTree<IndexEntry>;
}