/**
 * OpenArabDictViewer
 * Copyright (C) 2025-2026 Amir Czwink (amir130@hotmail.de)
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
import { DatabaseController } from "../data-access/DatabaseController";
import { OpenArabDictGenderedWord, OpenArabDictNonVerbDerivationType, OpenArabDictRoot, OpenArabDictVerb, OpenArabDictVerbDerivationType, OpenArabDictWord, OpenArabDictWordParent, OpenArabDictWordParentType, OpenArabDictWordType } from "openarabdict-domain";
import { Conjugator } from "openarabicconjugation/dist/Conjugator";
import { RootsIndexService } from "./RootsIndexService";
import { AdjectiveOrNounState, Case, Gender, Mood, Numerus, Person, Tense, Voice } from "openarabicconjugation/dist/Definitions";
import { DialectsService } from "./DialectsService";
import { CompareVocalized, DisplayVocalized, MapLetterToComparisonEquivalenceClass, ParseVocalizedPhrase, ParseVocalizedText, VocalizedWordTostring } from "openarabicconjugation/dist/Vocalization";
import { PrefixTree } from "../indexes/PrefixTree";
import { Of } from "@aczwink/acts-util-core";
import { Verb } from "openarabicconjugation/dist/Verb";
import { DialectType } from "openarabicconjugation/dist/Dialects";
import { GetDialectMetadata } from "openarabicconjugation/dist/DialectsMetadata";
import { CreateVerbFromOADVerb, FindHighestConjugatableDialectOf } from "openarabdict-openarabicconjugation-bridge";
import { TargetAdjectiveNounDerivation } from "openarabicconjugation/dist/DialectConjugator";
import { TranslationIndexService } from "./TranslationIndexService";
import { WordsIndexService } from "./WordsIndexService";

export enum ImplicitWordDerivation
{
    ConjugatedVerb,
    FeminineActiveParticiple,
    FemininePassiveParticiple,
}

export interface ImplicitWordParent
{
    type: "i";
    kind: ImplicitWordDerivation;
}

interface IndexEntry
{
    derived?: {
        text: string;
        parent: OpenArabDictWordParent | ImplicitWordParent;
    };
    vocalized: DisplayVocalized[][];
    word: OpenArabDictWord;
}

export interface SearchResultEntry
{
    derived?: {
        text: string;
        parent: OpenArabDictWordParent | ImplicitWordParent;
    };
    score: number;
    word: OpenArabDictWord;
}

@Injectable
export class ArabicTextIndexService
{
    constructor(private databaseController: DatabaseController, private rootsIndexService: RootsIndexService, private dialectsService: DialectsService, private wordsIndexService: WordsIndexService,
        private translationIndexService: TranslationIndexService)
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
            derived: x.derived,
            score: this.ComparePhrases(parsed, x.vocalized),
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
    private AddAdjectiveToIndex(word: OpenArabDictGenderedWord, trie: PrefixTree<IndexEntry>)
    {
        const vocalized = ParseVocalizedPhrase(word.text);
        this.AddToIndex({
            vocalized,
            word,
        }, trie);

        if(word.isMale === false)
            return;

        const children = this.wordsIndexService.GetChildrenOf(word.id);
        for (const child of children)
        {
            if((child.type === OpenArabDictWordParentType.NonVerbWord) && (child.relationType === OpenArabDictNonVerbDerivationType.Feminine))
                return;
        }

        const conjugator = new Conjugator();
        const female = conjugator.DeriveSoundAdjectiveOrNoun(ParseVocalizedText(word.text), Gender.Male, TargetAdjectiveNounDerivation.DeriveFeminineSingular, DialectType.ModernStandardArabic);

        this.AddDerivedWordToIndex(trie, female, { type: OpenArabDictWordParentType.NonVerbWord, relationType: OpenArabDictNonVerbDerivationType.Feminine, wordId: word.id }, word);
    }

    private AddDerivedWordToIndex(trie: PrefixTree<IndexEntry>, conjugated: DisplayVocalized[], derivation: OpenArabDictWordParent | ImplicitWordDerivation, word: OpenArabDictWord)
    {
        this.AddToIndex({
            derived: {
                text: VocalizedWordTostring(conjugated),
                parent: (typeof derivation === "number") ? { type: "i", kind: derivation } : derivation,
            },
            vocalized: [conjugated],
            word,
        }, trie);
    }

    private AddNounToIndex(word: OpenArabDictGenderedWord, trie: PrefixTree<IndexEntry>)
    {
        const vocalized = ParseVocalizedPhrase(word.text);
        this.AddToIndex({
            vocalized,
            word,
        }, trie);
        
        const conjugator = new Conjugator();
        const definite = conjugator.DeclineAdjectiveOrNoun({
            gender: word.isMale ? Gender.Male : Gender.Female,
            numerus: Numerus.Singular, //TODO!!!
            vocalized: vocalized[0]
        },
        {
            case: Case.Informal,
            state: AdjectiveOrNounState.Definite
        }, DialectType.ModernStandardArabic);
        this.AddToIndex({ vocalized: [definite], word }, trie);
    }

    private AddParticipleToIndex(voice: Voice, verb: OpenArabDictVerb, verbInstance: Verb<string>, trie: PrefixTree<IndexEntry>)
    {
        const conjugator = new Conjugator();

        const participle = ((voice === Voice.Active) && (verb.form.stativeActiveParticiple === true))
            ? conjugator.DeclineStativeActiveParticiple(verbInstance)
            : conjugator.ConjugateParticiple(verbInstance, voice);
        this.AddDerivedWordToIndex(trie, participle, { type: OpenArabDictWordParentType.Verb, derivation: (voice === Voice.Active) ? OpenArabDictVerbDerivationType.ActiveParticiple : OpenArabDictVerbDerivationType.PassiveParticiple, verbId: verb.id }, verb);

        if(verbInstance.dialect === DialectType.ModernStandardArabic)
        {
            const female = conjugator.DeriveSoundAdjectiveOrNoun(participle, Gender.Male, TargetAdjectiveNounDerivation.DeriveFeminineSingular, DialectType.ModernStandardArabic);
            this.AddDerivedWordToIndex(trie, female, (voice === Voice.Active) ? ImplicitWordDerivation.FeminineActiveParticiple : ImplicitWordDerivation.FemininePassiveParticiple, verb);
        }
    }

    private AddToIndex(indexEntry: IndexEntry, trie: PrefixTree<IndexEntry>)
    {
        const key = this.MapPhraseToKey(indexEntry.vocalized);
        trie.Add(key, indexEntry);
    }

    private AddVerbalNounIfUnique(verb: OpenArabDictVerb, verbInstance: Verb<string>, trie: PrefixTree<IndexEntry>)
    {
        if(verbInstance.dialect !== DialectType.ModernStandardArabic)
            return;

        const conjugator = new Conjugator();

        if(!conjugator.HasPotentiallyMultipleVerbalNounForms(verbInstance))
        {
            const result = conjugator.GenerateAllPossibleVerbalNouns(verbInstance);
            const verbalNoun = result[0];
            this.AddDerivedWordToIndex(trie, verbalNoun, { type: OpenArabDictWordParentType.Verb, derivation: OpenArabDictVerbDerivationType.VerbalNoun, verbId: verb.id }, verb);
        }
    }

    private AddVerbToIndex(verb: OpenArabDictVerb, trie: PrefixTree<IndexEntry>)
    {
        const root = this.rootsIndexService.GetRoot(verb.rootId)!;

        const dialects = new Set<DialectType>();
        dialects.add(DialectType.Lebanese);
        dialects.add(DialectType.ModernStandardArabic);

        if(verb.form.variants === undefined)
        {
            const dialectType = FindHighestConjugatableDialectOf(root.radicals, verb.form, this.translationIndexService.GetTranslationsOf(verb.id, "en"));
            this.AddVerbVariantToIndex(dialectType, root, verb, trie);
            dialects.delete(dialectType);
        }
        else
        {
            for (const variant of verb.form.variants)
            {
                const dialectType = this.dialectsService.MapDialectId(variant.dialectId)!;

                this.AddVerbVariantToIndex(dialectType, root, verb, trie);

                dialects.delete(dialectType);
            }
        }

        if((verb.form.stem > 1) && (verb.form.verbType === undefined))
        {
            for (const dialect of dialects)
            {
                this.AddVerbVariantToIndex(dialect, root, verb, trie);
            }
        }
    }

    private AddVerbVariantToIndex(dialectType: DialectType, root: OpenArabDictRoot, verb: OpenArabDictVerb, trie: PrefixTree<IndexEntry>)
    {
        const dialectMeta = GetDialectMetadata(dialectType);
        
        const verbInstance = CreateVerbFromOADVerb(dialectType, root, verb);
        if(!dialectMeta.IsConjugatable(verbInstance))
            return;

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
                                
                                this.AddDerivedWordToIndex(trie, conjugated, ImplicitWordDerivation.ConjugatedVerb, verb);
                            }
                        }
                    }
                }
            }
        }

        const children = this.wordsIndexService.GetChildrenOf(verb.id);
        let hasActiveParticiple = false;
        let hasPassiveParticiple = false;
        let hasVerbalNoun = false;
        for (const child of children)
        {
            if(child.type === OpenArabDictWordParentType.Verb)
            {
                if(child.derivation === OpenArabDictVerbDerivationType.ActiveParticiple)
                    hasActiveParticiple = true;
                else if(child.derivation === OpenArabDictVerbDerivationType.PassiveParticiple)
                    hasPassiveParticiple = true;
                else if(child.derivation === OpenArabDictVerbDerivationType.VerbalNoun)
                    hasVerbalNoun = true;
            }
        }

        if(!hasActiveParticiple)
            this.AddParticipleToIndex(Voice.Active, verb, verbInstance, trie);
        if(dialectMeta.hasPassive && !hasPassiveParticiple)
            this.AddParticipleToIndex(Voice.Passive, verb, verbInstance, trie);
        if(!hasVerbalNoun)
            this.AddVerbalNounIfUnique(verb, verbInstance, trie);
    }

    private AddWordToIndex(word: OpenArabDictWord, trie: PrefixTree<IndexEntry>)
    {
        switch(word.type)
        {
            case OpenArabDictWordType.Adjective:
                this.AddAdjectiveToIndex(word, trie);
                break;
            case OpenArabDictWordType.Noun:
                this.AddNounToIndex(word, trie);
                break;
            case OpenArabDictWordType.Verb:
                this.AddVerbToIndex(word, trie);
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