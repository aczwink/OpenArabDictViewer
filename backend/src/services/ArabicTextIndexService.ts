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
import { Gender, Letter, Mood, Numerus, Person, Tense, VerbType, Voice } from "openarabicconjugation/src/Definitions";
import { DialectsService } from "./DialectsService";
import { DisplayVocalized, ParseVocalizedText } from "openarabicconjugation/src/Vocalization";
import { Trie } from "../indexes/Trie";

interface IndexEntry
{
    vocalized: DisplayVocalized[];
    word: OpenArabDictWord;
}

@Injectable
export class ArabicTextIndexService
{
    constructor(private databaseController: DatabaseController, private rootsIndexService: RootsIndexService, private dialectsService: DialectsService)
    {
        this.trie = new Trie;
    }

    //Public methods
    public Find(textFilter: string)
    {
        const parsed = ParseVocalizedText(textFilter);
        const key = this.MapToKey(parsed);

        const indexEntries = this.trie.Find(key);
        return indexEntries.Values().Map(x => x.word);
    }

    public async RebuildIndex()
    {
        const trie = new Trie<IndexEntry>;

        const document = await this.databaseController.GetDocumentDB();

        for (const word of document.words)
            this.AddWordToIndex(word, trie);

        this.trie = trie;
    }

    //Private methods
    private AddToIndex(vocalized: DisplayVocalized[], indexEntry: IndexEntry, trie: Trie<IndexEntry>)
    {
        const key = this.MapToKey(vocalized);
        trie.Add(key, indexEntry);
    }

    private AddVerbToIndex(verb: OpenArabDictVerb, trie: Trie<IndexEntry>)
    {
        const rootData = this.rootsIndexService.GetRoot(verb.rootId)!;
        const root = new VerbRoot(rootData.radicals);

        const dialect = this.dialectsService.MapDialectId(verb.dialectId)!;

        let stem1ctx;
        if(verb.stemParameters !== undefined)
        {
            const verbType = (verb.soundOverride === true) ? VerbType.Sound : root.DeriveDeducedVerbType();
            stem1ctx = this.dialectsService.GetDialectMetaData(verb.dialectId).CreateStem1Context(verbType, verb.stemParameters);
        }

        const numeruses: Numerus[] = [Numerus.Singular, Numerus.Dual, Numerus.Plural];
        const genders: Gender[] = [Gender.Male, Gender.Female];
        const tenses = [Tense.Perfect, Tense.Present];

        const conjugator = new Conjugator();
        for (const tense of tenses)
        {
            const moods: Mood[] = (tense === Tense.Perfect) ? [Mood.Indicative] : [Mood.Indicative, Mood.Subjunctive, Mood.Jussive, Mood.Imperative];   
            for (const mood of moods)
            {
                const voices = (mood === Mood.Imperative) ? [Voice.Active] : [Voice.Active, Voice.Passive];
                const persons = (mood === Mood.Imperative) ? [Person.Second] : [Person.First, Person.Second, Person.Third];

                for (const voice of voices)
                {
                    for (const numerus of numeruses)
                    {
                        for (const person of persons)
                        {
                            for (const gender of genders)
                            {
                                const conjugated = conjugator.Conjugate(root, {
                                    gender,
                                    tense,
                                    numerus,
                                    person,
                                    stem: verb.stem as any,
                                    stem1Context: stem1ctx as any,
                                    voice,
                                    mood
                                }, dialect);

                                this.AddToIndex(conjugated, {
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

    private AddWordToIndex(word: OpenArabDictWord, trie: Trie<IndexEntry>)
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
        return vocalized.map(x => this.MapToSearchLetter(x.letter));
    }

    private MapToSearchLetter(letter: Letter)
    {
        switch(letter)
        {
            case Letter.AlefHamza:
                return Letter.Alef;
            /*
            private MapWordToSearchVariant(word: string)
    {
        //map all chars to their basic form
        const alif = trimmed.replace(/[\u0622\u0625]/g, "\u0627");
        const waw = alif.replace(/[\u0624]/g, "\u0648");
        const ya = waw.replace(/[\u0626\u0649]/g, "\u064A");

        return ya;
    }
            */
        }

        return letter;
    }

    //State
    private trie: Trie<IndexEntry>;
}