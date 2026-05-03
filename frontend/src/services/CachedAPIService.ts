/**
 * OpenArabDictViewer
 * Copyright (C) 2024-2026 Amir Czwink (amir130@hotmail.de)
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

import { Injectable } from "@aczwink/acfrontend";
import { APIService } from "./APIService";
import { Dictionary } from "@aczwink/acts-util-core";
import { OpenArabDictPartOfSpeech, OpenArabDictRoot, OpenArabDictTranslationEntry, OpenArabDictVerb } from "@aczwink/openarabdict-domain";
import { GlobalSettingsService } from "./GlobalSettingsService";
import { LexemeData, LexemeSense } from "../../dist/api";

export interface FullVerbData
{
    rootData: OpenArabDictRoot;
    verbData: OpenArabDictVerb;
}

//TODO: acts util api :(
export interface LexicalUnitAPIData
{
    pos: OpenArabDictPartOfSpeech;
    translations: OpenArabDictTranslationEntry[];
}

export interface LexemeSenseAPIData
{
    units: LexicalUnitAPIData[];
}

export interface LexemeAPIData extends LexemeData
{
    senses: LexemeSenseAPIData[];
}
//end of TODO: acts util api :(

@Injectable
export class CachedAPIService
{
    constructor(private apiService: APIService, private pageLanguageService: GlobalSettingsService)
    {
        this.rootsCache = {};
        this.rootWordsCache = {};
        this.wordsCache = {};
    }

    //Public methods
    public async QueryFullVerbData(verbId: string): Promise<FullVerbData>
    {
        const verbData = await this.QueryLexeme(verbId);
        return await this.QueryFullVerbDataForVerbData(verbData!.senses[0].units[0].pos as OpenArabDictVerb);
    }

    public async QueryFullVerbDataForVerbData(verbData: OpenArabDictVerb): Promise<FullVerbData>
    {
        return {
            rootData: await this.QueryRootData(verbData.rootId),
            verbData
        };
    }

    public async QueryLexeme(lexemeId: string): Promise<LexemeAPIData | undefined>
    {
        const translationLanguage = this.pageLanguageService.activeLanguage;

        const cached = this.wordsCache[lexemeId + "-" + translationLanguage];
        if(cached !== undefined)
            return cached as LexemeAPIData;

        const response = await this.apiService.lexemes._any_.get(lexemeId, { translationLanguage });
        switch(response.statusCode)
        {
            case 200:
                break;
            case 404:
                return undefined;
            default:
                throw new Error("HERE");
        }
        this.CacheWord(response.data);

        return response.data as LexemeAPIData;
    }

    public async QueryRootData(rootId: string)
    {
        const cached = this.rootsCache[rootId];
        if(cached !== undefined)
            return cached;

        const response = await this.apiService.roots._any_.get(rootId);
        if(response.statusCode !== 200)
            throw new Error("HERE");
        this.rootsCache[rootId] = response.data as OpenArabDictRoot;
        return response.data as OpenArabDictRoot;
    }

    public async QueryRootWords(rootId: string)
    {
        const translationLanguage = this.pageLanguageService.activeLanguage;

        const response = await this.apiService.roots._any_.words.get(rootId, { translationLanguage });
        const words = response.data;

        this.rootWordsCache[rootId] = words;
        for (const word of words)
            this.CacheWord(word);

        return words;
    }

    //Private methods
    private CacheWord(data: LexemeData)
    {
        const targetLanguage = this.pageLanguageService.activeLanguage;
        this.wordsCache[data.id + "-" + targetLanguage] = data;
    }

    //State
    private rootsCache: Dictionary<OpenArabDictRoot>;
    private rootWordsCache: Dictionary<LexemeData[]>;
    private wordsCache: Dictionary<LexemeData>;
}