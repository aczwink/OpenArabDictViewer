/**
 * OpenArabDictViewer
 * Copyright (C) 2026 Amir Czwink (amir130@hotmail.de)
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
import { DatabaseController, TranslationLanguage } from "../data-access/DatabaseController";
import { Dictionary } from "acts-util-core";
import { OpenArabDictTranslationEntry } from "openarabdict-domain";

@Injectable
export class TranslationIndexService
{
    constructor(private databaseController: DatabaseController)
    {
        this.translationsMap = {};
    }

    public GetTranslationsOf(wordId: string, translationLanguage: TranslationLanguage)
    {
        return this.translationsMap[translationLanguage]![wordId]!;
    }

    public async RebuildIndex()
    {
        const langs: TranslationLanguage[] = ["de", "en"];
        for (const lang of langs)
        {
            const document = await this.databaseController.GetTranslationsDocumentDB(lang);

            const map: Dictionary<OpenArabDictTranslationEntry[]> = {};
            for (const entry of document.entries)
                map[entry.wordId] = entry.translations;
            this.translationsMap[lang] = map;
        }
    }

    //State
    private translationsMap: Dictionary<Dictionary<OpenArabDictTranslationEntry[]>>;
}