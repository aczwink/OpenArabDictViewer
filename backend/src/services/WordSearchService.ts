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

export interface WordFilterCriteria
{
    wordType: OpenArabDictWordType | null;
    textFilter: string;
}

@Injectable
export class WordSearchService
{
    constructor(private dbController: DatabaseController, private arabicTextIndexService: ArabicTextIndexService, private wordsIndexService: WordsIndexService)
    {
    }

    //Public methods
    public async FindWords(filterCriteria: WordFilterCriteria, translationLanguage: TranslationLanguage, offset: number, limit: number)
    {
        const document = await this.dbController.GetDocumentDB();
        const translationDocument = await this.dbController.GetTranslationsDocumentDB(translationLanguage);

        filterCriteria.textFilter = filterCriteria.textFilter.trim();
        let filtered;
        if(filterCriteria.textFilter.length > 0)
        {
            const isArabic = ArabicText.IsArabicPhrase(filterCriteria.textFilter);
            if(isArabic)
                filtered = this.arabicTextIndexService.Find(filterCriteria.textFilter);
            else
            {
                filterCriteria.textFilter = filterCriteria.textFilter.toLowerCase();
                filtered = translationDocument.entries.Values()
                    .Map(this.SearchByTranslation.bind(this, filterCriteria));
            }
        }
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

        return filtered.Filter(x => x.score > 0.25).OrderByDescending(x => x.score).Skip(offset).Take(limit);
    }

    //Private methods
    private DoesFilterMatchEntry(filterCriteria: WordFilterCriteria, entry: OpenArabDictTranslationEntry)
    {
        const texts = entry.text.Values().Map(this.DoesFilterMatchText.bind(this, filterCriteria));

        if(entry.usage !== undefined)
            return texts.Concat(entry.usage.Values().Map(x => this.DoesFilterMatchText(filterCriteria, x.translation)));

        return texts;
    }

    private DoesFilterMatchText(filterCriteria: WordFilterCriteria, text: string)
    {
        return text.toLowerCase().includes(filterCriteria.textFilter);
    }

    private SearchByTranslation(filterCriteria: WordFilterCriteria, entry: { wordId: string; translations: OpenArabDictTranslationEntry[] }): SearchResultEntry
    {
        const translationMatch = entry.translations.Values().Map(this.DoesFilterMatchEntry.bind(this, filterCriteria)).Flatten().AnyTrue();
        const word = this.wordsIndexService.GetWord(entry.wordId);
        if(!translationMatch)
            return { score: 0, word };
        return {
            score: 1,
            word
        };
    }
}