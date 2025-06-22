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
import { OpenArabDictGenderedWord, OpenArabDictNonVerbDerivationType, OpenArabDictVerb, OpenArabDictVerbDerivationType, OpenArabDictWord, OpenArabDictWordParentType, OpenArabDictWordType } from "openarabdict-domain";
import { Conjugator } from "openarabicconjugation/src/Conjugator";
import { RootsIndexService } from "./RootsIndexService";
import { VerbRoot } from "openarabicconjugation/src/VerbRoot";
import { AdvancedStemNumber, Case, Gender, Mood, Numerus, Person, Tense, Voice } from "openarabicconjugation/src/Definitions";
import { DialectsService } from "./DialectsService";
import { CompareVocalized, DisplayVocalized, MapLetterToComparisonEquivalenceClass, ParseVocalizedPhrase, VocalizedWordTostring } from "openarabicconjugation/src/Vocalization";
import { PrefixTree } from "../indexes/PrefixTree";
import { Dictionary, ObjectExtensions, Of } from "acts-util-core";
import { CreateVerb, Verb } from "openarabicconjugation/src/Verb";
import { DialectType } from "openarabicconjugation/src/Dialects";
import { MapVerbTypeToOpenArabicConjugation } from "../shared";

interface IndexEntry
{
    conjugated?: string;
    vocalized: DisplayVocalized[][];
    word: OpenArabDictWord;
}

export interface SearchResultEntry
{
    conjugated?: string;
    score: number;
    word: OpenArabDictWord;
}

interface ParticipleCreationState
{
    verb: OpenArabDictVerb;
    verbInstance: Verb<string>;
}

interface CreationState
{
    activeParticiples: Dictionary<ParticipleCreationState>;
    passiveParticiples: Dictionary<ParticipleCreationState>;
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
        const parsed = ParseVocalizedPhrase(textFilter);
        const key = this.MapPhraseToKey(parsed);

        const indexEntries = this.trie.Find(key);
        return indexEntries.Map(x => Of<SearchResultEntry>({
            conjugated: x.conjugated,
            score: this.ComparePhrases(parsed, x.vocalized),
            word: x.word
        }));
    }

    public async RebuildIndex()
    {
        const trie = new PrefixTree<IndexEntry>;

        const document = await this.databaseController.GetDocumentDB();

        const state: CreationState = {
            activeParticiples: {},
            passiveParticiples: {}
        };
        for (const word of document.words)
            this.AddWordToIndex(word, state, trie);

        for (const part of ObjectExtensions.Values(state.activeParticiples).NotUndefined())
        {
            const conjugator = new Conjugator();

            const activeParticiple = conjugator.ConjugateParticiple(part.verbInstance, Voice.Active);
            this.AddConjugatedWordToIndex(trie, activeParticiple, part.verb);
        }
        for (const part of ObjectExtensions.Values(state.passiveParticiples).NotUndefined())
        {
            const conjugator = new Conjugator();

            const passiveParticiple = conjugator.ConjugateParticiple(part.verbInstance, Voice.Passive);
            this.AddConjugatedWordToIndex(trie, passiveParticiple, part.verb);
        }

        this.trie = trie;
    }

    //Private methods
    private AddAdjectiveToIndex(word: OpenArabDictGenderedWord, trie: PrefixTree<IndexEntry>)
    {
        const vocalized = ParseVocalizedPhrase(word.text);
        this.AddToIndex({
            vocalized,
            word,
        }, trie);

        const conjugator = new Conjugator();
        const female = conjugator.DeclineAdjective(word.text, {
            case: Case.Informal,
            definite: false,
            gender: Gender.Female
        }, DialectType.ModernStandardArabic);

        this.AddConjugatedWordToIndex(trie, female, word);
    }

    private AddConjugatedWordToIndex(trie: PrefixTree<IndexEntry>, conjugated: DisplayVocalized[], word: OpenArabDictWord)
    {
        this.AddToIndex({
            conjugated: VocalizedWordTostring(conjugated),
            vocalized: [conjugated],
            word,
        }, trie);
    }

    private AddToIndex(indexEntry: IndexEntry, trie: PrefixTree<IndexEntry>)
    {
        const key = this.MapPhraseToKey(indexEntry.vocalized);
        trie.Add(key, indexEntry);
    }

    private AddVerbToIndex(verb: OpenArabDictVerb, state: CreationState, trie: PrefixTree<IndexEntry>)
    {
        const rootData = this.rootsIndexService.GetRoot(verb.rootId)!;
        const root = new VerbRoot(rootData.radicals);

        const dialectType = this.dialectsService.MapDialectId(verb.dialectId)!;
        const dialectMeta = this.dialectsService.GetDialectMetaData(verb.dialectId);

        const verbType = MapVerbTypeToOpenArabicConjugation(verb.verbType) ?? root.DeriveDeducedVerbType();
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

                                this.AddConjugatedWordToIndex(trie, conjugated, verb);
                            }
                        }
                    }
                }
            }
        }

        state.activeParticiples[verb.id] = {
            verbInstance,
            verb
        };
        state.passiveParticiples[verb.id] = {
            verbInstance,
            verb
        };
    }

    private AddWordToIndex(word: OpenArabDictWord, state: CreationState, trie: PrefixTree<IndexEntry>)
    {
        if(word.parent?.type === OpenArabDictWordParentType.Verb)
        {
            if(word.parent.derivation === OpenArabDictVerbDerivationType.ActiveParticiple)
                delete state.activeParticiples[word.parent.verbId];
            if(word.parent.derivation === OpenArabDictVerbDerivationType.PassiveParticiple)
                delete state.passiveParticiples[word.parent.verbId];
        }

        switch(word.type)
        {
            case OpenArabDictWordType.Adjective:
                if(word.isMale || !((word.parent?.type === OpenArabDictWordParentType.NonVerbWord) && (word.parent.relationType === OpenArabDictNonVerbDerivationType.Feminine)))
                    this.AddAdjectiveToIndex(word, trie);
                break;
            case OpenArabDictWordType.Verb:
                this.AddVerbToIndex(word, state, trie);
                break;
            default:
            {
                const vocalized = ParseVocalizedPhrase(word.text);
                this.AddToIndex({
                    vocalized,
                    word,
                }, trie);
            }
        }
    }

    private ComparePhrases(search: DisplayVocalized[][], test: DisplayVocalized[][])
    {
        if(search.length > test.length)
            return 0;

        const maxLen = Math.min(search.length, test.length);
        let sum = 0;
        for(let i = 0; i < maxLen-1; i++)
        {
            const si = search[i];
            const ti = test[i];

            sum += CompareVocalized(si, ti);
        }

        const si = search[maxLen-1];
        const ti = test[maxLen-1];
        sum += CompareVocalized(si, ti.slice(0, si.length));

        return sum / maxLen;
    }

    private MapWordToKey(vocalized: DisplayVocalized[])
    {
        return vocalized.map(x => MapLetterToComparisonEquivalenceClass(x.letter));
    }

    private MapPhraseToKey(phrase: DisplayVocalized[][])
    {
        const result = [];
        for(let i = 0; i < phrase.length; i++)
        {
            result.push(...this.MapWordToKey(phrase[i]));
            if((i+1) !== phrase.length)
                result.push(" ");
        }
        return result;
    }

    //State
    private trie: PrefixTree<IndexEntry>;
}