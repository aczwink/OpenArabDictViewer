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

import { Injectable } from "@aczwink/acts-util-node";
import { DatabaseController } from "../data-access/DatabaseController";
import { Dictionary } from "@aczwink/acts-util-core";
import { OpenArabDictLexeme, OpenArabDictParent, OpenArabDictParentType } from "@aczwink/openarabdict-domain";

type ChildLink = OpenArabDictParent & { childLexemeId: string; }

@Injectable
export class LexemesIndexService
{
    constructor(private databaseController: DatabaseController)
    {
        this.childLexemesOfLexicalUnitsMap = {};
        this.lexemeMap = {};
        this.lexicalUnitToLexemeMap = {};
    }

    //Public methods
    public GetChildLexemes(lexicalUnitId: string)
    {
        return this.childLexemesOfLexicalUnitsMap[lexicalUnitId]?.map(x => x.childLexemeId) ?? [];
    }

    public GetChildLinksOf(lexemeId: string)
    {
        const lexeme = this.GetLexeme(lexemeId);
        return lexeme.senses.Values().Map(x => x.units.Values()).Flatten().Map(x => (this.childLexemesOfLexicalUnitsMap[x.id] ?? []).Values()).Flatten();
    }

    public GetLexeme(lexemeId: string)
    {
        return this.lexemeMap[lexemeId]!;
    }

    public GetLexemeFromLexicalUnitId(lexicalUnitId: string)
    {
        return this.lexicalUnitToLexemeMap[lexicalUnitId];
    }
    
    public async RebuildIndex()
    {
        const document = await this.databaseController.GetDocumentDB();

        for (const lexeme of document.lexemes)
        {
            this.lexemeMap[lexeme.id] = lexeme;

            for (const sense of lexeme.senses)
            {
                for (const unit of sense.units)
                    this.lexicalUnitToLexemeMap[unit.id] = lexeme;
            }

            for (const parent of lexeme.parent)
            {
                if(parent.type !== OpenArabDictParentType.Root)
                    this.AddDerivationLink(lexeme.id, parent);
            }
        }
    }

    //Private methods
    private AddDerivationLink(lexemeId: string, parent: OpenArabDictParent)
    {
        const link: ChildLink = {...parent, childLexemeId: lexemeId};
        const parentLexicalUnitId = parent.id;

        const children = this.childLexemesOfLexicalUnitsMap[parentLexicalUnitId];
        if(children === undefined)
            this.childLexemesOfLexicalUnitsMap[parentLexicalUnitId] = [link];
        else
            children.push(link);
    }

    //State
    private childLexemesOfLexicalUnitsMap: Dictionary<ChildLink[]>;
    private lexemeMap: Dictionary<OpenArabDictLexeme>;
    private lexicalUnitToLexemeMap: Dictionary<OpenArabDictLexeme>;
}