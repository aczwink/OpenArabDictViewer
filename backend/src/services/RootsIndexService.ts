/**
 * OpenArabDictViewer
 * Copyright (C) 2025 Amir Czwink (amir130@hotmail.de)
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
import { DatabaseController } from "../data-access/DatabaseController";
import { Dictionary } from "acts-util-core";
import { OpenArabDictRoot } from "openarabdict-domain";

@Injectable
export class RootsIndexService
{
    constructor(private databaseController: DatabaseController)
    {
        this.roots = {};
    }

    //Public methods
    public GetRoot(id: number)
    {
        return this.roots[id];
    }
    
    public async RebuildIndex()
    {
        const document = await this.databaseController.GetDocumentDB();

        const dict: Dictionary<OpenArabDictRoot> = {};
        for (const root of document.roots)
            dict[root.id] = root;
        this.roots = dict;
    }

    //State
    private roots: Dictionary<OpenArabDictRoot>;
}