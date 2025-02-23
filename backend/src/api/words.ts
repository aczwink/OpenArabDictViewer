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

type OptionalWordType = OpenArabDictWordType | null;

interface SearchResultEntry
{
    word: FullWordData;
    score: number;
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
    )
    {
        const filterCriteria: WordFilterCriteria = {
            textFilter,
            wordType
        };
        const wordIds = await this.wordSearchService.FindWords(filterCriteria, offset, limit);
        const words = wordIds.Map(async id => {
            const word = await this.wordsController.QueryWord(id);
            return Of<SearchResultEntry>({
                score: 0,
                word: word!
            });
        }).PromiseAll();

        return words;
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
        @Path wordId: number,
    )
    {
        const word = await this.wordsController.QueryWord(wordId);
        if(word === undefined)
            return NotFound("word not found");
        return word;
    }
}