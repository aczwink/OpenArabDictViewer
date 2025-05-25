/**
 * OpenArabDictViewer
 * Copyright (C) 2024-2025 Amir Czwink (amir130@hotmail.de)
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

import { Injectable } from "acfrontend";
import { APIService } from "./APIService";
import { FullWordData } from "../../dist/api";
import { Dictionary } from "acts-util-core";
import { OpenArabDictRoot, OpenArabDictVerb, OpenArabDictWord, OpenArabDictWordType } from "openarabdict-domain";
import { PageLanguageService } from "./PageLanguageService";

export interface WordWithConnections extends FullWordData
{
    word: OpenArabDictWord;
}

export interface FullVerbData
{
    rootData: OpenArabDictRoot;
    verbData: OpenArabDictVerb;
}

@Injectable
export class CachedAPIService
{
    constructor(private apiService: APIService, private pageLanguageService: PageLanguageService)
    {
        this.rootsCache = {};
        this.rootWordsCache = {};
        this.wordsCache = {};
    }

    //Public methods
    public async QueryFullVerbData(verbId: string): Promise<FullVerbData>
    {
        const verbData = await this.QueryVerb(verbId);
        return await this.QueryFullVerbDataForVerbData(verbData);
    }

    public async QueryFullVerbDataForVerbData(verbData: OpenArabDictVerb): Promise<FullVerbData>
    {
        return {
            rootData: await this.QueryRootData(verbData.rootId),
            verbData
        };
    }

    public async QueryRootData(rootId: string)
    {
        const cached = this.rootsCache[rootId];
        if(cached !== undefined)
            return cached;

        const response = await this.apiService.roots._any_.get(rootId);
        if(response.statusCode !== 200)
            throw new Error("HERE");
        this.rootsCache[rootId] = response.data;
        return response.data;
    }

    public async QueryRootWords(rootId: string)
    {
        const targetLanguage = this.pageLanguageService.activeLanguage;

        const response = await this.apiService.roots._any_.words.get(rootId, { targetLanguage });
        const words = response.data as WordWithConnections[];

        this.rootWordsCache[rootId] = words;
        for (const word of words)
            this.CacheWord(word);

        return words.map(x => this.FormFullWordDataResult(x)) as WordWithConnections[];
    }

    public async QueryVerb(verbId: string)
    {
        const word = await this.QueryWord(verbId);
        if(word.type !== OpenArabDictWordType.Verb)
            throw new Error("HERE");
        return word;
    }

    public async QueryWord(wordId: string)
    {
        const fwd = await this.QueryFullWordData(wordId);

        return fwd.word as OpenArabDictWord;
    }

    public async QueryWordWithConnections(wordId: string)
    {
        const fwd = await this.QueryFullWordData(wordId);

        return fwd as WordWithConnections;
    }

    //Private methods
    private CacheWord(data: FullWordData)
    {
        const targetLanguage = this.pageLanguageService.activeLanguage;
        this.wordsCache[data.word.id + "-" + targetLanguage] = data;
    }

    private FormFullWordDataResult(fwd: FullWordData): FullWordData
    {
        return {
            derived: fwd.derived,
            related: fwd.related,
            translations: fwd.translations,
            word: {
                ...fwd.word,
                translations: fwd.translations,
            }
        };
    }

    private async QueryFullWordData(wordId: string)
    {
        const targetLanguage = this.pageLanguageService.activeLanguage;

        const cached = this.wordsCache[wordId + "-" + targetLanguage];
        if(cached !== undefined)
            return this.FormFullWordDataResult(cached);

        const response = await this.apiService.words._any_.get(wordId, { targetLanguage });
        if(response.statusCode !== 200)
            throw new Error("HERE");
        this.CacheWord(response.data);

        return this.FormFullWordDataResult(response.data);
    }

    //State
    private rootsCache: Dictionary<OpenArabDictRoot>;
    private rootWordsCache: Dictionary<WordWithConnections[]>;
    private wordsCache: Dictionary<FullWordData>;
}