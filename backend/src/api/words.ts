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

import { APIController, Get, NotFound, Path, Query } from "@aczwink/acts-util-apilib";
import { FullWordData, WordsController } from "../data-access/WordsController";
import { OpenArabDictWordParent, OpenArabDictWordType } from "openarabdict-domain";
import { WordFilterCriteria, WordSearchService } from "../services/WordSearchService";
import { Of } from "@aczwink/acts-util-core";
import { ImplicitWordParent, SearchResultEntry as SearchResultEntryATIS } from "../services/ArabicTextIndexService";
import { IsArabicPhrase } from "openarabicconjugation/src/Util";
import { ParseVocalizedPhrase } from "openarabicconjugation/src/Vocalization";
import { TranslationLanguage } from "../data-access/DatabaseController";

type OptionalWordType = OpenArabDictWordType | null;

interface SearchResultEntry
{
    derived?: {
        text: string;
        parent: OpenArabDictWordParent | ImplicitWordParent;
    };
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
        @Query translationLanguage: TranslationLanguage
    )
    {
        const filterCriteria: WordFilterCriteria = {
            textFilter,
            wordType
        };
        const searchResults = await this.wordSearchService.FindWords(filterCriteria, translationLanguage, offset, limit);
        const searchResultsArray = searchResults.ToArray();
        this.ScaleByMatchLength(textFilter, searchResultsArray);

        const words = searchResultsArray.Values().Map(async sq => {
            const word = await this.wordsController.QueryWord(sq.word.id, translationLanguage);
            return Of<SearchResultEntry>({
                derived: sq.derived,
                score: sq.score,
                word: word!
            });
        }).PromiseAll();

        return words;
    }

    //Private methods
    private ComputePhraseLength(entry: SearchResultEntryATIS)
    {
        const text = entry.derived?.text ?? entry.word.text;
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
        @Query translationLanguage: TranslationLanguage
    )
    {
        const word = await this.wordsController.QueryWord(wordId, translationLanguage);
        if(word === undefined)
            return NotFound("word not found");
        return word;
    }
}