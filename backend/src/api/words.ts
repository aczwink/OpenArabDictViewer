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

import { APIController, Get, NotFound, Path, Query } from "acts-util-apilib";
import { FullWordData, WordsController } from "../data-access/WordsController";
import { OpenArabDictWordType } from "openarabdict-domain";
import { WordFilterCriteria, WordSearchService } from "../services/WordSearchService";
import { Of } from "acts-util-core";
import { TargetTranslationLanguage } from "../services/TranslationService";
import { SearchResultEntry as SearchResultEntryATIS } from "../services/ArabicTextIndexService";
import { IsArabicPhrase } from "openarabicconjugation/src/Util";
import { ParseVocalizedPhrase } from "openarabicconjugation/src/Vocalization";

type OptionalWordType = OpenArabDictWordType | null;

interface SearchResultEntry
{
    conjugated?: string;
    score: number;
    word: FullWordData;
}

@APIController("words")
class _api_
{
    constructor(private wordsController: WordsController, private wordSearchService: WordSearchService)
    {
    }

    @Get()
    public async FindWords(
        @Query textFilter: string,
        @Query wordType: OptionalWordType,
        @Query offset: number,
        @Query limit: number,
        @Query targetLanguage: TargetTranslationLanguage
    )
    {
        const filterCriteria: WordFilterCriteria = {
            textFilter,
            wordType
        };
        const searchResults = await this.wordSearchService.FindWords(filterCriteria, offset, limit);
        const searchResultsArray = searchResults.ToArray();
        this.ScaleByMatchLength(textFilter, searchResultsArray);

        const words = searchResultsArray.Values().Map(async sq => {
            const word = await this.wordsController.QueryWord(sq.word.id, targetLanguage);
            return Of<SearchResultEntry>({
                conjugated: sq.conjugated,
                score: sq.score,
                word: word!
            });
        }).PromiseAll();

        return words;
    }

    //Private methods
    private ComputePhraseLength(entry: SearchResultEntryATIS)
    {
        const text = entry.conjugated ?? entry.word.text;
        const parsed = ParseVocalizedPhrase(text);
        return parsed.Values().Map(x => x.length).Sum();
    }

    private ScaleByMatchLength(textFilter: string, searchResultsArray: SearchResultEntryATIS[])
    {
        if((textFilter.length > 0) && IsArabicPhrase(textFilter))
        {
            const lengths = searchResultsArray.map(x => this.ComputePhraseLength(x));
            const min = Math.min(...lengths);
            const max = Math.max(...lengths);

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
}

//TODO: redesign this. should be a child of words
@APIController("randomword")
class _api3_
{
    constructor(private wordsController: WordsController)
    {
    }

    @Get()
    public async QueryRandomWord()
    {
        return await this.wordsController.QueryRandomWordId();
    }
}

@APIController("words/{wordId}")
class _api2_
{
    constructor(private wordsController: WordsController)
    {
    }

    @Get()
    public async QueryWord(
        @Path wordId: string,
        @Query targetLanguage: TargetTranslationLanguage
    )
    {
        const word = await this.wordsController.QueryWord(wordId, targetLanguage);
        if(word === undefined)
            return NotFound("word not found");
        return word;
    }
}