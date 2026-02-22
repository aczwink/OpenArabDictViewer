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
import { OpenArabDictTranslationEntry, OpenArabDictWordType } from "@aczwink/openarabdict-domain";
import { DatabaseController, TranslationLanguage } from "../data-access/DatabaseController";
import { ArabicTextIndexService, ImplicitWordDerivation, SearchResultEntry } from "./ArabicTextIndexService";
import { Of } from "@aczwink/acts-util-core";
import { WordsIndexService } from "./WordsIndexService";
import { ArabicText } from "@aczwink/openarabicconjugation";
import { TranslationTextService } from "./TranslationTextService";

export interface WordFilterCriteria
{
    wordType: OpenArabDictWordType | null;
    textFilter: string;
}

@Injectable
export class WordSearchService
{
    constructor(private dbController: DatabaseController, private arabicTextIndexService: ArabicTextIndexService, private wordsIndexService: WordsIndexService, private translationTextService: TranslationTextService)
    {
    }

    //Public methods
    public async FindWords(filterCriteria: WordFilterCriteria, translationLanguage: TranslationLanguage, offset: number, limit: number)
    {
        const document = await this.dbController.GetDocumentDB();

        filterCriteria.textFilter = filterCriteria.textFilter.trim();
        let filtered;
        if(filterCriteria.textFilter.length > 0)
            filtered = await this.FilterByText(filterCriteria, translationLanguage);
        else
            filtered = document.words.Values().Map(x => Of<SearchResultEntry>({ score: 1, word: x }));

        if(filterCriteria.wordType !== null)
            filtered = filtered.Filter(x => x.word.type === filterCriteria.wordType);
        else
        {
            //make search slightly prefer non-verbs such that verbal nouns and so actually do appear
            filtered = filtered.Map(x => {
                if((x.derived?.parent.type === "i") && (x.derived.parent.kind === ImplicitWordDerivation.ConjugatedVerb))
                    x.score -= 0.001;
                return x;
            });
        }

        const ordered = filtered.Filter(x => x.score > 0.25).ToArray();
        this.ScaleByMatchLength(filterCriteria.textFilter, ordered);

        return ordered.Values().OrderByDescending(x => x.score).Skip(offset).Take(limit);
    }

    //Private methods
    private ComputeMatchScore(filterCriteria: WordFilterCriteria, translationLanguage: TranslationLanguage, text: string): number
    {
        const test = this.translationTextService.ContainsCaseInsensitive(text, filterCriteria.textFilter, translationLanguage);
        if(!test)
            return 0;

        const words = this.translationTextService.SplitIntoWords(text);
        return words.Values().Map(this.ComputeMatchScoreForWord.bind(this, filterCriteria.textFilter, translationLanguage)).Max();
    }

    private ComputeMatchScoreForWord(textFilterLowerCase: string, translationLanguage: TranslationLanguage, word: string)
    {
        const test = this.translationTextService.ContainsCaseInsensitive(word, textFilterLowerCase, translationLanguage);
        if(!test)
            return 0;

        return textFilterLowerCase.length / word.length;
    }

    private ComputeMatchScoreForEntry(filterCriteria: WordFilterCriteria, translationLanguage: TranslationLanguage, entry: OpenArabDictTranslationEntry)
    {
        const texts = entry.text.Values().Map(this.ComputeMatchScore.bind(this, filterCriteria, translationLanguage));

        if(entry.usage !== undefined)
            return texts.Concat(entry.usage.Values().Map(x => this.ComputeMatchScore(filterCriteria, translationLanguage, x.translation)));

        return texts;
    }

    private ComputePhraseLength(entry: SearchResultEntry)
    {
        const text = entry.derived?.text ?? entry.word.text;
        const parsed = ArabicText.ParseVocalizedPhrase(text);
        return parsed.Values().Map(x => x.length).Sum();
    }

    private async FilterByText(filterCriteria: WordFilterCriteria, translationLanguage: TranslationLanguage)
    {
        const translationDocument = await this.dbController.GetTranslationsDocumentDB(translationLanguage);
        
        let filtered;

        const isArabic = ArabicText.IsArabicPhrase(filterCriteria.textFilter);
        if(isArabic)
            filtered = this.arabicTextIndexService.Find(filterCriteria.textFilter);
        else
        {
            filtered = translationDocument.entries.Values()
                .Map(this.SearchByTranslation.bind(this, filterCriteria, translationLanguage));
        }

        return filtered;
    }

    private ScaleByMatchLength(textFilter: string, searchResultsArray: SearchResultEntry[])
    {
        if((textFilter.length > 0) && ArabicText.IsArabicPhrase(textFilter))
        {
            const lengths = searchResultsArray.map(x => this.ComputePhraseLength(x));
            const min = Math.min(...lengths);
            const max = Math.max(...lengths);

            if(min === max)
                return;

            for(let i = 0; i < searchResultsArray.length; i++)
            {
                const entry = searchResultsArray[i];
                const length = lengths[i];

                const lengthScore = (length - min) / (max - min);
                const lengthScoreInverted = 1 - lengthScore;
                
                entry.score *= lengthScoreInverted;
            }
        }
    }

    private SearchByTranslation(filterCriteria: WordFilterCriteria, translationLanguage: TranslationLanguage, entry: { wordId: string; translations: OpenArabDictTranslationEntry[] }): SearchResultEntry
    {
        const word = this.wordsIndexService.GetWord(entry.wordId);
        if(entry.translations.IsEmpty())
        {
            return {
                word,
                score: 0
            }
        }

        return {
            score: entry.translations.Values().Map(this.ComputeMatchScoreForEntry.bind(this, filterCriteria, translationLanguage)).Flatten().Max(),
            word
        };
    }
}