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
import fs from "fs";
import path from "path";
import { Injectable } from "@aczwink/acts-util-node";
import { OpenArabDictDocument, OpenArabDictTranslationDocument } from "openarabdict-domain";
import ENV from "../env";
import { Dictionary } from "@aczwink/acts-util-core";

export type TranslationLanguage = "en" | "de";

@Injectable
export class DatabaseController
{
    constructor()
    {
        this.translationDocumentDBs = {};
    }

    //Public methods
    public async GetDocumentDB()
    {
        if(this.documentDB === undefined)
        {
            const filePath = path.join(ENV.documentDBsPath, "dict.json");
            const data = await fs.promises.readFile(filePath, "utf-8");
            const document = JSON.parse(data) as OpenArabDictDocument;
            this.documentDB = document;
            return document;
        }
        return this.documentDB;
    }

    public async GetTranslationsDocumentDB(translationLanguage: TranslationLanguage)
    {
        const document = this.translationDocumentDBs[translationLanguage];
        if(document === undefined)
        {
            const filePath = path.join(ENV.documentDBsPath, translationLanguage + ".json");
            const data = await fs.promises.readFile(filePath, "utf-8");
            const document = JSON.parse(data) as OpenArabDictTranslationDocument;
            this.translationDocumentDBs[translationLanguage] = document;
            return document;
        }
        return document;
    }

    //Private state
    private documentDB: OpenArabDictDocument | undefined;
    private translationDocumentDBs: Dictionary<OpenArabDictTranslationDocument>;
}