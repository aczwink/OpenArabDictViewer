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
import { DatabaseController, TranslationLanguage } from "./DatabaseController";
import { OpenArabDictLexeme, OpenArabDictLexicalUnit, OpenArabDictParent, OpenArabDictParentType, OpenArabDictPartOfSpeech, OpenArabDictSense, OpenArabDictTranslationEntry, OpenArabDictWordRelationshipType } from "@aczwink/openarabdict-domain";
import { LexemesIndexService } from "../services/LexemesIndexService";
import { TranslationIndexService } from "../services/TranslationIndexService";

interface WordRelation
{
    relatedWordId: string;
    relationType: OpenArabDictWordRelationshipType;
}

interface LexemeParent extends OpenArabDictParent
{
    /**
     * Either the parent root id or the parent lexeme id.
     */
    id: string;
}

interface LexicalUnit
{
    pos: OpenArabDictPartOfSpeech;
    translations: OpenArabDictTranslationEntry[];
}

interface LexemeSense
{
    units: LexicalUnit[];
}

export interface LexemeData
{
    id: string;
    parent: LexemeParent[];
    senses: LexemeSense[];
    text: string;
    derivedLexemeIds: string[];
    related: WordRelation[];
}

@Injectable
export class WordsController
{
    constructor(private dbController: DatabaseController, private wordsIndexService: LexemesIndexService, private translationIndexService: TranslationIndexService)
    {
    }

    //Public methods
    public async QueryLexeme(wordId: string, translationLanguage: TranslationLanguage)
    {
        const word = this.wordsIndexService.GetLexeme(wordId);
        if(word !== undefined)
            return await this.QueryFullWordData(word, translationLanguage);

        return undefined;
    }
    
    public async QueryRandomWordId()
    {
        const document = await this.dbController.GetDocumentDB();

        const count = document.lexemes.length;
        const index = Math.floor(count * Math.random());

        return document.lexemes[index].id;
    }

    public async QueryRootDerivedWords(rootId: string, translationLanguage: TranslationLanguage)
    {
        function filterFunc(x: OpenArabDictLexeme)
        {
            return x.parent.find(x => (x.type === OpenArabDictParentType.Root) && (x.id === rootId)) !== undefined;
        }

        const document = await this.dbController.GetDocumentDB();

        const words = document.lexemes.Values().Filter(filterFunc);

        return words.Map(x => this.QueryFullWordData(x, translationLanguage));
    }

    //Private methods
    private MapSenses(senses: OpenArabDictSense[], translationLanguage: TranslationLanguage): LexemeSense[]
    {
        const ctx = this;
        function MapUnit(unit: OpenArabDictLexicalUnit): LexicalUnit
        {
            return {
                pos: unit.pos,
                translations: ctx.translationIndexService.GetTranslationsOf(unit.id, translationLanguage),
            };
        }

        return senses.map(x => ({
            units: x.units.map(MapUnit)
        }));
    }

    private async QueryFullWordData(lexeme: OpenArabDictLexeme, translationLanguage: TranslationLanguage)
    {
        const result: LexemeData = {
            id: lexeme.id,
            parent: lexeme.parent.map(x => ({ type: x.type, id: (x.type === OpenArabDictParentType.Root ? x.id : this.wordsIndexService.GetLexemeFromLexicalUnitId(x.id)!.id) })),
            senses: this.MapSenses(lexeme.senses, translationLanguage),
            text: lexeme.text,
            derivedLexemeIds: this.wordsIndexService.GetChildLexemes(lexeme.id).ToArray(),
            related: await this.QueryRelatedWords(lexeme.id),
        };

        return result;
    }

    private async QueryRelatedWords(wordId: string)
    {
        const document = await this.dbController.GetDocumentDB();

        return document.wordRelations.Values().Filter(x => (x.word1Id === wordId) || (x.word2Id === wordId)).Map<WordRelation>(x => ({
            relatedWordId: x.word1Id === wordId ? x.word2Id : x.word1Id,
            relationType: x.relationship
        })).ToArray();
    }
}