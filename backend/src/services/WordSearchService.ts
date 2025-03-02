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
import { OpenArabDictWord, OpenArabDictWordType } from "openarabdict-domain";
import { DatabaseController } from "../data-access/DatabaseController";
import { IsArabicText } from "openarabicconjugation/src/Util";
import { ArabicTextIndexService, SearchResultEntry } from "./ArabicTextIndexService";
import { Of } from "acts-util-core";

export interface WordFilterCriteria
{
    wordType: OpenArabDictWordType | null;
    textFilter: string;
}

@Injectable
export class WordSearchService
{
    constructor(private dbController: DatabaseController, private arabicTextIndexService: ArabicTextIndexService)
    {
    }

    //Public methods
    public async FindWords(filterCriteria: WordFilterCriteria, offset: number, limit: number)
    {
        const document = await this.dbController.GetDocumentDB();

        filterCriteria.textFilter = filterCriteria.textFilter.trim();
        let filtered;
        if(filterCriteria.textFilter.length > 0)
        {
            const isArabic = IsArabicText(filterCriteria.textFilter);
            if(isArabic)
                filtered = this.arabicTextIndexService.Find(filterCriteria.textFilter);
            else
            {
                filterCriteria.textFilter = filterCriteria.textFilter.toLowerCase();
                filtered = document.words.Values()
                    .Filter(this.SearchByTranslation.bind(this, filterCriteria))
                    .Map(x => Of<SearchResultEntry>({ score: 1, word: x }));
            }
        }
        else
            filtered = document.words.Values().Map(x => Of<SearchResultEntry>({ score: 0, word: x }));

        if(filterCriteria.wordType !== null)
            filtered = filtered.Filter(x => x.word.type === filterCriteria.wordType);

        return filtered.Filter(x => x.score > 0.25).Skip(offset).Take(limit);
    }

    //Private methods
    private SearchByTranslation(filterCriteria: WordFilterCriteria, word: OpenArabDictWord)
    {
        const translationMatch = word.translations.Values().Map(x => x.text.Values().Map(x => x.toLowerCase().includes(filterCriteria.textFilter))).Flatten().AnyTrue();
        if(!translationMatch)
            return false;

        return true;
    }
}