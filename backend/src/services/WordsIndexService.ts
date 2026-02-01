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
import { OpenArabDictWord, OpenArabDictWordParent, OpenArabDictWordParentType } from "openarabdict-domain";

type ChildLink = OpenArabDictWordParent & { childWordId: string; }

@Injectable
export class WordsIndexService
{
    constructor(private databaseController: DatabaseController)
    {
        this.childrenMap = {};
        this.wordMap = {};
    }

    //Public methods
    public GetChildrenOf(wordId: string)
    {
        return this.childrenMap[wordId] ?? [];
    }

    public GetWord(wordId: string)
    {
        return this.wordMap[wordId]!;
    }
    
    public async RebuildIndex()
    {
        const document = await this.databaseController.GetDocumentDB();

        for (const word of document.words)
        {
            this.wordMap[word.id] = word;

            if(word.parent?.type === OpenArabDictWordParentType.NonVerbWord)
                this.AddDerivationLink(word.id, word.parent.wordId, word.parent);
            else if(word.parent?.type === OpenArabDictWordParentType.Verb)
                this.AddDerivationLink(word.id, word.parent.verbId, word.parent);
        }
    }

    //Private methods
    private AddDerivationLink(wordId: string, parentWordId: string, parent: OpenArabDictWordParent)
    {
        const link = {...parent, childWordId: wordId};

        const children = this.childrenMap[parentWordId];
        if(children === undefined)
            this.childrenMap[parentWordId] = [link];
        else
            children.push(link);
    }

    //State
    private childrenMap: Dictionary<ChildLink[]>;
    private wordMap: Dictionary<OpenArabDictWord>;
}