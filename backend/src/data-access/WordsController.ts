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
import { DatabaseController, TranslationLanguage } from "./DatabaseController";
import { OpenArabDictWord, OpenArabDictWordParentType, OpenArabDictWordRelationshipType } from "openarabdict-domain";

interface WordRelation
{
    relatedWordId: string;
    relationType: OpenArabDictWordRelationshipType;
}

export interface FullWordData
{
    word: OpenArabDictWord;
    derived: string[];
    related: WordRelation[];
}

@Injectable
export class WordsController
{
    constructor(private dbController: DatabaseController)
    {
    }

    //Public methods
    public async QueryRandomWordId(translationLanguage: TranslationLanguage)
    {
        const document = await this.dbController.GetDocumentDB(translationLanguage);

        const count = document.words.length;
        const index = Math.floor(count * Math.random());

        return document.words[index].id;
    }

    public async QueryRootDerivedWords(rootId: string, translationLanguage: TranslationLanguage)
    {
        function filterFunc(x: OpenArabDictWord)
        {
            return (x.parent?.type === OpenArabDictWordParentType.Root) && (x.parent.rootId === rootId);
        }

        const document = await this.dbController.GetDocumentDB(translationLanguage);

        const words = document.words.Values().Filter(filterFunc);

        return words.Map(x => this.QueryFullWordData(x, translationLanguage));
    }

    public async QueryWord(wordId: string, translationLanguage: TranslationLanguage)
    {
        const document = await this.dbController.GetDocumentDB(translationLanguage);

        const word = document.words.find(x => x.id === wordId);
        if(word !== undefined)
            return await this.QueryFullWordData(word, translationLanguage);

        return undefined;
    }

    //Private methods
    private async QueryDerivedLinks(wordId: string, translationLanguage: TranslationLanguage)
    {
        function filterFunc(x: OpenArabDictWord)
        {
            if((x.parent?.type === OpenArabDictWordParentType.NonVerbWord) && (x.parent.wordId === wordId))
                return true;
            if((x.parent?.type === OpenArabDictWordParentType.Verb) && (x.parent.verbId === wordId))
                return true;
            return false;
        }

        const document = await this.dbController.GetDocumentDB(translationLanguage);

        const children = document.words.filter(filterFunc).map(x => x.id);
        return children;
    }

    private async QueryFullWordData(word: OpenArabDictWord, translationLanguage: TranslationLanguage)
    {
        const result: FullWordData = {
            word,
            derived: await this.QueryDerivedLinks(word.id, translationLanguage),
            related: await this.QueryRelatedWords(word.id, translationLanguage),
        };

        return result;
    }

    private async QueryRelatedWords(wordId: string, translationLanguage: TranslationLanguage)
    {
        const document = await this.dbController.GetDocumentDB(translationLanguage);

        return document.wordRelations.Values().Filter(x => (x.word1Id === wordId) || (x.word2Id === wordId)).Map<WordRelation>(x => ({
            relatedWordId: x.word1Id === wordId ? x.word2Id : x.word1Id,
            relationType: x.relationship
        })).ToArray();
    }
}